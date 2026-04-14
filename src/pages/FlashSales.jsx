import { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { ProductEntity, FlashSaleEntity } from '@/hooks/useEntities';;
import { Zap, RefreshCw, Check, X, Sparkles, Tag, Clock } from "lucide-react";
import { differenceInDays } from "date-fns";

const statusStyle = {
  suggested: "bg-purple-100 text-purple-700",
  approved: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  ended: "bg-slate-100 text-slate-500",
};

export default function FlashSales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("active");

  useEffect(() => {
    loadData();
    supabase.auth.getUser().then(({data}) => setUser(data.user));
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [s, p] = await Promise.all([
      FlashSaleEntity.list("-created_date"),
      ProductEntity.list(),
    ]);
    setSales(s);
    setProducts(p);
    setLoading(false);
  };

  const generateSuggestions = async () => {
    setGenerating(true);
    const today = new Date();
    const in30Days = new Date(today); in30Days.setDate(today.getDate() + 30);

    const expiring = products.filter(p => {
      if (!p.expiration_date || !p.retail_price) return false;
      const exp = new Date(p.expiration_date);
      return exp <= in30Days && exp >= today && p.quantity_on_hand > 0;
    });

    if (expiring.length === 0) {
      alert("No expiring products with prices found to create flash sale suggestions.");
      setGenerating(false);
      return;
    }

    // Build AI prompt
    const productList = expiring.map(p => ({
      name: p.name,
      id: p.id,
      retail_price: p.retail_price,
      quantity: p.quantity_on_hand,
      expiration_date: p.expiration_date,
      days_until_expiry: differenceInDays(new Date(p.expiration_date), today),
      category: p.category,
    }));

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an inventory management AI. Analyze these expiring products and generate flash sale suggestions to minimize waste and maximize revenue recovery.

Products expiring soon:
${JSON.stringify(productList, null, 2)}

For each product, generate a flash sale suggestion with:
- A discount percentage (more aggressive discounts for sooner expiry: 0-7 days = 30-50%, 8-14 days = 20-35%, 15-30 days = 10-25%)
- A compelling sale reason (short, punchy marketing copy)
- Suggested start date (today: ${today.toISOString().split("T")[0]})
- Suggested end date (1-3 days before expiry)

Return a JSON array of flash sale suggestions.`,
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                product_id: { type: "string" },
                product_name: { type: "string" },
                discount_percent: { type: "number" },
                reason: { type: "string" },
                start_date: { type: "string" },
                end_date: { type: "string" },
              }
            }
          }
        }
      }
    });

    // Create flash sale records
    const suggestions = result.suggestions || [];
    for (const s of suggestions) {
      const prod = expiring.find(p => p.id === s.product_id || p.name === s.product_name);
      if (!prod) continue;
      const discount = Math.min(Math.max(s.discount_percent, 5), 70);
      const salePrice = +(prod.retail_price * (1 - discount / 100)).toFixed(2);

      await FlashSaleEntity.create({
        product_id: prod.id,
        product_name: prod.name,
        original_price: prod.retail_price,
        sale_price: salePrice,
        discount_percent: discount,
        reason: s.reason,
        expiration_date: prod.expiration_date,
        status: "suggested",
        start_date: s.start_date,
        end_date: s.end_date,
      });
    }

    setGenerating(false);
    loadData();
  };

  const updateStatus = async (id, newStatus) => {
    await FlashSaleEntity.update(id, { status: newStatus });
    setSales(sales.map(s => s.id === id ? { ...s, status: newStatus } : s));
  };

  const deleteSale = async (id) => {
    if (!confirm("Delete this flash sale?")) return;
    await FlashSaleEntity.delete(id);
    setSales(sales.filter(s => s.id !== id));
  };

  const isManager = user?.role === "manager";
  const tabs = ["suggested", "active", "approved", "ended"];
  const filtered = sales.filter(s => s.status === tab);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Flash Sales</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">AI-suggested deals to clear expiring inventory</p>
        </div>
        {isManager && (
          <button
            onClick={generateSuggestions}
            disabled={generating}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-slate-900 font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
          >
            {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? "Generating..." : "AI Suggest"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 rounded-xl p-1">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
              tab === t ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {t}
            {sales.filter(s => s.status === t).length > 0 && (
              <span className="ml-1 text-xs">({sales.filter(s => s.status === t).length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 h-36 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 py-16 text-center">
          <Zap className="w-10 h-10 mx-auto text-slate-200 dark:text-slate-600 mb-2" />
          <p className="text-slate-400 dark:text-slate-500 text-sm">No {tab} flash sales</p>
          {tab === "suggested" && isManager && (
            <p className="text-slate-400 text-xs mt-1">Click "AI Suggest" to generate sale recommendations</p>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map(sale => (
            <div key={sale.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{sale.product_name}</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">{sale.reason}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusStyle[sale.status]}`}>
                  {sale.status}
                </span>
              </div>

              <div className="flex items-center gap-4 py-2 border-y border-slate-100 dark:border-slate-700">
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Original</p>
                  <p className="font-medium text-slate-500 dark:text-slate-400 line-through">${sale.original_price?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Sale Price</p>
                  <p className="font-bold text-green-600">${sale.sale_price?.toFixed(2)}</p>
                </div>
                <div className="ml-auto">
                  <span className="bg-red-100 text-red-700 font-bold text-sm px-2 py-1 rounded-lg">
                    -{sale.discount_percent?.toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                {sale.start_date} — {sale.end_date}
                {sale.expiration_date && (
                  <span className="ml-auto text-orange-500">
                    Exp: {sale.expiration_date}
                  </span>
                )}
              </div>

              {isManager && (
                <div className="flex gap-2 pt-1">
                  {sale.status === "suggested" && (
                    <>
                      <button onClick={() => updateStatus(sale.id, "active")}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors">
                        <Check className="w-3 h-3" /> Approve & Activate
                      </button>
                      <button onClick={() => deleteSale(sale.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {sale.status === "active" && (
                    <button onClick={() => updateStatus(sale.id, "ended")}
                      className="flex-1 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors">
                      End Sale
                    </button>
                  )}
                  {(sale.status === "approved" || sale.status === "ended") && (
                    <button onClick={() => deleteSale(sale.id)}
                      className="flex-1 py-1.5 border border-red-100 text-red-500 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors">
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

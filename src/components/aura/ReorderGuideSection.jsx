import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ShoppingCart, RefreshCw, Package, CheckCircle } from "lucide-react";

const priorityStyle = {
  HIGH: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  LOW: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

export default function ReorderGuideSection() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generate = async () => {
    setLoading(true);
    setResult(null);
    const res = await base44.functions.invoke("aiReorderGuide", {});
    setResult(res.data);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Reorder Guide</h2>
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
            {loading ? "Generating..." : "Generate Reorder Guide"}
          </button>
        </div>
        <p className="text-slate-500 text-sm">AI analyzes low stock products and creates prioritized reorder recommendations grouped by supplier.</p>
      </div>

      {loading && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-10 flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
          <p className="text-slate-500 text-sm">AuraAI is analyzing your inventory...</p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4">
          {/* Summary Banner */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-slate-800 dark:text-slate-100 font-medium text-sm">{result.message || result.summary}</p>
              {result.orders_created > 0 && (
                <p className="text-amber-700 dark:text-amber-300 text-xs mt-1 font-medium">
                  ✓ {result.orders_created} draft order{result.orders_created !== 1 ? "s" : ""} created in Orders
                </p>
              )}
            </div>
          </div>

          {/* Table */}
          {result.recommendations?.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Product</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Supplier</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Qty to Order</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Priority</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                    {result.recommendations.map((rec, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{rec.product_name}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{rec.supplier}</td>
                        <td className="px-4 py-3 text-center font-bold text-slate-800 dark:text-slate-100">{rec.quantity_to_order}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${priorityStyle[rec.priority] || priorityStyle.LOW}`}>
                            {rec.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{rec.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
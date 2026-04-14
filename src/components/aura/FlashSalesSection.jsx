import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Zap, RefreshCw, CheckCircle, Tag } from "lucide-react";

const priorityStyle = {
  HIGH: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  LOW: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

const typeStyle = {
  OVERSTOCK: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  EXPIRING: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
};

export default function FlashSalesSection() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generate = async () => {
    setLoading(true);
    setResult(null);
    const res = await base44.functions.invoke("aiFlashSales", {});
    setResult(res.data);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Flash Sale Recommendations</h2>
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {loading ? "Generating..." : "Generate Flash Sale Recommendations"}
          </button>
        </div>
        <p className="text-slate-500 text-sm">AI identifies overstock and expiring items and recommends strategic flash sales to maximize revenue.</p>
      </div>

      {loading && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-10 flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
          <p className="text-slate-500 text-sm">AuraAI is crafting flash sale strategy...</p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-slate-800 dark:text-slate-100 font-medium text-sm">{result.message || result.summary}</p>
              {result.flash_sales_created > 0 && (
                <p className="text-amber-700 dark:text-amber-300 text-xs mt-1 font-medium">
                  ✓ {result.flash_sales_created} flash sale suggestion{result.flash_sales_created !== 1 ? "s" : ""} added to Flash Sales
                </p>
              )}
            </div>
          </div>

          {result.recommendations?.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {result.recommendations.map((rec, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{rec.product_name}</p>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeStyle[rec.type] || typeStyle.OVERSTOCK}`}>
                        {rec.type}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${priorityStyle[rec.priority] || priorityStyle.LOW}`}>
                        {rec.priority}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-xs text-slate-400">Original</p>
                      <p className="font-bold text-slate-500 line-through text-sm">${rec.original_price?.toFixed(2)}</p>
                    </div>
                    <Tag className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div className="text-center">
                      <p className="text-xs text-slate-400">Sale Price</p>
                      <p className="font-bold text-green-600 dark:text-green-400 text-lg">${rec.recommended_sale_price?.toFixed(2)}</p>
                    </div>
                    <div className="ml-auto text-center">
                      <p className="text-xs text-slate-400">Discount</p>
                      <p className="font-bold text-red-500 text-base">{rec.recommended_discount_percent}% OFF</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-50 dark:border-slate-700">
                    <span>Duration: <span className="font-medium text-slate-700 dark:text-slate-300">{rec.sale_duration_days} days</span></span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">"{rec.reason}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
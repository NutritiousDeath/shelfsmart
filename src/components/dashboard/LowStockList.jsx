import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { AlertTriangle, ArrowRight } from "lucide-react";

export default function LowStockList({ products, outOfStock, loading }) {
  const combined = [
    ...outOfStock.map(p => ({ ...p, _type: "out" })),
    ...products.map(p => ({ ...p, _type: "low" })),
  ].slice(0, 6);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Stock Alerts</h3>
        </div>
        <Link to={createPageUrl("Inventory")} className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="p-3 space-y-1">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />
          ))
        ) : combined.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">All stock levels are good ✓</div>
        ) : (
          combined.map(p => (
            <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700">
              <div>
                <p className="text-slate-800 dark:text-slate-100 text-sm font-medium">{p.name}</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs">{p.category || "Uncategorized"}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  p._type === "out" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {p._type === "out" ? "OUT" : `${p.quantity_on_hand} left`}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
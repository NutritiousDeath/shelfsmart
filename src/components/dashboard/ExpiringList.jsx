import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Clock, ArrowRight } from "lucide-react";
import { differenceInDays } from "date-fns";

export default function ExpiringList({ products, loading }) {
  const sorted = [...products].sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date)).slice(0, 6);

  const getDaysLeft = (dateStr) => {
    return differenceInDays(new Date(dateStr), new Date());
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Expiring Soon (30 days)</h3>
        </div>
        <Link to={createPageUrl("FlashSales")} className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1">
          Flash sales <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="p-3 space-y-1">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />
          ))
        ) : sorted.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">No items expiring within 30 days ✓</div>
        ) : (
          sorted.map(p => {
            const days = getDaysLeft(p.expiration_date);
            return (
              <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700">
                <div>
                  <p className="text-slate-800 dark:text-slate-100 text-sm font-medium">{p.name}</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs">Qty: {p.quantity_on_hand}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  days <= 3 ? "bg-red-100 text-red-700" :
                  days <= 7 ? "bg-orange-100 text-orange-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {days <= 0 ? "EXPIRED" : `${days}d`}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
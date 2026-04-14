import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { AlertTriangle, ArrowRight, Flame, Clock } from "lucide-react";
import { differenceInDays } from "date-fns";

export default function ExpiryAlertBanner({ products }) {
  if (!products || products.length === 0) return null;

  const critical = products.filter(p => differenceInDays(new Date(p.expiration_date), new Date()) <= 2);
  const warning = products.filter(p => {
    const d = differenceInDays(new Date(p.expiration_date), new Date());
    return d > 2 && d <= 7;
  });

  return (
    <div className="space-y-2">
      {critical.length > 0 && (
        <div className="bg-red-600 rounded-2xl p-4 flex items-start justify-between gap-3 animate-pulse-once">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">
                🚨 CRITICAL: {critical.length} item{critical.length > 1 ? "s" : ""} expire within 48 hours!
              </p>
              <div className="mt-1 space-y-0.5">
                {critical.map(p => (
                  <p key={p.id} className="text-red-100 text-xs">
                    • <span className="font-semibold">{p.name}</span> — expires {p.expiration_date} (qty: {p.quantity_on_hand})
                  </p>
                ))}
              </div>
            </div>
          </div>
          <Link
            to={createPageUrl("FlashSales")}
            className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 flex-shrink-0"
          >
            Flash Sales <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {warning.length > 0 && (
        <div className="bg-orange-500 rounded-2xl p-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">
                ⚠️ {warning.length} item{warning.length > 1 ? "s" : ""} expire within 7 days
              </p>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                {warning.map(p => {
                  const d = differenceInDays(new Date(p.expiration_date), new Date());
                  return (
                    <p key={p.id} className="text-orange-100 text-xs">
                      • <span className="font-semibold">{p.name}</span> ({d}d left)
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
          <Link
            to={createPageUrl("FlashSales")}
            className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 flex-shrink-0"
          >
            View <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
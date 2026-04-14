import { X, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

function UrgencyBadge({ urgency }) {
  if (urgency === "EXPIRED")  return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">EXPIRED</span>;
  if (urgency === "CRITICAL") return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">CRITICAL</span>;
  return null;
}

export default function DairyAlertModal({ items, onDismiss }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Dairy Alert — Action Required</h3>
              <p className="text-xs text-slate-500">{items.length} item{items.length !== 1 ? "s" : ""} need immediate attention</p>
            </div>
          </div>
          <button onClick={onDismiss} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Items */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {items.map((item, i) => (
            <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${
              item.urgency === "EXPIRED" ? "bg-red-50 border-red-100" : "bg-orange-50 border-orange-100"
            }`}>
              <div>
                <p className="font-medium text-slate-800 text-sm">{item.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {item.expiration_date ? `Expires: ${item.expiration_date}` : ""}
                  {item.location ? ` · ${item.location}` : ""}
                  {` · Qty: ${item.quantity_on_hand}`}
                </p>
              </div>
              <UrgencyBadge urgency={item.urgency} />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={onDismiss}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold transition-colors"
          >
            Acknowledged — Dismiss for Today
          </button>
        </div>
      </div>
    </div>
  );
}
import { format } from "date-fns";
import { Package, Zap, AlertTriangle, Calendar, X } from "lucide-react";

const TYPE_CONFIG = {
  order: { icon: Package, color: "text-teal-600", bg: "bg-teal-50", label: "Order Delivery" },
  flashsale: { icon: Zap, color: "text-amber-600", bg: "bg-amber-50", label: "Flash Sale" },
  expiry: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", label: "Expiring Product" },
  custom: { icon: Calendar, color: "text-purple-600", bg: "bg-purple-50", label: "Custom Event" },
};

function EventList({ events }) {
  if (events.length === 0) {
    return <p className="text-slate-400 text-xs py-4 text-center">No events this day</p>;
  }
  return (
    <div className="space-y-2">
      {events.map((e, i) => {
        const cfg = TYPE_CONFIG[e.type] || TYPE_CONFIG.custom;
        const Icon = cfg.icon;
        return (
          <div key={i} className={`${cfg.bg} rounded-xl p-3 flex gap-3`}>
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
              <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{e.title}</p>
              <p className={`text-xs ${cfg.color} font-medium`}>{cfg.label}</p>
              {e.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{e.description}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function EventSidebar({ selectedDay, events, onClose }) {
  if (!selectedDay) return null;

  const title = format(selectedDay, "EEEE, MMM d");

  return (
    <>
      {/* Mobile: bottom sheet */}
      <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-white dark:bg-slate-800 rounded-t-3xl shadow-xl p-5 space-y-3 max-h-[70vh] flex flex-col z-50">
          <div className="w-10 h-1 bg-slate-200 dark:bg-slate-600 rounded-full mx-auto mb-1" />
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">{title}</h4>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1">
            <EventList events={events} />
          </div>
        </div>
      </div>

      {/* Desktop: sidebar card */}
      <div className="hidden lg:block bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{title}</h4>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
        <EventList events={events} />
      </div>
    </>
  );
}
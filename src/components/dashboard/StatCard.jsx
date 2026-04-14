import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function StatCard({ icon: Icon, label, value, color = "blue", alert = false, loading, linkTo }) {
  const colors = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", icon: "text-blue-500" },
    amber: { bg: "bg-amber-50", text: "text-amber-700", icon: "text-amber-500" },
    red: { bg: "bg-red-50", text: "text-red-700", icon: "text-red-500" },
    orange: { bg: "bg-orange-50", text: "text-orange-700", icon: "text-orange-500" },
    green: { bg: "bg-green-50", text: "text-green-700", icon: "text-green-500" },
  };

  const c = colors[color];
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl p-4 border ${alert && value > 0 ? "border-red-200 dark:border-red-800" : "border-slate-100 dark:border-slate-700"} shadow-sm flex flex-col`}>
      <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${c.icon}`} />
      </div>
      {loading ? (
        <div className="h-8 bg-slate-100 rounded animate-pulse w-16 mb-1" />
      ) : (
        <p className={`text-2xl font-bold ${alert && value > 0 ? c.text : "text-slate-800 dark:text-slate-100"}`}>{value}</p>
      )}
      <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 flex-1">{label}</p>
      {linkTo && (
        <Link
          to={linkTo}
          className={`mt-3 flex items-center justify-center gap-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${c.bg} ${c.text} hover:opacity-80`}
        >
          View <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}
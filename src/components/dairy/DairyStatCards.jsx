import { Package, AlertTriangle, Clock, ShoppingBag, TrendingDown } from "lucide-react";

const cards = [
  { key: "total_dairy_products", label: "Total Dairy", color: "blue", icon: Package },
  { key: "expired_count",        label: "Expired",     color: "red",    icon: AlertTriangle },
  { key: "critical_count",       label: "Critical (3d)", color: "orange", icon: Clock },
  { key: "warning_count",        label: "Warning (14d)", color: "yellow", icon: ShoppingBag },
  { key: "low_stock_count",      label: "Low Stock",   color: "purple", icon: TrendingDown },
];

const colorMap = {
  blue:   "bg-blue-50   border-blue-100   text-blue-600",
  red:    "bg-red-50    border-red-100    text-red-600",
  orange: "bg-orange-50 border-orange-100 text-orange-600",
  yellow: "bg-yellow-50 border-yellow-100 text-yellow-600",
  purple: "bg-purple-50 border-purple-100 text-purple-600",
};

const numColor = {
  blue:   "text-blue-700",
  red:    "text-red-700",
  orange: "text-orange-700",
  yellow: "text-yellow-700",
  purple: "text-purple-700",
};

export default function DairyStatCards({ summary, loading }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map(({ key, label, color, icon: CardIcon }) => (
        <div key={key} className={`rounded-2xl border p-4 ${colorMap[color]}`}>
          <div className="flex items-center gap-2 mb-2">
            <CardIcon className={`w-4 h-4 ${colorMap[color].split(" ")[2]}`} />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
          </div>
          {loading ? (
            <div className="h-7 w-10 bg-slate-200 rounded animate-pulse" />
          ) : (
            <p className={`text-2xl font-bold ${numColor[color]}`}>{summary?.[key] ?? 0}</p>
          )}
        </div>
      ))}
    </div>
  );
}
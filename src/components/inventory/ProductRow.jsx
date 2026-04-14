import { Edit2, Trash2 } from "lucide-react";
import { differenceInDays } from "date-fns";

const statusStyle = {
  in_stock: "bg-green-100 text-green-700",
  low_stock: "bg-amber-100 text-amber-700",
  out_of_stock: "bg-red-100 text-red-700",
  discontinued: "bg-slate-100 text-slate-500",
};

export default function ProductRow({ product: p, isManager, onEdit, onDelete }) {
  const daysToExpiry = p.expiration_date ? differenceInDays(new Date(p.expiration_date), new Date()) : null;

  return (
    <>
      {/* Mobile card view */}
      <tr className="sm:hidden">
        <td colSpan={10} className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-slate-800 dark:text-slate-100 text-sm">{p.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[p.status] || statusStyle.in_stock}`}>
                  {p.status?.replace("_", " ") || "in stock"}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                <span className="capitalize">{p.category?.replace("_", " ") || "—"}</span>
                <span className={`font-bold ${
                  p.quantity_on_hand === 0 ? "text-red-600" :
                  p.quantity_on_hand <= p.min_stock_level ? "text-amber-600" :
                  "text-slate-700"
                }`}>
                  qty: {p.quantity_on_hand}
                </span>
                {p.retail_price && <span>${p.retail_price.toFixed(2)}</span>}
                {daysToExpiry !== null && (
                  <span className={daysToExpiry <= 7 ? "text-red-500 font-medium" : ""}>
                    {daysToExpiry <= 0 ? "EXPIRED" : `exp ${daysToExpiry}d`}
                  </span>
                )}
              </div>
            </div>
            {isManager && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => onEdit(p)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(p.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </td>
      </tr>

      {/* Desktop table row */}
      <tr className="hidden sm:table-row hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
        <td className="px-4 py-3">
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-100">{p.name}</p>
            <p className="text-slate-400 dark:text-slate-500 text-xs capitalize">{p.category?.replace("_", " ") || "—"}</p>
          </div>
        </td>
        <td className="px-4 py-3 hidden md:table-cell">
          <p className="text-slate-600 dark:text-slate-400 font-mono text-xs">{p.upc || "—"}</p>
          <p className="text-slate-400 dark:text-slate-500 text-xs">{p.sku || "—"}</p>
        </td>
        <td className="px-4 py-3">
          <span className={`font-bold text-sm ${
            p.quantity_on_hand === 0 ? "text-red-600" :
            p.quantity_on_hand <= p.min_stock_level ? "text-amber-600" :
            "text-slate-800 dark:text-slate-100"
          }`}>
            {p.quantity_on_hand}
          </span>
          <span className="text-slate-400 dark:text-slate-500 text-xs ml-1">/ {p.min_stock_level} min</span>
        </td>
        <td className="px-4 py-3 hidden sm:table-cell">
          <p className="text-slate-700 dark:text-slate-300">${p.retail_price?.toFixed(2) || "—"}</p>
          <p className="text-slate-400 dark:text-slate-500 text-xs">cost: ${p.unit_cost?.toFixed(2) || "—"}</p>
        </td>
        <td className="px-4 py-3 hidden lg:table-cell">
          {daysToExpiry !== null ? (
            <span className={`text-xs font-medium ${
              daysToExpiry <= 3 ? "text-red-600" :
              daysToExpiry <= 7 ? "text-orange-600" :
              daysToExpiry <= 30 ? "text-yellow-600" :
              "text-slate-500"
            }`}>
              {daysToExpiry <= 0 ? "EXPIRED" : `${daysToExpiry}d`}
            </span>
          ) : <span className="text-slate-300">—</span>}
        </td>
        <td className="px-4 py-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[p.status] || statusStyle.in_stock}`}>
            {p.status?.replace("_", " ") || "in stock"}
          </span>
        </td>
        {isManager && (
          <td className="px-4 py-3 text-right">
            <div className="flex items-center justify-end gap-1">
              <button onClick={() => onEdit(p)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onDelete(p.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </td>
        )}
      </tr>
    </>
  );
}
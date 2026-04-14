import { format, parseISO, isValid } from "date-fns";

const today = new Date();
today.setHours(0, 0, 0, 0);
const threeDays = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
const fourteenDays = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

function getRowStyle(product) {
  if (!product.expiration_date) return "";
  const exp = new Date(product.expiration_date);
  exp.setHours(0, 0, 0, 0);
  if (exp < today)        return "bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400";
  if (exp <= threeDays)   return "bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-400";
  if (exp <= fourteenDays) return "bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-300";
  return "bg-green-50 dark:bg-green-900/20 border-l-4 border-green-300";
}

function StatusBadge({ product }) {
  if (!product.expiration_date) return <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">No Date</span>;
  const exp = new Date(product.expiration_date);
  exp.setHours(0, 0, 0, 0);
  if (exp < today)        return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Expired</span>;
  if (exp <= threeDays)   return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Critical</span>;
  if (exp <= fourteenDays) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Warning</span>;
  return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Good</span>;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = parseISO(dateStr);
    return isValid(d) ? format(d, "MMM d, yyyy") : dateStr;
  } catch { return dateStr; }
}

export default function DairyProductTable({ products }) {
  if (!products || products.length === 0) {
    return <p className="text-center text-slate-400 dark:text-slate-500 text-sm py-8">No products in this subcategory.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-700">
            <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 dark:text-slate-400">Product Name</th>
            <th className="text-center py-2 px-3 text-xs font-medium text-slate-500 dark:text-slate-400">Qty</th>
            <th className="text-center py-2 px-3 text-xs font-medium text-slate-500 dark:text-slate-400">Min Stock</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 dark:text-slate-400">Expiration</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 dark:text-slate-400">Location</th>
            <th className="text-center py-2 px-3 text-xs font-medium text-slate-500 dark:text-slate-400">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
          {products.map((p, i) => (
            <tr key={p.id || i} className={`${getRowStyle(p)} transition-colors`}>
              <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-100">{p.name}</td>
              <td className="py-2.5 px-3 text-center text-slate-700 dark:text-slate-300">{p.quantity_on_hand ?? "—"}</td>
              <td className="py-2.5 px-3 text-center text-slate-500 dark:text-slate-400">{p.min_stock_level ?? "—"}</td>
              <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{formatDate(p.expiration_date)}</td>
              <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{p.location || "—"}</td>
              <td className="py-2.5 px-3 text-center"><StatusBadge product={p} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
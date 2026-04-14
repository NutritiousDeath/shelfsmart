import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ShoppingCart } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";

const STATUS_COLORS = {
  draft:     "bg-slate-100 text-slate-600",
  submitted: "bg-blue-100 text-blue-700",
  confirmed: "bg-indigo-100 text-indigo-700",
  shipped:   "bg-purple-100 text-purple-700",
  received:  "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = parseISO(dateStr);
    return isValid(d) ? format(d, "MMM d, yyyy") : dateStr;
  } catch { return dateStr; }
}

export default function DairyOrderHistory({ dairySuppliers }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Order.list("-created_date", 100).then(all => {
      const filtered = dairySuppliers.length > 0
        ? all.filter(o => dairySuppliers.includes(o.supplier))
        : all.slice(0, 10);
      setOrders(filtered.slice(0, 15));
      setLoading(false);
    });
  }, [dairySuppliers.join(",")]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Recent Dairy Orders</h3>
      </div>
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-6">No orders found for dairy suppliers.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 dark:text-slate-400">Supplier</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 dark:text-slate-400">Date</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-slate-500 dark:text-slate-400">Items</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-slate-500 dark:text-slate-400">Total</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-slate-500 dark:text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-100">{o.supplier}</td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{formatDate(o.created_date)}</td>
                  <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-300">{o.items?.length ?? 0}</td>
                  <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">{o.total_cost ? `$${o.total_cost.toFixed(2)}` : "—"}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[o.status] || "bg-slate-100 text-slate-600"}`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
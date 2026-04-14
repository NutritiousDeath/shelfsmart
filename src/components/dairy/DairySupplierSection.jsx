import { Truck } from "lucide-react";

export default function DairySupplierSection({ allDairy }) {
  if (!allDairy || allDairy.length === 0) return null;

  const supplierMap = {};
  allDairy.forEach(p => {
    const s = p.supplier || "Unknown Supplier";
    if (!supplierMap[s]) supplierMap[s] = { count: 0, products: [] };
    supplierMap[s].count++;
    supplierMap[s].products.push(p.name);
  });

  const suppliers = Object.entries(supplierMap).sort((a, b) => b[1].count - a[1].count);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Truck className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Dairy Suppliers</h3>
        <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">{suppliers.length}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {suppliers.map(([name, data]) => (
          <div key={name} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
            <p className="font-medium text-slate-800 dark:text-slate-100 text-sm truncate">{name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{data.count} product{data.count !== 1 ? "s" : ""}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">{data.products.slice(0, 3).join(", ")}{data.products.length > 3 ? "..." : ""}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
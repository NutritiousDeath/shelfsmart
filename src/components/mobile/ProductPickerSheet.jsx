import { useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { X, Search } from "lucide-react";

export default function ProductPickerSheet({ open, products, onSelect, onClose }) {
  const [search, setSearch] = useState("");
  
  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <div className="bg-white rounded-t-3xl border-t border-slate-200 max-h-[70vh] flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0">
          <h3 className="text-base font-bold text-slate-800">Select Product</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg select-none">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-3 border-b border-slate-100 flex items-center gap-2 sticky top-14 bg-white">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            autoFocus
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="flex-1 text-sm bg-transparent focus:outline-none"
          />
        </div>

        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">No products found</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map(prod => (
                <button
                  key={prod.id}
                  onClick={() => onSelect(prod)}
                  className="w-full p-3 text-left hover:bg-slate-50 select-none transition-colors"
                >
                  <p className="font-medium text-slate-800 text-sm">{prod.name}</p>
                  <p className="text-slate-500 text-xs">Cost: ${prod.unit_cost?.toFixed(2) || "—"} • Stock: {prod.quantity_on_hand}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
import { Drawer } from "@/components/ui/drawer";
import { X } from "lucide-react";

const CATEGORIES = { deli: "Deli", grocery: "Grocery", meat: "Meat", produce: "Produce", wellness: "Wellness" };
const SUB_CATEGORIES = {
  deli: ["foh", "boh", "bakery", "cheese", "coffee"],
  grocery: ["bulk", "chill", "dairy", "frozen", "pet", "beer_wine"],
};
const SUB_LABELS = { foh: "FOH", boh: "BOH", bakery: "Bakery", cheese: "Cheese", coffee: "Coffee", bulk: "Bulk", chill: "Chill", dairy: "Dairy", frozen: "Frozen", pet: "Pet", beer_wine: "Beer & Wine" };

export default function CategorySheet({ open, value, subValue, onSelect, onSelectSub, onClose }) {
  return (
    <Drawer open={open} onOpenChange={onClose}>
      <div className="bg-white rounded-t-3xl border-t border-slate-200 max-h-[70vh] flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">Select Category</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">Category</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(CATEGORIES).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => { onSelect(val); onSelectSub(""); }}
                  className={`p-3 rounded-xl text-sm font-medium text-center select-none transition-colors ${
                    value === val ? "bg-amber-400 text-slate-900" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {SUB_CATEGORIES[value] && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">Sub-Category</p>
              <div className="grid grid-cols-2 gap-2">
                {SUB_CATEGORIES[value].map(sub => (
                  <button
                    key={sub}
                    onClick={() => { onSelectSub(sub); onClose(); }}
                    className={`p-3 rounded-xl text-sm font-medium text-center select-none transition-colors ${
                      subValue === sub ? "bg-amber-400 text-slate-900" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {SUB_LABELS[sub]}
                  </button>
                ))}
              </div>
            </div>
          )}
          {value && !SUB_CATEGORIES[value] && (
            <button onClick={onClose} className="w-full py-2.5 bg-amber-400 text-slate-900 rounded-xl text-sm font-bold">
              Confirm
            </button>
          )}
        </div>
      </div>
    </Drawer>
  );
}
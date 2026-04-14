import { useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { X } from "lucide-react";
import CategorySheet from "./CategorySheet";

const CATEGORIES = { deli: "Deli", grocery: "Grocery", meat: "Meat", produce: "Produce", wellness: "Wellness" };
const SUB_CATEGORIES = {
  deli: ["foh", "boh", "bakery", "cheese", "coffee"],
  grocery: ["bulk", "chill", "dairy", "frozen", "pet", "beer_wine"],
};
const SUB_LABELS = { foh: "FOH", boh: "BOH", bakery: "Bakery", cheese: "Cheese", coffee: "Coffee", bulk: "Bulk", chill: "Chill", dairy: "Dairy", frozen: "Frozen", pet: "Pet", beer_wine: "Beer & Wine" };

const defaultForm = {
  name: "", upc: "", sku: "", category: "", sub_category: "",
  quantity_on_hand: 0, min_stock_level: 10,
  unit_cost: "", retail_price: "",
  expiration_date: "", supplier: "", location: "", notes: ""
};

export default function ProductSheet({ open, product, onSave, onClose }) {
  const [form, setForm] = useState(() => {
    const merged = product ? { ...defaultForm, ...product } : defaultForm;
    // Replace null values with empty strings to keep inputs controlled
    return Object.fromEntries(Object.entries(merged).map(([k, v]) => [k, v ?? ""]));
  });
  const [saving, setSaving] = useState(false);
  const [showCategorySheet, setShowCategorySheet] = useState(false);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      ...form,
      quantity_on_hand: Number(form.quantity_on_hand),
      min_stock_level: Number(form.min_stock_level),
      unit_cost: form.unit_cost ? Number(form.unit_cost) : undefined,
      retail_price: form.retail_price ? Number(form.retail_price) : undefined,
    });
    setSaving(false);
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onClose}>
        <div className="bg-white rounded-t-3xl border-t border-slate-200 max-h-[90vh] flex flex-col [&_input]:text-slate-900 [&_input]:bg-white [&_input]:caret-slate-900 [&_textarea]:text-slate-900 [&_textarea]:bg-white [&_textarea]:caret-slate-900">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0">
            <h3 className="text-base font-bold text-slate-800">{product ? "Edit Product" : "Add Product"}</h3>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Product Name *</label>
              <input required value={form.name} onChange={e => set("name", e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">UPC</label>
                <input value={form.upc} onChange={e => set("upc", e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 font-mono" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">SKU</label>
                <input value={form.sku} onChange={e => set("sku", e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                <button
                  type="button"
                  onClick={() => setShowCategorySheet(true)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-left bg-white hover:bg-slate-50 font-medium text-slate-700"
                >
                  {CATEGORIES[form.category] || "— Select —"}
                </button>
              </div>
              {SUB_CATEGORIES[form.category] && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Sub-Category</label>
                  <button
                    type="button"
                    onClick={() => setShowCategorySheet(true)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-left bg-white hover:bg-slate-50 font-medium text-slate-700"
                  >
                    {SUB_LABELS[form.sub_category] || "— Select —"}
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Expiration Date</label>
              <input type="date" value={form.expiration_date} onChange={e => set("expiration_date", e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Qty On Hand *</label>
                <input required type="number" min="0" value={form.quantity_on_hand} onChange={e => set("quantity_on_hand", e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Min Stock</label>
                <input type="number" min="0" value={form.min_stock_level} onChange={e => set("min_stock_level", e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Unit Cost ($)</label>
                <input type="number" min="0" step="0.01" value={form.unit_cost} onChange={e => set("unit_cost", e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Retail Price ($)</label>
                <input type="number" min="0" step="0.01" value={form.retail_price} onChange={e => set("retail_price", e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Supplier</label>
              <input value={form.supplier} onChange={e => set("supplier", e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Location</label>
              <input placeholder="e.g. Aisle 3, Shelf B" value={form.location} onChange={e => set("location", e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
              <textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" />
            </div>

            <div className="flex gap-3 pt-4 pb-20 lg:pb-4">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors select-none">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 select-none">
                {saving ? "Saving..." : product ? "Update" : "Add"}
              </button>
            </div>
          </form>
        </div>
      </Drawer>

      <CategorySheet
        open={showCategorySheet}
        value={form.category}
        subValue={form.sub_category}
        onSelect={c => set("category", c)}
        onSelectSub={s => set("sub_category", s)}
        onClose={() => setShowCategorySheet(false)}
      />
    </>
  );
}
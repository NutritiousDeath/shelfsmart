import { useState } from "react";
import { X } from "lucide-react";

const CATEGORIES = { deli: "Deli", grocery: "Grocery", meat: "Meat", produce: "Produce", wellness: "Wellness" };
const SUB_CATEGORIES = {
  deli: ["foh", "boh", "bakery", "cheese", "coffee"],
  grocery: ["bulk", "chill", "dairy", "frozen", "pet", "beer_wine"],
};
const SUB_LABELS = { foh: "FOH", boh: "BOH", bakery: "Bakery", cheese: "Cheese", coffee: "Coffee", bulk: "Bulk", chill: "Chill", dairy: "Dairy", frozen: "Frozen", pet: "Pet", beer_wine: "Beer & Wine" };

const defaultForm = {
  name: "", upc: "", sku: "", category: "",  sub_category: "",
  quantity_on_hand: 0, min_stock_level: 10,
  unit_cost: "", retail_price: "",
  expiration_date: "", supplier: "", location: "", notes: ""
};

export default function ProductModal({ product, onSave, onClose, requireExpiration = false }) {
  const [form, setForm] = useState(() => {
    const merged = product ? { ...defaultForm, ...product } : defaultForm;
    // Replace null values with empty strings to keep inputs controlled
    return Object.fromEntries(Object.entries(merged).map(([k, v]) => [k, v ?? ""]));
  });
  const [saving, setSaving] = useState(false);

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onTouchStart={e => e.stopPropagation()} onTouchMove={e => e.stopPropagation()} onTouchEnd={e => e.stopPropagation()}>
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl [&_input]:text-slate-900 [&_input]:bg-white [&_input]:caret-slate-900 [&_textarea]:text-slate-900 [&_textarea]:bg-white [&_textarea]:caret-slate-900 [&_select]:text-slate-900 [&_select]:bg-white">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-800">{product ? "Edit Product" : "Add Product"}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Product Name *</label>
              <input required value={form.name} onChange={e => set("name", e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">UPC Barcode</label>
              <input value={form.upc} onChange={e => set("upc", e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 font-mono" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">SKU</label>
              <input value={form.sku} onChange={e => set("sku", e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
              <select value={form.category} onChange={e => { set("category", e.target.value); set("sub_category", ""); }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white text-slate-800">
                <option value="">— Select Category —</option>
                {Object.entries(CATEGORIES).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>
            </div>
            {SUB_CATEGORIES[form.category] && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sub-Category</label>
                <select value={form.sub_category} onChange={e => set("sub_category", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white text-slate-800">
                  <option value="">— Select Sub-Category —</option>
                  {SUB_CATEGORIES[form.category].map(s => <option key={s} value={s}>{SUB_LABELS[s]}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Expiration Date {requireExpiration && <span className="text-red-500">*</span>}</label>
              <input type="date" required={requireExpiration} value={form.expiration_date} onChange={e => set("expiration_date", e.target.value)}
                className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 ${requireExpiration && !form.expiration_date ? "border-red-300 bg-red-50" : "border-slate-200"}`} />
              {requireExpiration && !form.expiration_date && (
                <p className="text-xs text-red-500 mt-1">Expiration date is required for new entries</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Qty On Hand *</label>
              <input required type="number" min="0" value={form.quantity_on_hand} onChange={e => set("quantity_on_hand", e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Min Stock Level</label>
              <input type="number" min="0" value={form.min_stock_level} onChange={e => set("min_stock_level", e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Unit Cost ($)</label>
              <input type="number" min="0" step="0.01" value={form.unit_cost} onChange={e => set("unit_cost", e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Retail Price ($)</label>
              <input type="number" min="0" step="0.01" value={form.retail_price} onChange={e => set("retail_price", e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Supplier</label>
              <input value={form.supplier} onChange={e => set("supplier", e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Location</label>
              <input placeholder="e.g. Aisle 3, Shelf B" value={form.location} onChange={e => set("location", e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
              <textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
              {saving ? "Saving..." : product ? "Update" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
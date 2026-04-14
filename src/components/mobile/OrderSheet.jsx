import { useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { X, Plus, Trash2 } from "lucide-react";
import ProductPickerSheet from "./ProductPickerSheet";

export default function OrderSheet({ open, order, products, onSave, onClose }) {
  const [supplier, setSupplier] = useState(order?.supplier || "");
  const [expectedDelivery, setExpectedDelivery] = useState(order?.expected_delivery || "");
  const [notes, setNotes] = useState(order?.notes || "");
  const [items, setItems] = useState(order?.items || []);
  const [saving, setSaving] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(null);

  const addItem = () => {
    setItems([...items, { product_id: "", product_name: "", quantity: 1, unit_cost: 0 }]);
  };

  const updateItem = (idx, field, val) => {
    const updated = [...items];
    if (field === "product_id") {
      const prod = products.find(p => p.id === val);
      updated[idx] = {
        ...updated[idx],
        product_id: val,
        product_name: prod?.name || "",
        unit_cost: prod?.unit_cost || 0,
      };
    } else {
      updated[idx] = { ...updated[idx], [field]: val };
    }
    setItems(updated);
  };

  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));
  const total = items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unit_cost)), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ supplier, expected_delivery: expectedDelivery, notes, items });
    setSaving(false);
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onClose}>
        <div className="bg-white rounded-t-3xl border-t border-slate-200 max-h-[90vh] flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0">
            <h3 className="text-base font-bold text-slate-800">{order ? "Edit Order" : "New Order"}</h3>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg select-none">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Supplier *</label>
              <input required value={supplier} onChange={e => setSupplier(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Expected Delivery</label>
              <input type="date" value={expectedDelivery} onChange={e => setExpectedDelivery(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-600">Order Items</label>
                <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs text-amber-600 font-medium select-none">
                  <Plus className="w-3 h-3" /> Add Item
                </button>
              </div>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="p-3 border border-slate-200 rounded-xl space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowProductPicker(idx)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-left bg-white hover:bg-slate-50 font-medium text-slate-700"
                    >
                      {item.product_name || "Select product..."}
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-500">Quantity</label>
                        <input
                          type="number" min="1" value={item.quantity}
                          onChange={e => updateItem(idx, "quantity", e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">Unit Cost</label>
                        <input
                          type="number" min="0" step="0.01" value={item.unit_cost}
                          onChange={e => updateItem(idx, "unit_cost", e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                    <button type="button" onClick={() => removeItem(idx)} className="w-full p-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium select-none">
                      <Trash2 className="w-3 h-3 inline mr-1" /> Remove
                    </button>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="text-slate-400 text-xs text-center py-3 border-2 border-dashed border-slate-200 rounded-xl">
                    No items added yet
                  </p>
                )}
              </div>
            </div>

            <div className="py-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Total:</span>
                <span className="text-lg font-bold text-slate-800">${total.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
              <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" />
            </div>

            <div className="flex gap-3 pt-4 pb-20 lg:pb-4">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 select-none">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl text-sm font-bold disabled:opacity-50 select-none">
                {saving ? "Saving..." : order ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </Drawer>

      {showProductPicker !== null && (
        <ProductPickerSheet
          open={showProductPicker !== null}
          products={products}
          onSelect={(prod) => {
            updateItem(showProductPicker, "product_id", prod.id);
            setShowProductPicker(null);
          }}
          onClose={() => setShowProductPicker(null)}
        />
      )}
    </>
  );
}
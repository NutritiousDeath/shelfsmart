import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";

export default function OrderModal({ order, products, onSave, onClose }) {
  const [supplier, setSupplier] = useState(order?.supplier || "");
  const [expectedDelivery, setExpectedDelivery] = useState(order?.expected_delivery || "");
  const [notes, setNotes] = useState(order?.notes || "");
  const [items, setItems] = useState(order?.items || []);
  const [saving, setSaving] = useState(false);

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-800">{order ? "Edit Order" : "New Purchase Order"}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Supplier *</label>
              <input required value={supplier} onChange={e => setSupplier(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Expected Delivery</label>
              <input type="date" value={expectedDelivery} onChange={e => setExpectedDelivery(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-600">Order Items</label>
              <button type="button" onClick={addItem}
                className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium">
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select
                    value={item.product_id}
                    onChange={e => updateItem(idx, "product_id", e.target.value)}
                    className="flex-1 px-2 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
                  >
                    <option value="">Select product...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input
                    type="number" min="1" value={item.quantity}
                    onChange={e => updateItem(idx, "quantity", e.target.value)}
                    className="w-16 px-2 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-300 text-center"
                    placeholder="Qty"
                  />
                  <input
                    type="number" min="0" step="0.01" value={item.unit_cost}
                    onChange={e => updateItem(idx, "unit_cost", e.target.value)}
                    className="w-20 px-2 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-300"
                    placeholder="Cost"
                  />
                  <button type="button" onClick={() => removeItem(idx)}
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-slate-400 text-xs text-center py-3 border-2 border-dashed border-slate-200 rounded-xl">
                  No items. Click "Add Item" to start.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-slate-100">
            <span className="text-sm font-medium text-slate-600">Total:</span>
            <span className="text-lg font-bold text-slate-800">${total.toFixed(2)}</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl text-sm font-bold disabled:opacity-50">
              {saving ? "Saving..." : order ? "Update" : "Create Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
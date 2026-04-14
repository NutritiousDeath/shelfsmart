import { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { ProductEntity } from '@/hooks/useEntities';;
import { Plus, Search, Filter, Package, Edit2, Trash2, ChevronDown } from "lucide-react";
import ProductModal from "../components/inventory/ProductModal";
import ProductSheet from "../components/mobile/ProductSheet";
import ProductRow from "../components/inventory/ProductRow";
import PullToRefresh from "../components/mobile/PullToRefresh";

const CATEGORIES = ["all", "produce", "dairy", "meat", "bakery", "beverages", "snacks", "frozen", "canned", "dry_goods", "household", "personal_care", "other"];

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [user, setUser] = useState(null);


  useEffect(() => {
    loadProducts();
    supabase.auth.getUser().then(({data}) => setUser(data.user));
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const data = await ProductEntity.list("-updated_date");
    setProducts(data);
    setLoading(false);
  };

  const handleSave = async (data) => {
    // Auto-set status
    let status = "in_stock";
    if (data.quantity_on_hand === 0) status = "out_of_stock";
    else if (data.quantity_on_hand <= data.min_stock_level) status = "low_stock";

    const newProduct = { ...data, status };

    if (editing) {
      const updatedProduct = { ...editing, ...newProduct };
      setProducts(products.map(p => p.id === editing.id ? updatedProduct : p));
      await ProductEntity.update(editing.id, newProduct);
    } else {
      const created = await ProductEntity.create(newProduct);
      setProducts([created, ...products]);
    }
    setShowModal(false);
    setEditing(null);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    await ProductEntity.delete(id);
    loadProducts();
  };

  const handleEdit = (product) => {
    setEditing(product);
    setShowModal(true);
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.upc?.includes(search) || p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all" || p.category === category;
    const matchStock = stockFilter === "all" ||
      (stockFilter === "low" && p.quantity_on_hand <= p.min_stock_level && p.quantity_on_hand > 0) ||
      (stockFilter === "out" && p.quantity_on_hand === 0) ||
      (stockFilter === "ok" && p.quantity_on_hand > p.min_stock_level);
    return matchSearch && matchCat && matchStock;
  });

  const isManager = user?.role === "manager" || user?.role === "admin";

  return (
    <PullToRefresh onRefresh={loadProducts}>
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Inventory</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{products.length} products</p>
        </div>
        {isManager && (
          <button
            onClick={() => { setEditing(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, UPC, SKU..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
          />
        </div>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white dark:bg-slate-800 dark:text-slate-100 capitalize"
        >
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c === "all" ? "All Categories" : c.replace("_", " ")}</option>
          ))}
        </select>
        <select
          value={stockFilter}
          onChange={e => setStockFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="all">All Stock</option>
          <option value="ok">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-medium">Product</th>
                <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-medium hidden md:table-cell">UPC / SKU</th>
                <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-medium">Qty</th>
                <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-medium hidden sm:table-cell">Price</th>
                <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-medium hidden lg:table-cell">Expires</th>
                <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-medium">Status</th>
                {isManager && <th className="px-4 py-3 text-slate-500 dark:text-slate-400 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(isManager ? 7 : 6).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={isManager ? 7 : 6} className="py-16 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    No products found
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    isManager={isManager}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Always use modal popup for both mobile and desktop */}
      {showModal && (
        <ProductModal
          product={editing}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditing(null); }}
        />
      )}
    </div>
    </PullToRefresh>
  );
}

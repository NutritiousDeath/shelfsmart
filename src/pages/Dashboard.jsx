import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Package, AlertTriangle, TrendingDown, Zap, ShoppingCart, Clock, ArrowRight, RefreshCw } from "lucide-react";
import PullToRefresh from "../components/mobile/PullToRefresh";
import StatCard from "../components/dashboard/StatCard";
import LowStockList from "../components/dashboard/LowStockList";
import ExpiringList from "../components/dashboard/ExpiringList";
import ExpiryAlertBanner from "../components/dashboard/ExpiryAlertBanner";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [flashSales, setFlashSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
    base44.auth.me().then(setUser);
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [prods, sales] = await Promise.all([
      base44.entities.Product.list(),
      base44.entities.FlashSale.filter({ status: "active" }),
    ]);
    setProducts(prods);
    setFlashSales(sales);
    setLoading(false);
  };

  const today = new Date();
  const in7Days = new Date(today); in7Days.setDate(today.getDate() + 7);
  const in30Days = new Date(today); in30Days.setDate(today.getDate() + 30);

  const lowStock = products.filter(p => p.quantity_on_hand <= p.min_stock_level && p.quantity_on_hand > 0);
  const outOfStock = products.filter(p => p.quantity_on_hand === 0);
  const expiringSoon = products.filter(p => {
    if (!p.expiration_date) return false;
    const exp = new Date(p.expiration_date);
    return exp <= in7Days && exp >= today;
  });
  const expiring30 = products.filter(p => {
    if (!p.expiration_date) return false;
    const exp = new Date(p.expiration_date);
    return exp <= in30Days && exp >= today;
  });

  return (
    <PullToRefresh onRefresh={loadData}>
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Overview</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <button onClick={loadData} className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total Products" value={products.length} color="blue" loading={loading} linkTo={createPageUrl("Inventory")} />
        <StatCard icon={TrendingDown} label="Low Stock" value={lowStock.length} color="amber" alert={lowStock.length > 0} loading={loading} linkTo={createPageUrl("Inventory")} />
        <StatCard icon={AlertTriangle} label="Out of Stock" value={outOfStock.length} color="red" alert={outOfStock.length > 0} loading={loading} linkTo={createPageUrl("Inventory")} />
        <StatCard icon={Clock} label="Expiring (7d)" value={expiringSoon.length} color="orange" alert={expiringSoon.length > 0} loading={loading} linkTo={createPageUrl("FlashSales")} />
      </div>

      {/* Expiry Alert Banners */}
      <ExpiryAlertBanner products={expiringSoon} />

      {/* Active Flash Sales Banner */}
      {flashSales.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-white" />
            <div>
              <p className="text-white font-semibold text-sm">{flashSales.length} Active Flash Sale{flashSales.length > 1 ? "s" : ""}</p>
              <p className="text-amber-100 text-xs">Items on discount to clear expiring stock</p>
            </div>
          </div>
          <Link to={createPageUrl("FlashSales")} className="bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
            View <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <LowStockList products={lowStock} outOfStock={outOfStock} loading={loading} />
        <ExpiringList products={expiring30} loading={loading} />
      </div>
    </div>
    </PullToRefresh>
  );
}
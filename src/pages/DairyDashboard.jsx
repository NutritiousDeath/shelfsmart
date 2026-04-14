import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/api/supabaseClient";
import { RefreshCw, AlertTriangle } from "lucide-react";
import DairyStatCards from "../components/dairy/DairyStatCards";
import DairyAlertModal from "../components/dairy/DairyAlertModal";
import DairyProductTable from "../components/dairy/DairyProductTable";
import DairySupplierSection from "../components/dairy/DairySupplierSection";
import DairyOrderHistory from "../components/dairy/DairyOrderHistory";

const TABS = ["milk", "cheese", "yogurt", "butter", "cream", "eggs"];
const TAB_LABELS = { milk: "Milk", cheese: "Cheese", yogurt: "Yogurt", butter: "Butter", cream: "Cream", eggs: "Eggs" };
const AURA_IMG = "/shelfsmart/aura-logo.png";
const ALERT_ROLES = ["store_director", "assistant_store_director", "manager", "admin"];
const DISMISS_KEY = "dairy_alert_dismissed_date";

function getTabBadge(subcategories, tab) {
  if (!subcategories?.[tab]?.products) return 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const threeDays = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
  return subcategories[tab].products.filter(p => {
    if (!p.expiration_date) return false;
    const exp = new Date(p.expiration_date); exp.setHours(0, 0, 0, 0);
    return exp <= threeDays;
  }).length;
}

export default function DairyDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("milk");
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const runCheck = useCallback(async () => {
    setLoading(true);
    const res = await Promise.resolve({ data: {} }) /* TODO: replace with Railway endpoint */;
    setData(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({data}) => setUser(data.user));
    runCheck();
  }, []);

  // Show modal once per day for eligible roles
  useEffect(() => {
    if (!user || !data) return;
    if (!ALERT_ROLES.includes(user.role)) return;
    const alertItems = [...(data.expired || []), ...(data.critical || [])];
    if (alertItems.length === 0) return;
    const todayStr = new Date().toISOString().split("T")[0];
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed !== todayStr) setShowModal(true);
  }, [user, data]);

  const handleDismissModal = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    localStorage.setItem(DISMISS_KEY, todayStr);
    setShowModal(false);
  };

  const alertItems = [...(data?.expired || []), ...(data?.critical || [])];
  const hasUrgentItems = alertItems.length > 0;
  const dairySuppliers = [...new Set((data?.all_dairy || []).map(p => p.supplier).filter(Boolean))];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Alert Modal */}
      {showModal && <DairyAlertModal items={alertItems} onDismiss={handleDismissModal} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Dairy Dashboard</h2>
              {hasUrgentItems && (
                <span className="flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  {alertItems.length} Urgent
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm">
              {data?.today ? new Date(data.today + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "Loading..."}
            </p>
          </div>
        </div>
        <button
          onClick={runCheck}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <DairyStatCards summary={data?.summary} loading={loading} />

      {/* Subcategory Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
        {/* Tab Bar */}
        <div className="flex overflow-x-auto border-b border-slate-100 dark:border-slate-700 px-2 pt-2 gap-1 no-scrollbar bg-white dark:bg-slate-800">
          {TABS.map(tab => {
            const badge = getTabBadge(data?.subcategories, tab);
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-xl whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? "bg-amber-400 text-slate-900"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                {TAB_LABELS[tab]}
                {badge > 0 && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === tab ? "bg-slate-900/20 text-slate-900" : "bg-red-100 text-red-700"
                  }`}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="p-4">
          {loading ? (
            <div className="space-y-2">
              {[1,2,3,4].map(i => <div key={i} className="h-10 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <DairyProductTable products={data?.subcategories?.[activeTab]?.products || []} />
          )}
        </div>
      </div>

      {/* AuraAI Recommendations */}
      {(data?.ai_recommendations || loading) && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <img src={AURA_IMG} alt="AuraAI" className="w-9 h-9 rounded-full object-cover" />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100">AuraAI Recommendations</p>
              <p className="text-xs text-green-500 font-medium">● AI-powered insights</p>
            </div>
          </div>
          {loading ? (
            <div className="space-y-2">
              <div className="h-4 bg-slate-100 rounded animate-pulse w-full" />
              <div className="h-4 bg-slate-100 rounded animate-pulse w-5/6" />
              <div className="h-4 bg-slate-100 rounded animate-pulse w-4/6" />
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {data?.ai_recommendations || "No recommendations at this time. All dairy products are in good condition."}
            </div>
          )}
        </div>
      )}

      {/* Supplier Section */}
      <DairySupplierSection allDairy={data?.all_dairy || []} />

      {/* Order History */}
      {!loading && <DairyOrderHistory dairySuppliers={dairySuppliers} />}
    </div>
  );
}

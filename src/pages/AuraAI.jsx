import { useState } from "react";
import { RefreshCw, Send, Bot, User, ShoppingCart, AlertTriangle, Zap, Package } from "lucide-react";
import ReorderGuideSection from "../components/aura/ReorderGuideSection";
import ExpirationAlertsSection from "../components/aura/ExpirationAlertsSection";
import FlashSalesSection from "../components/aura/FlashSalesSection";
import AuraChatSection from "../components/aura/AuraChatSection";

const TABS = [
  { id: "reorder", label: "Reorder Guide", icon: ShoppingCart },
  { id: "expiration", label: "Expiration Alerts", icon: AlertTriangle },
  { id: "flashsales", label: "Flash Sales", icon: Zap },
  { id: "chat", label: "AuraAI Chat", icon: Bot },
];

export default function AuraAI() {
  const [activeTab, setActiveTab] = useState("reorder");

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md">
          <img
            src="https://base44.app/api/apps/69a77277eaf49e3b35ab5e60/files/public/69a77277eaf49e3b35ab5e60/42ce75fbe_ChatGPTImageMar5202611_35_11PM.png"
            alt="AuraAI"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">AuraAI Dashboard</h1>
          <p className="text-slate-500 text-sm">AI-powered insights for your store</p>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center ${
                isActive
                  ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === "reorder" && <ReorderGuideSection />}
      {activeTab === "expiration" && <ExpirationAlertsSection />}
      {activeTab === "flashsales" && <FlashSalesSection />}
      {activeTab === "chat" && <AuraChatSection />}
    </div>
  );
}
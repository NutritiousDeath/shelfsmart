import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, RefreshCw, CheckCircle } from "lucide-react";

const urgencyStyle = {
  HIGH: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  LOW: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

const actionStyle = {
  FLASH_SALE: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  MARKDOWN: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  REMOVE: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  MONITOR: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

export default function ExpirationAlertsSection() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const check = async () => {
    setLoading(true);
    setResult(null);
    const res = await base44.functions.invoke("aiExpirationAlerts", {});
    setResult(res.data);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Expiration Alerts</h2>
          </div>
          <button
            onClick={check}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            {loading ? "Checking..." : "Check Expiration Alerts"}
          </button>
        </div>
        <p className="text-slate-500 text-sm">AI scans products expiring within 7 days and recommends actions to minimize waste.</p>
      </div>

      {loading && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-10 flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
          <p className="text-slate-500 text-sm">AuraAI is scanning expiration dates...</p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-slate-800 dark:text-slate-100 font-medium text-sm">{result.message || result.summary}</p>
              {result.flash_sales_created > 0 && (
                <p className="text-amber-700 dark:text-amber-300 text-xs mt-1 font-medium">
                  ✓ {result.flash_sales_created} flash sale suggestion{result.flash_sales_created !== 1 ? "s" : ""} created
                </p>
              )}
            </div>
          </div>

          {result.alerts?.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Product</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Exp. Date</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Days Left</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Urgency</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                    {result.alerts.map((alert, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{alert.product_name}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono text-xs">{alert.expiration_date}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold text-sm ${alert.days_until_expiry <= 0 ? "text-red-600" : alert.days_until_expiry <= 3 ? "text-red-500" : "text-amber-600"}`}>
                            {alert.days_until_expiry <= 0 ? "EXPIRED" : `${alert.days_until_expiry}d`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${actionStyle[alert.action] || actionStyle.MONITOR}`}>
                            {alert.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${urgencyStyle[alert.urgency] || urgencyStyle.LOW}`}>
                            {alert.urgency}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{alert.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, Package, ScanBarcode, ShoppingCart } from "lucide-react";

const tabs = [
  { label: "Dashboard", page: "Dashboard", icon: LayoutDashboard },
  { label: "Inventory", page: "Inventory", icon: Package },
  { label: "Scan", page: "Scanner", icon: ScanBarcode },
  { label: "Orders", page: "Orders", icon: ShoppingCart },
];

export default function BottomTabBar() {
  const location = useLocation();
  const currentPage = location.pathname.split("/").pop() || "Dashboard";

  return (
    <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 z-40 safe-area-inset-bottom">
      <div className="flex">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentPage === tab.page;
          return (
            <Link
              key={tab.page}
              to={createPageUrl(tab.page)}
              className={`flex-1 flex flex-col items-center justify-center py-3 px-2 gap-1 text-xs font-medium transition-colors select-none ${
                isActive
                  ? "text-amber-500 bg-amber-50 dark:bg-amber-900/20"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="truncate">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
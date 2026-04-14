import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/api/supabaseClient";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Package, ShoppingCart, Zap, ScanBarcode, Settings, LogOut, Droplets,
  Menu, X, ChevronDown, Bell, User, Boxes, CalendarDays, ArrowLeft, Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomTabBar from "./components/mobile/BottomTabBar";

const navItems = [
  { label: "Dashboard", page: "Dashboard", icon: LayoutDashboard, roles: ["manager", "employee", "admin"] },
  { label: "Inventory", page: "Inventory", icon: Package, roles: ["manager", "employee", "admin"] },
  { label: "Dairy", page: "DairyDashboard", icon: Droplets, roles: ["manager", "employee", "admin"] },
  { label: "Scan Product", page: "Scanner", icon: ScanBarcode, roles: ["manager", "employee", "admin"] },
  { label: "Orders", page: "Orders", icon: ShoppingCart, roles: ["manager", "admin"] },
  { label: "Flash Sales", page: "FlashSales", icon: Zap, roles: ["manager", "employee", "admin"] },
  { label: "Calendar", page: "Calendar", icon: CalendarDays, roles: ["manager", "admin"] },
  { label: "AuraAI", page: "AuraAI", icon: Sparkles, roles: ["manager", "admin"] },
  { label: "Settings", page: "Settings", icon: Settings, roles: ["manager", "admin"] },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });
  const location = useLocation();
  const navigate = useNavigate();

  const topLevelPages = ["Dashboard", "Inventory", "Scanner", "Orders", "Settings", "Calendar", "FlashSales", "AuraAI", "DairyDashboard"];
  const isTopLevel = topLevelPages.includes(currentPageName);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user);
        // Load team member profile for role
        supabase
          .from('team_members')
          .select('*')
          .eq('email', data.user.email)
          .single()
          .then(({ data: member }) => {
            if (member) setProfile(member);
          });
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDarkMode(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const handleLogout = () => supabase.auth.signOut().then(() => window.location.href = "/");

  const userRole = profile?.role || "employee";

  const visibleNav = navItems.filter(item =>
    item.roles.includes(userRole)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Boxes className="w-12 h-12 text-amber-400 animate-pulse" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-950`}>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden select-none" onClick={() => setSidebarOpen(false)} />
      )}

      <BottomTabBar />

      <aside className={`fixed left-0 top-0 h-full w-64 dark:bg-slate-800 bg-slate-900 z-30 flex flex-col transition-transform duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 lg:static lg:z-auto safe-area-inset-left`}>
        <div className="p-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center">
              <Boxes className="w-7 h-7 text-slate-900" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">ShelfSmart</p>
              <p className="text-slate-400 text-xs">Inventory Manager</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {visibleNav.map(item => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all select-none ${
                  isActive
                    ? "bg-amber-400 text-slate-900"
                    : "text-slate-400 hover:text-white hover:bg-slate-700 dark:hover:bg-slate-700"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-800">
            <div className="w-8 h-8 bg-amber-400/20 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{profile?.full_name || user?.email || "User"}</p>
              <p className="text-amber-400 text-xs capitalize">{userRole}</p>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors select-none">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-0 lg:ml-0">
        <header className="dark:bg-slate-900 dark:border-slate-700 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4 sticky top-0 z-10 safe-area-inset-top">
          {!isTopLevel && (
            <button
              onClick={() => navigate(-1)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 select-none"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setSidebarOpen(true)}
            className={`lg:hidden p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 select-none ${!isTopLevel ? "hidden" : ""}`}
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="dark:text-slate-100 text-slate-800 font-semibold text-base flex-1">
            {currentPageName}
          </h1>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium select-none ${
              userRole === "store_director" ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200" :
              userRole === "assistant_store_director" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200" :
              userRole === "manager" || userRole === "admin"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}>
              {userRole === "store_director" ? "Store Director" :
               userRole === "assistant_store_director" ? "Asst. Store Director" :
               userRole === "manager" || userRole === "admin" ? "Manager" : "Employee"}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overscroll-y-contain min-h-0 pb-20 lg:pb-0">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      <style>{`
        :root {
          --primary: #f59e0b;
          --primary-dark: #d97706;
          --safe-area-inset-top: env(safe-area-inset-top);
          --safe-area-inset-bottom: env(safe-area-inset-bottom);
          --safe-area-inset-left: env(safe-area-inset-left);
          --safe-area-inset-right: env(safe-area-inset-right);
        }
        @supports (padding-top: max(0px)) {
          .safe-area-inset-top { padding-top: max(1rem, env(safe-area-inset-top)); }
          .safe-area-inset-bottom { padding-bottom: max(1rem, env(safe-area-inset-bottom)); }
          .safe-area-inset-left { padding-left: max(1rem, env(safe-area-inset-left)); }
        }
      `}</style>
    </div>
  );
}

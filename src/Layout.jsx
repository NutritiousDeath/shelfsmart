import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Package, ShoppingCart, Zap, ScanBarcode, Settings, LogOut, Droplets,
  Menu, Boxes, CalendarDays, ArrowLeft, Sparkles, Palette
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
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

const THEMES = [
  { id: "cyber-blue", label: "Cyber Blue", primary: "#00f0ff", vars: `--primary:#00f0ff;--primary-dim:rgba(0,240,255,0.1);--primary-border:rgba(0,240,255,0.2);--primary-glow:0 0 8px #00f0ff,0 0 24px #00f0ff33;` },
  { id: "crimson-red", label: "Crimson Red", primary: "#ff2020", vars: `--primary:#ff2020;--primary-dim:rgba(255,32,32,0.1);--primary-border:rgba(255,32,32,0.22);--primary-glow:0 0 8px #ff2020,0 0 24px #ff202033;` },
  { id: "neon-pink", label: "Neon Pink", primary: "#ff2d78", vars: `--primary:#ff2d78;--primary-dim:rgba(255,45,120,0.1);--primary-border:rgba(255,45,120,0.22);--primary-glow:0 0 8px #ff2d78,0 0 24px #ff2d7833;` },
  { id: "neon-orange", label: "Neon Orange", primary: "#ff8c00", vars: `--primary:#ff8c00;--primary-dim:rgba(255,140,0,0.1);--primary-border:rgba(255,140,0,0.22);--primary-glow:0 0 8px #ff8c00,0 0 24px #ff8c0033;` },
];

const ROLE_LABELS = {
  store_director: "Store Director",
  assistant_store_director: "Asst. Director",
  manager: "Manager",
  admin: "Admin",
  employee: "Employee",
};

export default function Layout({ children, currentPageName }) {
  const { user, logout, isLoadingAuth } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [themeId, setThemeId] = useState(() => localStorage.getItem("ss-theme") || "cyber-blue");
  const location = useLocation();
  const navigate = useNavigate();

  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const topLevelPages = ["Dashboard", "Inventory", "Scanner", "Orders", "Settings", "Calendar", "FlashSales", "AuraAI", "DairyDashboard"];
  const isTopLevel = topLevelPages.includes(currentPageName);
  const userRole = user?.role || "employee";
  const visibleNav = navItems.filter(item => item.roles.includes(userRole));

  const handleThemeChange = (id) => {
    setThemeId(id);
    localStorage.setItem("ss-theme", id);
    setShowThemePicker(false);
  };

  if (isLoadingAuth) {
    return (
      <div style={{ minHeight:"100vh", background:"#050810", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"1rem" }}>
          <div style={{ width:64, height:64, borderRadius:12, background:"rgba(0,240,255,0.08)", border:"1px solid rgba(0,240,255,0.3)", display:"flex", alignItems:"center", justifyContent:"center", color:"#00f0ff" }}>
            <Boxes size={32} />
          </div>
          <p style={{ fontFamily:"monospace", fontSize:"0.75rem", color:"#00f0ff", letterSpacing:4 }}>INITIALIZING...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ss-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&display=swap');
        :root{
          --bg:#050810;--bg-2:#080d1a;--bg-card:rgba(8,13,26,0.92);
          --green:#00ff88;--white:#e8eaf0;--grey:#4a5068;
          --font-display:'Orbitron',monospace;--font-mono:'Share Tech Mono',monospace;--font-body:'Rajdhani',sans-serif;
          --glow-green:0 0 8px #00ff88,0 0 24px #00ff8833;
          --safe-top:env(safe-area-inset-top,0px);--safe-bottom:env(safe-area-inset-bottom,0px);
          --btm:64px;
          ${theme.vars}
        }
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:var(--bg);color:var(--white);font-family:var(--font-body);font-size:15px;-webkit-font-smoothing:antialiased;overflow-x:hidden;}
        .ss-scanlines{position:fixed;inset:0;pointer-events:none;z-index:9998;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,240,255,0.01) 2px,rgba(0,240,255,0.01) 4px);}
        .ss-noise{position:fixed;inset:0;pointer-events:none;z-index:9997;opacity:0.15;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");}
        .ss-root{height:100vh;display:flex;overflow:hidden;background:var(--bg);}
        .ss-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:20;backdrop-filter:blur(2px);}

        .ss-sidebar{
          position:fixed;left:0;top:0;
          height:calc(100% - var(--btm) - var(--safe-bottom));
          width:220px;background:var(--bg-2);
          border-right:1px solid var(--primary-border);
          z-index:30;display:flex;flex-direction:column;
          transform:translateX(-100%);
          transition:transform 0.25s cubic-bezier(0.4,0,0.2,1);
        }
        .ss-sidebar--open{transform:translateX(0);}
        @media(min-width:1024px){.ss-sidebar{transform:translateX(0);position:static;height:100%;z-index:auto;}}

        .ss-sidebar-brand{display:flex;align-items:center;gap:0.75rem;padding:1rem;border-bottom:1px solid var(--primary-border);padding-top:calc(1rem + var(--safe-top));flex-shrink:0;}
        .ss-brand-icon{width:38px;height:38px;border-radius:6px;flex-shrink:0;background:var(--primary-dim);border:1px solid var(--primary-border);display:flex;align-items:center;justify-content:center;color:var(--primary);box-shadow:var(--primary-glow);}
        .ss-brand-name{font-family:var(--font-display);font-size:0.78rem;font-weight:900;letter-spacing:2px;color:var(--white);line-height:1.2;}
        .ss-brand-accent{color:var(--primary);text-shadow:var(--primary-glow);}
        .ss-brand-sub{font-family:var(--font-mono);font-size:0.55rem;color:var(--grey);letter-spacing:1px;margin-top:2px;}

        .ss-nav{flex:1;padding:0.5rem;display:flex;flex-direction:column;gap:2px;overflow-y:auto;min-height:0;}
        .ss-nav::-webkit-scrollbar{width:2px;}.ss-nav::-webkit-scrollbar-thumb{background:var(--primary-border);}
        .ss-nav-item{display:flex;align-items:center;gap:0.6rem;padding:0.55rem 0.7rem;border-radius:4px;font-family:var(--font-mono);font-size:0.67rem;letter-spacing:1px;color:var(--grey);text-decoration:none;transition:all 0.15s;position:relative;border:1px solid transparent;flex-shrink:0;}
        .ss-nav-item:hover{color:var(--primary);background:var(--primary-dim);border-color:var(--primary-border);}
        .ss-nav-item--active{color:var(--bg);background:var(--primary);border-color:var(--primary);box-shadow:var(--primary-glow);font-weight:700;}
        .ss-nav-item--active:hover{color:var(--bg);}
        .ss-nav-active-bar{position:absolute;right:-1px;top:20%;bottom:20%;width:2px;background:var(--primary);border-radius:2px;}

        .ss-sidebar-footer{padding:0.6rem;border-top:1px solid var(--primary-border);flex-shrink:0;}
        .ss-user-card{display:flex;align-items:center;gap:0.5rem;padding:0.55rem 0.65rem;border-radius:4px;background:var(--primary-dim);border:1px solid var(--primary-border);}
        .ss-user-avatar{width:28px;height:28px;border-radius:50%;flex-shrink:0;background:var(--primary-dim);border:1px solid var(--primary-border);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:0.58rem;font-weight:900;color:var(--primary);}
        .ss-user-info{flex:1;min-width:0;}
        .ss-user-name{font-family:var(--font-mono);font-size:0.58rem;color:var(--white);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .ss-user-role{font-family:var(--font-mono);font-size:0.52rem;color:var(--primary);letter-spacing:1px;margin-top:1px;}
        .ss-logout-btn{background:none;border:1px solid var(--primary-border);border-radius:4px;cursor:pointer;color:var(--grey);padding:6px 8px;transition:all 0.15s;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent;min-width:32px;min-height:32px;}
        .ss-logout-btn:hover,.ss-logout-btn:active{color:#ff4444;border-color:#ff4444;background:rgba(255,68,68,0.1);}

        .ss-main{flex:1;display:flex;flex-direction:column;min-width:0;min-height:0;overflow:hidden;}
        .ss-header{display:flex;flex-direction:column;background:rgba(5,8,16,0.96);border-bottom:1px solid var(--primary-border);position:sticky;top:0;z-index:10;backdrop-filter:blur(12px);}
        .ss-header-safe{height:env(safe-area-inset-top,0px);width:100%;flex-shrink:0;}
        .ss-header-inner{display:flex;align-items:center;gap:0.75rem;padding:0 1rem;height:52px;width:100%;}
        .ss-header-btn{width:40px;height:40px;border-radius:4px;flex-shrink:0;background:var(--primary-dim);border:1px solid var(--primary-border);color:var(--primary);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.15s;-webkit-tap-highlight-color:transparent;}
        .ss-header-btn:active{transform:scale(0.9);box-shadow:var(--primary-glow);}
        .ss-header-title{flex:1;font-family:var(--font-display);font-size:0.74rem;font-weight:700;letter-spacing:3px;color:var(--white);}
        .ss-header-slash{color:var(--primary);opacity:0.7;}
        .ss-header-right{display:flex;align-items:center;gap:0.5rem;position:relative;}
        .ss-status-dot{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:var(--glow-green);animation:ss-pulse 2s infinite;}
        .ss-theme-btn{width:40px;height:40px;border-radius:4px;background:var(--primary-dim);border:1px solid var(--primary-border);color:var(--primary);display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;}
        .ss-theme-btn:active{transform:scale(0.9);}
        .ss-theme-picker{position:absolute;top:calc(100% + 8px);right:0;background:var(--bg-2);border:1px solid var(--primary-border);border-radius:4px;padding:0.5rem;display:flex;flex-direction:column;gap:3px;min-width:148px;box-shadow:0 8px 32px rgba(0,0,0,0.6);z-index:100;}
        .ss-theme-option{display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.65rem;border-radius:3px;cursor:pointer;font-family:var(--font-mono);font-size:0.64rem;letter-spacing:1px;color:var(--grey);border:1px solid transparent;transition:all 0.12s;background:none;width:100%;text-align:left;}
        .ss-theme-option:hover{color:var(--white);background:rgba(255,255,255,0.04);}
        .ss-theme-option--active{color:var(--primary);border-color:var(--primary-border);background:var(--primary-dim);}
        .ss-theme-swatch{width:9px;height:9px;border-radius:50%;flex-shrink:0;}
        .ss-role-badge{font-family:var(--font-mono);font-size:0.54rem;letter-spacing:1.5px;padding:3px 7px;border-radius:3px;font-weight:600;background:var(--primary-dim);color:var(--primary);border:1px solid var(--primary-border);}

        .ss-content{flex:1;overflow-y:auto;overscroll-behavior-y:contain;min-height:0;padding-bottom:calc(var(--btm) + 1.5rem + var(--safe-bottom));}
        @media(min-width:1024px){.ss-content{padding-bottom:1rem;}}
        .ss-content::-webkit-scrollbar{width:3px;}.ss-content::-webkit-scrollbar-track{background:var(--bg);}.ss-content::-webkit-scrollbar-thumb{background:var(--primary-border);border-radius:2px;}

        .ss-content h1,.ss-content h2,.ss-content h3,.ss-content h4{font-family:var(--font-display) !important;letter-spacing:1.5px;color:var(--white) !important;}
        .ss-content .bg-white,.ss-content [class*="bg-white"],.ss-content [class*="bg-slate-800"]{background:var(--bg-card) !important;border-color:var(--primary-border) !important;color:var(--white) !important;}
        .ss-content [class*="bg-slate-50"],.ss-content [class*="bg-slate-100"],.ss-content [class*="bg-slate-900"]{background:rgba(8,13,26,0.8) !important;}
        .ss-content [class*="bg-slate-7"]{background:rgba(20,26,42,0.9) !important;}
        .ss-content [class*="text-slate-8"],.ss-content [class*="text-slate-9"]{color:var(--white) !important;}
        .ss-content [class*="text-slate-4"],.ss-content [class*="text-slate-5"],.ss-content [class*="text-slate-6"]{color:var(--grey) !important;}
        .ss-content input,.ss-content select,.ss-content textarea{background:rgba(8,13,26,0.9) !important;border:1px solid var(--primary-border) !important;color:var(--white) !important;font-family:var(--font-mono) !important;font-size:0.8rem !important;border-radius:4px !important;outline:none !important;}
        .ss-content input:focus,.ss-content select:focus,.ss-content textarea:focus{border-color:var(--primary) !important;box-shadow:0 0 0 1px var(--primary),var(--primary-glow) !important;}
        .ss-content input::placeholder{color:var(--grey) !important;}
        .ss-content select option{background:var(--bg-2);color:var(--white);}
        .ss-content .bg-amber-400,.ss-content .bg-amber-500,.ss-content [class*="bg-amber-4"],.ss-content [class*="bg-amber-5"]{background:var(--primary) !important;color:var(--bg) !important;font-family:var(--font-display) !important;font-size:0.7rem !important;letter-spacing:1.5px !important;border-radius:4px !important;border:none !important;}
        .ss-content .bg-amber-400:hover,.ss-content [class*="bg-amber-4"]:hover{filter:brightness(1.15) !important;box-shadow:var(--primary-glow) !important;}
        .ss-content button[class*="border-slate"],.ss-content button[class*="border-amber"]{background:transparent !important;border:1px solid var(--primary-border) !important;color:var(--primary) !important;font-family:var(--font-mono) !important;font-size:0.7rem !important;border-radius:4px !important;letter-spacing:1px !important;}
        .ss-content button[class*="border-slate"]:hover{background:var(--primary-dim) !important;border-color:var(--primary) !important;}
        .ss-content [class*="rounded-2xl"],.ss-content [class*="rounded-xl"],.ss-content [class*="rounded-lg"]{border-radius:4px !important;}
        .ss-content [class*="rounded-full"]{border-radius:999px !important;}
        .ss-content table{border-collapse:collapse;}
        .ss-content thead tr{background:var(--primary-dim) !important;border-bottom:1px solid var(--primary-border) !important;}
        .ss-content th{font-family:var(--font-mono) !important;font-size:0.63rem !important;letter-spacing:2px !important;color:var(--primary) !important;font-weight:400 !important;}
        .ss-content tbody tr{border-bottom:1px solid rgba(74,80,104,0.18) !important;transition:background 0.12s;}
        .ss-content tbody tr:hover{background:var(--primary-dim) !important;}
        .ss-content td{color:var(--white) !important;font-family:var(--font-body);}
        .ss-content [class*="bg-green-1"]{background:rgba(0,255,136,0.1) !important;color:#00ff88 !important;}
        .ss-content [class*="bg-red-1"]{background:rgba(255,32,32,0.1) !important;color:#ff4444 !important;}
        .ss-content [class*="bg-amber-1"]{background:var(--primary-dim) !important;color:var(--primary) !important;}
        .ss-content [class*="bg-blue-1"]{background:rgba(0,100,255,0.1) !important;color:#4da6ff !important;}
        .ss-content [class*="bg-purple-1"]{background:rgba(180,79,255,0.1) !important;color:#b44fff !important;}
        .ss-content [class*="bg-slate-1"]{background:rgba(74,80,104,0.2) !important;color:var(--grey) !important;}
        .ss-content [class*="bg-indigo-1"]{background:rgba(99,102,241,0.1) !important;color:#818cf8 !important;}
        .ss-content [class*="bg-orange-1"]{background:rgba(255,140,0,0.1) !important;color:#ff8c00 !important;}
        .ss-content [class*="divide-slate"]>*{border-color:rgba(74,80,104,0.18) !important;}
        .ss-content [class*="border-slate"],.ss-content [class*="dark:border-slate"]{border-color:var(--primary-border) !important;}
        .ss-content [class*="border-red"]{border-color:rgba(255,32,32,0.25) !important;}
        .ss-content [class*="from-amber"],.ss-content [class*="bg-gradient"]{background:linear-gradient(135deg,var(--primary-dim),rgba(180,79,255,0.08)) !important;border:1px solid var(--primary-border) !important;}
        .ss-content .text-green-600,.ss-content [class*="text-green"]{color:#00ff88 !important;}
        .ss-content .text-red-500,.ss-content .text-red-600,.ss-content [class*="text-red-5"],.ss-content [class*="text-red-6"]{color:#ff4444 !important;}
        .ss-content [class*="text-amber"]{color:var(--primary) !important;}
        .ss-content [class*="text-blue"]{color:#4da6ff !important;}
        .ss-content [class*="text-purple"]{color:#b44fff !important;}
        .ss-content [class*="text-orange"]{color:#ff8c00 !important;}
        @keyframes ss-pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>

      <div className="ss-scanlines" />
      <div className="ss-noise" />

      {sidebarOpen && <div className="ss-backdrop" onClick={() => setSidebarOpen(false)} />}

      <BottomTabBar />

      <aside className={`ss-sidebar ${sidebarOpen ? "ss-sidebar--open" : ""}`}>
        <div className="ss-sidebar-brand">
          <div className="ss-brand-icon"><Boxes size={18} /></div>
          <div>
            <p className="ss-brand-name"><span className="ss-brand-accent">SHELF</span>SMART</p>
            <p className="ss-brand-sub">// INVENTORY_SYS</p>
          </div>
        </div>

        <nav className="ss-nav">
          {visibleNav.map(item => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setSidebarOpen(false)}
                className={`ss-nav-item ${isActive ? "ss-nav-item--active" : ""}`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
                {isActive && <div className="ss-nav-active-bar" />}
              </Link>
            );
          })}
        </nav>

        <div className="ss-sidebar-footer">
          <div className="ss-user-card">
            <div className="ss-user-avatar">
              {(user?.full_name || user?.email || "U")[0].toUpperCase()}
            </div>
            <div className="ss-user-info">
              <p className="ss-user-name">{user?.full_name || user?.email || "User"}</p>
              <p className="ss-user-role">{ROLE_LABELS[userRole] || "EMPLOYEE"}</p>
            </div>
            <button onClick={logout} className="ss-logout-btn" title="Sign out">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      <div className="ss-main">
        <header className="ss-header">
          <div className="ss-header-safe" />
          <div className="ss-header-inner">
          {!isTopLevel ? (
            <button onClick={() => navigate(-1)} className="ss-header-btn lg:hidden">
              <ArrowLeft size={18} />
            </button>
          ) : (
            <button onClick={() => setSidebarOpen(true)} className="ss-header-btn lg:hidden">
              <Menu size={18} />
            </button>
          )}

          <div className="ss-header-title">
            <span className="ss-header-slash">// </span>
            {currentPageName?.toUpperCase()}
          </div>

          <div className="ss-header-right">
            <span className="ss-role-badge">{ROLE_LABELS[userRole] || "EMPLOYEE"}</span>
            <button className="ss-theme-btn" onClick={() => setShowThemePicker(v => !v)} title="Change theme">
              <Palette size={15} />
            </button>
            {showThemePicker && (
              <div className="ss-theme-picker">
                {THEMES.map(t => (
                  <button
                    key={t.id}
                    className={`ss-theme-option ${themeId === t.id ? "ss-theme-option--active" : ""}`}
                    onClick={() => handleThemeChange(t.id)}
                  >
                    <span className="ss-theme-swatch" style={{ background: t.primary, boxShadow: `0 0 5px ${t.primary}` }} />
                    {t.label}
                  </button>
                ))}
              </div>
            )}
            <div className="ss-status-dot" />
          </div>
          </div>
        </header>

        <main className="ss-content" onClick={() => showThemePicker && setShowThemePicker(false)}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

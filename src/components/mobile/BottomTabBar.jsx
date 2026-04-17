import { useState, useEffect, useRef } from "react";
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
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = (e) => {
      const el = e.target;
      if (!el || el === document) return;
      const currentY = el.scrollTop;
      if (currentY > lastScrollY.current && currentY > 60) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      lastScrollY.current = currentY;
    };

    const mainContent = document.querySelector('.ss-content');
    if (mainContent) {
      mainContent.addEventListener('scroll', handleScroll, { passive: true });
      return () => mainContent.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <>
      <style>{`
        .ss-bottom-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: calc(64px + env(safe-area-inset-bottom, 0px));
          background: rgba(8, 13, 26, 0.97);
          border-top: 1px solid var(--primary-border, rgba(0,240,255,0.2));
          z-index: 40;
          display: flex;
          align-items: flex-start;
          padding-top: 0;
          backdrop-filter: blur(12px);
          transform: translateY(0);
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .ss-bottom-bar--hidden {
          transform: translateY(100%);
        }
        @media(min-width: 1024px) {
          .ss-bottom-bar { display: none; }
        }
        .ss-tab {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 10px 4px 8px;
          gap: 4px;
          text-decoration: none;
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.58rem;
          letter-spacing: 1px;
          color: var(--grey, #4a5068);
          transition: all 0.15s;
          -webkit-tap-highlight-color: transparent;
          position: relative;
        }
        .ss-tab:active { transform: scale(0.92); }
        .ss-tab--active {
          color: var(--primary, #00f0ff);
        }
        .ss-tab--active svg {
          filter: drop-shadow(0 0 4px var(--primary, #00f0ff));
        }
        .ss-tab-dot {
          position: absolute;
          top: 6px;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--primary, #00f0ff);
          box-shadow: 0 0 6px var(--primary, #00f0ff);
        }
      `}</style>
      <nav className={`ss-bottom-bar ${visible ? "" : "ss-bottom-bar--hidden"}`}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentPage === tab.page;
          return (
            <Link
              key={tab.page}
              to={createPageUrl(tab.page)}
              className={`ss-tab ${isActive ? "ss-tab--active" : ""}`}
            >
              {isActive && <div className="ss-tab-dot" />}
              <Icon size={20} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
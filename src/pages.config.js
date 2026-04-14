import Calendar from './pages/Calendar';
import Dashboard from './pages/Dashboard';
import FlashSales from './pages/FlashSales';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import Scanner from './pages/Scanner';
import Settings from './pages/Settings';
import DairyDashboard from './pages/DairyDashboard';
import AuraAI from './pages/AuraAI';
import __Layout from './Layout.jsx';

export const PAGES = {
    "Calendar": Calendar,
    "Dashboard": Dashboard,
    "FlashSales": FlashSales,
    "Inventory": Inventory,
    "Orders": Orders,
    "Scanner": Scanner,
    "Settings": Settings,
    "DairyDashboard": DairyDashboard,
    "AuraAI": AuraAI,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};

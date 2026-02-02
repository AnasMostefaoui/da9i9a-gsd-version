/**
 * Collapsible Sidebar for authenticated pages
 * Contains: Logo, navigation, language switcher, user menu
 */

import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import {
  Zap,
  LayoutDashboard,
  Plus,
  LogOut,
  Globe,
  PanelLeftClose,
  PanelLeft,
  Menu,
  X,
} from "lucide-react";
import { useLanguage } from "~/contexts/LanguageContext";

interface AppSidebarProps {
  storeName?: string;
}

const NAV_ITEMS = [
  { path: "/dashboard", icon: LayoutDashboard, labelAr: "لوحة التحكم", labelEn: "Dashboard" },
  { path: "/import", icon: Plus, labelAr: "استيراد منتج", labelEn: "Import Product" },
];

export function AppSidebar({ storeName }: AppSidebarProps) {
  const { language, setLanguage, isRtl } = useLanguage();
  const location = useLocation();

  // Collapsed state - persisted in localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });

  // Mobile menu open state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(isCollapsed));
  }, [isCollapsed]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobile}
        className="lg:hidden fixed top-4 start-4 z-50 p-2 bg-white rounded-xl shadow-lg border border-gray-200"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 h-screen z-40
          bg-white border-e border-gray-200
          flex flex-col
          transition-all duration-300 ease-in-out
          ${isCollapsed ? "w-[72px]" : "w-64"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isRtl ? "right-0 lg:right-auto" : "left-0 lg:left-auto"}
        `}
      >
        {/* Header with Logo and Collapse */}
        <div className={`p-4 border-b border-gray-100 ${isCollapsed ? "px-3" : ""}`}>
          <div className="flex items-center justify-between gap-2">
            <Link to="/dashboard" className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-coral-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-white" fill="white" />
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden min-w-0">
                  <h1 className="font-bold text-lg text-gray-900 truncate">في دقيقة</h1>
                  {storeName && (
                    <p className="text-xs text-gray-500 truncate">{storeName}</p>
                  )}
                </div>
              )}
            </Link>
            {/* Collapse Toggle - Desktop only */}
            <button
              onClick={toggleCollapse}
              className="hidden lg:flex p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex-shrink-0"
              title={isCollapsed ? (language === "ar" ? "توسيع" : "Expand") : (language === "ar" ? "تصغير" : "Collapse")}
            >
              {isCollapsed ? (
                <PanelLeft className="w-5 h-5" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path === "/dashboard" && location.pathname.startsWith("/products"));
            const Icon = item.icon;
            const label = language === "ar" ? item.labelAr : item.labelEn;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl
                  transition-all duration-200
                  ${isActive
                    ? "bg-gradient-to-r from-orange-500 to-coral-500 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                  }
                  ${isCollapsed ? "justify-center" : ""}
                `}
                title={isCollapsed ? label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : ""}`} />
                {!isCollapsed && (
                  <span className="font-medium truncate">{label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-gray-100 space-y-2">
          {/* Language Switcher */}
          <div className={`relative ${isCollapsed ? "px-0" : ""}`}>
            {isCollapsed ? (
              <button
                onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
                className="w-full flex items-center justify-center p-2.5 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
                title={language === "ar" ? "English" : "العربية"}
              >
                <Globe className="w-5 h-5" />
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2">
                <Globe className="w-5 h-5 text-gray-500" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as "ar" | "en")}
                  className="flex-1 bg-transparent text-sm font-medium text-gray-700 cursor-pointer focus:outline-none"
                >
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
              </div>
            )}
          </div>

          {/* Logout */}
          <Link
            to="/auth/logout"
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl
              text-gray-600 hover:bg-red-50 hover:text-red-600
              transition-colors
              ${isCollapsed ? "justify-center" : ""}
            `}
            title={isCollapsed ? (language === "ar" ? "تسجيل الخروج" : "Logout") : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && (
              <span className="font-medium">
                {language === "ar" ? "تسجيل الخروج" : "Logout"}
              </span>
            )}
          </Link>
        </div>
      </aside>
    </>
  );
}

/**
 * Layout wrapper for authenticated pages
 * Provides sidebar + main content area
 */
interface AppLayoutProps {
  children: React.ReactNode;
  storeName?: string;
}

export function AppLayout({ children, storeName }: AppLayoutProps) {
  const { isRtl } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-coral-50 flex" dir={isRtl ? "rtl" : "ltr"}>
      <AppSidebar storeName={storeName} />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}

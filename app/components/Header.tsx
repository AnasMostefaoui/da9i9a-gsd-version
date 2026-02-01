import { Zap, Globe, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router";
import { useLanguage } from "~/contexts/LanguageContext";

interface HeaderProps {
  storeName?: string;
  showAuth?: boolean;
}

export default function Header({ storeName, showAuth = false }: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-coral-500 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" fill="white" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-xl">{t("app.name")}</h1>
              {storeName && (
                <span className="text-sm text-gray-500 hidden sm:inline">
                  • {storeName}
                </span>
              )}
            </div>
          </Link>

          <div className="flex items-center gap-4 sm:gap-6">
            {isLanding && (
              <>
                <a
                  href="#features"
                  className="hidden sm:block text-gray-700 hover:text-orange-500 transition-colors"
                >
                  {t("nav.features")}
                </a>
                <a
                  href="#how-it-works"
                  className="hidden sm:block text-gray-700 hover:text-orange-500 transition-colors"
                >
                  {t("nav.howItWorks")}
                </a>
                <Link
                  to="/auth/salla"
                  className="text-gray-700 hover:text-orange-500 transition-colors"
                >
                  {t("nav.login")}
                </Link>
              </>
            )}

            {showAuth && (
              <Link
                to="/auth/logout"
                className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t("nav.logout")}</span>
              </Link>
            )}

            {/* Language Switcher */}
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as "ar" | "en")}
                className="appearance-none bg-orange-50 border-2 border-orange-200 rounded-lg px-3 py-2 pe-8 font-medium text-orange-600 cursor-pointer hover:bg-orange-100 transition-colors text-sm"
              >
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
              <Globe className="absolute top-1/2 end-2 -translate-y-1/2 w-4 h-4 text-orange-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

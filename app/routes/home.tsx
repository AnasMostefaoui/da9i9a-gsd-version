import type { Route } from "./+types/home";
import { Link } from "react-router";
import {
  Zap,
  Link as LinkIcon,
  Languages,
  Palette,
  ShoppingBag,
  ArrowRight,
  Check,
} from "lucide-react";
import { LanguageProvider, useLanguage } from "~/contexts/LanguageContext";
import Header from "~/components/Header";
import { getMerchantId } from "~/lib/session.server";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "في دقيقة - أنشئ متجرك بالذكاء الاصطناعي | FiDakika" },
    {
      name: "description",
      content: "حول رابط منتج من AliExpress أو Amazon إلى متجر سلة كامل في دقائق",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const merchantId = await getMerchantId(request);
  return { isLoggedIn: !!merchantId };
}

function LandingContent({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { t, isRtl } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-coral-50">
      <Header isLoggedIn={isLoggedIn} />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className={isRtl ? "text-right" : "text-left"}>
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="w-4 h-4" fill="currentColor" />
              {t("landing.badge")}
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight text-gray-900">
              {t("app.tagline")}
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8">
              {t("landing.subtitle")}
            </p>
            <Link
              to="/auth/salla"
              className="inline-flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-coral-500 text-white rounded-xl font-bold text-base sm:text-lg hover:shadow-xl transition-shadow"
            >
              {t("landing.cta")}
              <ArrowRight className={`w-5 h-5 ${isRtl ? "rotate-180" : ""}`} />
            </Link>
          </div>

          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-8 border-white">
              <img
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop"
                alt="FiDakika App"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent"></div>
            </div>
            {/* Floating stats */}
            <div className="absolute -bottom-6 start-0 sm:-start-6 bg-white rounded-xl shadow-lg p-4 border-2 border-orange-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="font-bold text-2xl text-gray-900">2,500+</div>
                  <div className="text-sm text-gray-600">
                    {t("landing.productsImported")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-16 sm:py-20">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">{t("nav.features")}</h2>
          <p className="text-lg sm:text-xl text-gray-600">
            {isRtl
              ? "كل ما تحتاجه لبيع المنتجات العالمية على سلة"
              : "Everything you need to sell global products on Salla"}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 border-2 border-orange-100 hover:border-orange-300 transition-colors">
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
              <LinkIcon className="w-7 h-7 text-orange-500" />
            </div>
            <h3 className="font-bold text-xl mb-2 text-gray-900">{t("landing.feature1.title")}</h3>
            <p className="text-gray-600">{t("landing.feature1.desc")}</p>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-coral-100 hover:border-coral-300 transition-colors">
            <div className="w-14 h-14 bg-coral-100 rounded-xl flex items-center justify-center mb-4">
              <Languages className="w-7 h-7 text-coral-500" />
            </div>
            <h3 className="font-bold text-xl mb-2 text-gray-900">{t("landing.feature2.title")}</h3>
            <p className="text-gray-600">{t("landing.feature2.desc")}</p>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-orange-100 hover:border-orange-300 transition-colors">
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
              <Palette className="w-7 h-7 text-orange-500" />
            </div>
            <h3 className="font-bold text-xl mb-2 text-gray-900">{t("landing.feature3.title")}</h3>
            <p className="text-gray-600">{t("landing.feature3.desc")}</p>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-coral-100 hover:border-coral-300 transition-colors">
            <div className="w-14 h-14 bg-coral-100 rounded-xl flex items-center justify-center mb-4">
              <ShoppingBag className="w-7 h-7 text-coral-500" />
            </div>
            <h3 className="font-bold text-xl mb-2 text-gray-900">{t("landing.feature4.title")}</h3>
            <p className="text-gray-600">{t("landing.feature4.desc")}</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t("landing.how.title")}</h2>
            <p className="text-lg sm:text-xl text-gray-300">{t("landing.how.subtitle")}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-white/20 h-full">
                <div className="w-14 sm:w-16 h-14 sm:h-16 bg-gradient-to-br from-orange-500 to-coral-500 rounded-xl flex items-center justify-center text-xl sm:text-2xl font-bold mb-6">
                  1
                </div>
                <h3 className="font-bold text-xl sm:text-2xl mb-3">{t("landing.how.step1")}</h3>
                <p className="text-gray-300 mb-6">{t("landing.how.step1.desc")}</p>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <code className="text-sm text-orange-400 break-all">
                    https://amazon.com/dp/...
                  </code>
                </div>
              </div>
              <div className="hidden md:flex absolute top-1/2 -end-4 w-8 h-8 bg-orange-500 rounded-full items-center justify-center z-10">
                <ArrowRight className={`w-5 h-5 text-white ${isRtl ? "rotate-180" : ""}`} />
              </div>
            </div>

            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-white/20 h-full">
                <div className="w-14 sm:w-16 h-14 sm:h-16 bg-gradient-to-br from-orange-500 to-coral-500 rounded-xl flex items-center justify-center text-xl sm:text-2xl font-bold mb-6">
                  2
                </div>
                <h3 className="font-bold text-xl sm:text-2xl mb-3">{t("landing.how.step2")}</h3>
                <p className="text-gray-300 mb-6">{t("landing.how.step2.desc")}</p>
                <div className="flex gap-2">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-blue-500 rounded-lg"></div>
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-green-500 rounded-lg"></div>
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-purple-500 rounded-lg"></div>
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-orange-500 rounded-lg"></div>
                </div>
              </div>
              <div className="hidden md:flex absolute top-1/2 -end-4 w-8 h-8 bg-orange-500 rounded-full items-center justify-center z-10">
                <ArrowRight className={`w-5 h-5 text-white ${isRtl ? "rotate-180" : ""}`} />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-white/20">
              <div className="w-14 sm:w-16 h-14 sm:h-16 bg-gradient-to-br from-orange-500 to-coral-500 rounded-xl flex items-center justify-center text-xl sm:text-2xl font-bold mb-6">
                3
              </div>
              <h3 className="font-bold text-xl sm:text-2xl mb-3">{t("landing.how.step3")}</h3>
              <p className="text-gray-300 mb-6">{t("landing.how.step3.desc")}</p>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-medium">{t("landing.ready")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Platforms */}
      <section className="max-w-7xl mx-auto px-6 py-16 sm:py-20">
        <div className="bg-white rounded-2xl p-8 sm:p-12 border-2 border-gray-200">
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-bold mb-6 text-gray-900">{t("landing.platforms")}</h3>
            <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl text-gray-900">Amazon</span>
              </div>
              <div className="w-px h-12 bg-gray-300 hidden sm:block"></div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-coral-500 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl text-gray-900">AliExpress</span>
              </div>
              <div className="w-px h-12 bg-gray-300 hidden sm:block"></div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl text-gray-900">Salla</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 sm:py-20">
        <div className="bg-gradient-to-br from-orange-500 to-coral-500 rounded-2xl p-8 sm:p-12 text-white text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t("landing.ctaTitle")}</h2>
          <p className="text-lg sm:text-xl text-orange-50 mb-8 max-w-2xl mx-auto">
            {t("landing.ctaSubtitle")}
          </p>
          <Link
            to="/auth/salla"
            className="inline-flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-white text-orange-500 rounded-xl font-bold text-base sm:text-lg hover:shadow-xl transition-shadow"
          >
            {t("landing.cta")}
            <ArrowRight className={`w-5 h-5 ${isRtl ? "rotate-180" : ""}`} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-coral-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" fill="white" />
              </div>
              <span className="font-bold">{t("app.name")}</span>
            </div>
            <p className="text-sm text-gray-600">
              © 2026 FiDakika - {t("landing.copyright")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <LanguageProvider>
      <LandingContent isLoggedIn={loaderData.isLoggedIn} />
    </LanguageProvider>
  );
}

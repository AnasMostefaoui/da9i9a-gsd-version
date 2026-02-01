import type { Route } from "./+types/import";
import { useState } from "react";
import { Form, useNavigation, Link } from "react-router";
import { redirect, data } from "react-router";
import { ArrowLeft, Link as LinkIcon, Loader, ShoppingBag } from "lucide-react";
import { db } from "~/lib/db.server";
import { requireMerchant } from "~/lib/session.server";
import { detectPlatform } from "~/services/scraping/index.server";
import { inngest } from "~/inngest/client";
import { LanguageProvider, useLanguage } from "~/contexts/LanguageContext";
import Header from "~/components/Header";

export function meta({}: Route.MetaArgs) {
  return [{ title: "استيراد منتج - في دقيقة" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireMerchant(request);
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const merchantId = await requireMerchant(request);

  const formData = await request.formData();
  const url = formData.get("url") as string;
  const contentLang = (formData.get("contentLang") as "ar" | "en") || "ar";

  if (!url) {
    return data({ error: "الرجاء إدخال رابط المنتج" }, { status: 400 });
  }

  const platform = detectPlatform(url);
  if (!platform) {
    return data({
      error: "الرابط غير صالح. يرجى إدخال رابط من AliExpress أو Amazon",
    }, { status: 400 });
  }

  // Check if scraping providers are configured
  const hasApify = !!process.env.APIFY_TOKEN;
  const hasOxylabs = !!process.env.OXYLABS_USERNAME && !!process.env.OXYLABS_PASSWORD;

  if (!hasApify && !hasOxylabs) {
    // For development without providers, create product with mock data
    console.warn("No scraping providers configured, using mock data");

    const product = await db.product.create({
      data: {
        merchantId,
        sourceUrl: url,
        platform: platform.toUpperCase() as "ALIEXPRESS" | "AMAZON",
        titleEn: `Sample Product from ${platform}`,
        titleAr: `منتج تجريبي من ${platform === "aliexpress" ? "علي إكسبرس" : "أمازون"}`,
        descriptionEn: "This is a sample product description. Configure APIFY_TOKEN or OXYLABS credentials to scrape real products.",
        descriptionAr: "هذا وصف منتج تجريبي. قم بإعداد مفاتيح Apify أو Oxylabs لاستيراد المنتجات الحقيقية.",
        price: 99.99,
        currency: "SAR",
        images: [
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
        ],
        status: "IMPORTED",
        contentLang,
      },
    });

    return redirect(`/products/${product.id}`);
  }

  // Create product with IMPORTING status
  const product = await db.product.create({
    data: {
      merchantId,
      sourceUrl: url,
      platform: platform.toUpperCase() as "ALIEXPRESS" | "AMAZON",
      price: 0,
      currency: "SAR",
      status: "IMPORTING",
      contentLang,
      metadata: JSON.parse(JSON.stringify({
        queuedAt: new Date().toISOString(),
      })),
    },
  });

  console.log(`[Import] Created product ${product.id} with IMPORTING status`);

  // Queue Inngest job for async scraping
  await inngest.send({
    name: "product/scrape.requested",
    data: {
      productId: product.id,
      sourceUrl: url,
      merchantId,
    },
  });

  console.log(`[Import] Queued scrape job for product ${product.id}`);

  // Redirect to status page for polling
  return redirect(`/import/status/${product.id}`);
}

interface ActionData {
  error?: string;
  details?: string;
}

function ImportContent({ actionData }: { actionData: ActionData | undefined }) {
  const { t, isRtl } = useLanguage();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [contentLang, setContentLang] = useState<"ar" | "en">("ar");

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-coral-50">
      <Header showAuth />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back Button */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-500 mb-6 transition-colors"
        >
          <ArrowLeft className={`w-5 h-5 ${isRtl ? "rotate-180" : ""}`} />
          {t("import.back")}
        </Link>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-orange-500 to-coral-500 p-8 text-white text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LinkIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t("import.title")}</h1>
            <p className="text-orange-50">{t("import.pasteLink")}</p>
          </div>

          {/* Form */}
          <Form method="post" className="p-6 sm:p-8 space-y-6">
            {/* Language Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t("import.language")}
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setContentLang("ar")}
                  className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    contentLang === "ar"
                      ? "border-orange-500 bg-orange-50 text-gray-900"
                      : "border-gray-200 bg-white hover:border-orange-300 text-gray-900"
                  }`}
                >
                  <span className="text-2xl">🇸🇦</span>
                  <span className="font-medium text-gray-900">العربية</span>
                  {contentLang === "ar" && (
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setContentLang("en")}
                  className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    contentLang === "en"
                      ? "border-orange-500 bg-orange-50 text-gray-900"
                      : "border-gray-200 bg-white hover:border-orange-300 text-gray-900"
                  }`}
                >
                  <span className="text-2xl">🇺🇸</span>
                  <span className="font-medium text-gray-900">English</span>
                  {contentLang === "en" && (
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  )}
                </button>
              </div>
              <input type="hidden" name="contentLang" value={contentLang} />
              <p className="text-sm text-gray-500 mt-2">{t("import.languageNote")}</p>
            </div>

            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t("import.pasteLink")}
              </label>
              <div className="relative">
                <LinkIcon
                  className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${
                    isRtl ? "end-4" : "start-4"
                  }`}
                />
                <input
                  type="url"
                  name="url"
                  required
                  placeholder={t("import.linkPlaceholder")}
                  className={`w-full ${
                    isRtl ? "pe-12 ps-4" : "ps-12 pe-4"
                  } py-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors bg-white text-gray-900 placeholder-gray-400`}
                  dir="ltr"
                />
              </div>
            </div>

            {/* Error Message */}
            {actionData?.error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                <p className="text-red-600 text-sm font-medium">{actionData.error}</p>
              </div>
            )}

            {/* Import Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold text-lg transition-all ${
                !isSubmitting
                  ? "bg-gradient-to-r from-orange-500 to-coral-500 text-white hover:shadow-xl"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-6 h-6 animate-spin" />
                  {t("import.importing")}
                </>
              ) : (
                <>
                  <ShoppingBag className="w-6 h-6" />
                  {t("import.button")}
                </>
              )}
            </button>

            {/* Supported Platforms */}
            <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3 text-center">
                {t("import.supported")}
              </p>
              <div className="flex justify-center items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">Amazon</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-coral-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">AliExpress</span>
                </div>
              </div>
            </div>

            {/* Info Note */}
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <p className="text-sm text-gray-700">💡 {t("import.note")}</p>
            </div>
          </Form>
        </div>

        {/* Example Links */}
        <div className="mt-8 bg-white rounded-xl p-6 border-2 border-gray-200">
          <h3 className="font-bold mb-4 text-gray-900">{t("import.examples")}</h3>
          <div className="space-y-2">
            <div className="p-3 bg-gray-50 rounded-lg">
              <code className="text-sm text-gray-700 break-all" dir="ltr">
                https://www.amazon.com/dp/B08N5WRWNW
              </code>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <code className="text-sm text-gray-700 break-all" dir="ltr">
                https://www.aliexpress.com/item/1005002345678901.html
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Import({ actionData }: Route.ComponentProps) {
  const typedActionData = actionData as ActionData | undefined;

  return (
    <LanguageProvider>
      <ImportContent actionData={typedActionData} />
    </LanguageProvider>
  );
}

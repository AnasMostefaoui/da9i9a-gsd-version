import type { Route } from "./+types/import";
import { useState } from "react";
import { Form, useNavigation, Link } from "react-router";
import { redirect, data } from "react-router";
import { db } from "~/lib/db.server";
import { requireMerchant } from "~/lib/session.server";
import { detectPlatform, getScrapingOrchestrator } from "~/services/scraping/index.server";
import { getGeminiProvider, isGeminiConfigured } from "~/services/ai";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "استيراد منتج - سلة دقيقة" },
  ];
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
  const forceRefresh = formData.get("forceRefresh") === "true";

  if (!url) {
    return data({ error: "الرجاء إدخال رابط المنتج" }, { status: 400 });
  }

  const platform = detectPlatform(url);
  if (!platform) {
    return data({
      error: "الرابط غير صالح. يرجى إدخال رابط من AliExpress أو Amazon"
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
          "/mock-images/2151232244.jpg",
          "/mock-images/2151232253.jpg",
        ],
        status: "IMPORTED",
        contentLang,
      },
    });

    return redirect(`/products/${product.id}`);
  }

  try {
    // Get the scraping orchestrator (uses fallback chains)
    const orchestrator = getScrapingOrchestrator();

    console.log(`[Import] Scraping product from ${platform}: ${url}`);
    console.log(`[Import] Available providers: ${orchestrator.getAvailableProviders().join(", ")}`);

    const scraped = await orchestrator.scrapeProduct(url, forceRefresh);

    console.log(`[Import] Successfully scraped: "${scraped.title}" via ${scraped.provider}`);

    // Prepare product data
    let titleEn = scraped.title;
    let descriptionEn = scraped.description || null;
    let productStatus: "IMPORTED" | "ENHANCED" = "IMPORTED";
    let aiMetadata: Record<string, unknown> = {};

    // AI Enhancement (if Gemini is configured)
    if (isGeminiConfigured()) {
      try {
        console.log(`[Import] Starting AI enhancement with Gemini...`);
        const gemini = getGeminiProvider();

        const enhanced = await gemini.enhanceProduct({
          title: scraped.title,
          description: scraped.description || "",
          price: scraped.price,
          currency: scraped.currency,
          images: scraped.images,
          brand: scraped.brand,
          specifications: scraped.specifications,
          reviewSummary: scraped.reviewSummary,
          seller: scraped.seller,
          platform: scraped.platform,
          sourceUrl: url,
        });

        console.log(`[Import] AI enhancement complete: "${enhanced.title.slice(0, 50)}..."`);

        // Use AI-enhanced content
        titleEn = enhanced.title;
        descriptionEn = enhanced.description;
        productStatus = "ENHANCED";
        aiMetadata = {
          aiProvider: enhanced.provider,
          aiGeneratedAt: enhanced.generatedAt.toISOString(),
          highlights: enhanced.highlights,
          originalTitle: scraped.title,
          originalDescription: scraped.description,
        };
      } catch (aiError) {
        // AI enhancement failed, but we still have scraped data
        console.error(`[Import] AI enhancement failed:`, aiError);
        console.log(`[Import] Continuing with scraped data only`);
      }
    } else {
      console.log(`[Import] Gemini not configured, skipping AI enhancement`);
    }

    // Save to database
    const product = await db.product.create({
      data: {
        merchantId,
        sourceUrl: url,
        platform: platform.toUpperCase() as "ALIEXPRESS" | "AMAZON",
        titleEn,
        descriptionEn,
        price: scraped.price,
        currency: scraped.currency,
        images: scraped.images,
        status: productStatus,
        contentLang,
        // Store additional metadata as JSON if available
        metadata: JSON.parse(JSON.stringify({
          scrapedAt: scraped.scrapedAt.toISOString(),
          provider: scraped.provider,
          brand: scraped.brand,
          sku: scraped.sku,
          reviewSummary: scraped.reviewSummary,
          seller: scraped.seller,
          ...aiMetadata,
        })),
      },
    });

    return redirect(`/products/${product.id}`);

  } catch (error) {
    console.error("Scraping error:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Provide more specific error messages
    let userMessage = "فشل في استيراد المنتج. يرجى التأكد من صحة الرابط والمحاولة مرة أخرى.";

    if (errorMessage.includes("No title")) {
      userMessage = "لم يتم العثور على بيانات المنتج. تأكد من أن الرابط يشير إلى صفحة منتج صحيحة.";
    } else if (errorMessage.includes("No images")) {
      userMessage = "لم يتم العثور على صور للمنتج. جرب رابط منتج آخر.";
    } else if (errorMessage.includes("timed out")) {
      userMessage = "انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى لاحقاً.";
    } else if (errorMessage.includes("All scraping providers failed")) {
      userMessage = "فشلت جميع محاولات الاستيراد. يرجى المحاولة لاحقاً أو جرب رابط منتج آخر.";
    }

    return data({ error: userMessage, details: errorMessage }, { status: 500 });
  }
}

interface ActionData {
  error?: string;
  details?: string;
}

export default function Import({ actionData }: Route.ComponentProps) {
  const typedActionData = actionData as ActionData | undefined;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [contentLang, setContentLang] = useState<"ar" | "en">("ar");

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            ← العودة
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            استيراد منتج
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              الصق رابط المنتج
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              ادخل رابط منتج من AliExpress أو Amazon وسنقوم باستخراج بيانات المنتج تلقائياً
            </p>

            <Form method="post" className="space-y-4">
              {/* Language Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  لغة المحتوى المُولَّد
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setContentLang("ar")}
                    className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      contentLang === "ar"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400"
                    }`}
                  >
                    🇸🇦 العربية
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentLang("en")}
                    className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      contentLang === "en"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400"
                    }`}
                  >
                    🇺🇸 English
                  </button>
                </div>
                <input type="hidden" name="contentLang" value={contentLang} />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  سيتم إنشاء العنوان والوصف وصفحة الهبوط بهذه اللغة
                </p>
              </div>

              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  رابط المنتج
                </label>
                <input
                  type="url"
                  name="url"
                  id="url"
                  required
                  placeholder="https://www.aliexpress.com/item/..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  dir="ltr"
                />
              </div>

              {typedActionData?.error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">
                    {typedActionData.error}
                  </p>
                  {process.env.NODE_ENV === "development" && typedActionData.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-500 cursor-pointer">
                        تفاصيل الخطأ (للمطورين)
                      </summary>
                      <pre className="mt-2 text-xs text-red-400 whitespace-pre-wrap overflow-auto max-h-32">
                        {typedActionData.details}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Dev option: force refresh cache */}
              {process.env.NODE_ENV === "development" && (
                <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <input
                    type="checkbox"
                    name="forceRefresh"
                    value="true"
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  Force refresh (skip cache)
                </label>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "جاري الاستيراد..." : "استيراد المنتج"}
              </button>
            </Form>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                المنصات المدعومة:
              </h3>
              <div className="flex gap-4">
                <span className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-orange-500">●</span> AliExpress
                </span>
                <span className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-yellow-500">●</span> Amazon
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

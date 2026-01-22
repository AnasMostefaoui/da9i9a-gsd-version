import type { Route } from "./+types/import";
import { Form, useNavigation, Link } from "react-router";
import { redirect, data } from "react-router";
import { db } from "~/lib/db.server";
import { requireMerchant } from "~/lib/session.server";
import { detectPlatform } from "~/services/scraping";
import { ScraperAPIProvider } from "~/services/scraping";

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

  if (!url) {
    return data({ error: "الرجاء إدخال رابط المنتج" }, { status: 400 });
  }

  const platform = detectPlatform(url);
  if (!platform) {
    return data({
      error: "الرابط غير صالح. يرجى إدخال رابط من AliExpress أو Amazon"
    }, { status: 400 });
  }

  // Check if ScraperAPI key is configured
  const scraperApiKey = process.env.SCRAPERAPI_KEY;
  if (!scraperApiKey) {
    // For development without API key, create product with mock data
    console.warn("SCRAPERAPI_KEY not set, using mock data");

    const product = await db.product.create({
      data: {
        merchantId,
        sourceUrl: url,
        platform: platform.toUpperCase() as "ALIEXPRESS" | "AMAZON",
        titleEn: `Sample Product from ${platform}`,
        titleAr: `منتج تجريبي من ${platform === "aliexpress" ? "علي إكسبرس" : "أمازون"}`,
        descriptionEn: "This is a sample product description. Configure SCRAPERAPI_KEY to scrape real products.",
        descriptionAr: "هذا وصف منتج تجريبي. قم بإعداد SCRAPERAPI_KEY لاستيراد المنتجات الحقيقية.",
        price: 99.99,
        currency: "SAR",
        images: [
          "https://placehold.co/400x400/3b82f6/ffffff?text=Product+1",
          "https://placehold.co/400x400/10b981/ffffff?text=Product+2",
          "https://placehold.co/400x400/f59e0b/ffffff?text=Product+3",
        ],
        status: "IMPORTED",
      },
    });

    return redirect(`/products/${product.id}`);
  }

  try {
    // Scrape the product
    const scraper = new ScraperAPIProvider(scraperApiKey);
    const scraped = await scraper.scrapeProduct(url);

    // Save to database
    const product = await db.product.create({
      data: {
        merchantId,
        sourceUrl: url,
        platform: platform.toUpperCase() as "ALIEXPRESS" | "AMAZON",
        titleEn: scraped.title,
        descriptionEn: scraped.description || null,
        price: scraped.price,
        currency: scraped.currency,
        images: scraped.images,
        status: "IMPORTED",
      },
    });

    return redirect(`/products/${product.id}`);

  } catch (error) {
    console.error("Scraping error:", error);
    return data({
      error: "فشل في استيراد المنتج. يرجى التأكد من صحة الرابط والمحاولة مرة أخرى."
    }, { status: 500 });
  }
}

export default function Import({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

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

              {actionData?.error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">
                    {actionData.error}
                  </p>
                </div>
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

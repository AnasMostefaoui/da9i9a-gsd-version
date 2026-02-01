import type { Route } from "./+types/products.$id";
import { Link, Form, useNavigation, useFetcher } from "react-router";
import { redirect, data } from "react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { db } from "~/lib/db.server";
import { requireMerchant } from "~/lib/session.server";
import { getSallaClient } from "~/lib/token-refresh.server";
import { getGeminiProvider, isGeminiConfigured, generateLandingPageContent, translateToArabic } from "~/services/ai";
import type { LandingPageContent } from "~/services/ai/types";
import { LandingPagePreview } from "~/components/landing-page";
import { COLOR_PALETTES, PALETTE_IDS, getPalette } from "~/lib/color-palettes";
import { LanguageProvider, useLanguage } from "~/contexts/LanguageContext";
import Header from "~/components/Header";

export function meta({}: Route.MetaArgs) {
  return [{ title: "تحرير المنتج - في دقيقة" }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const merchantId = await requireMerchant(request);
  const { id } = params;

  const product = await db.product.findFirst({
    where: { id, merchantId },
  });

  if (!product) {
    throw new Response("Product not found", { status: 404 });
  }

  return {
    id: product.id,
    titleAr: product.titleAr,
    titleEn: product.titleEn,
    descriptionAr: product.descriptionAr,
    descriptionEn: product.descriptionEn,
    price: product.price.toString(),
    currency: product.currency,
    images: product.images,
    selectedImages: product.selectedImages,
    enhancedImages: product.enhancedImages,
    status: product.status,
    sourceUrl: product.sourceUrl,
    platform: product.platform,
    sallaProductId: product.sallaProductId,
    landingPageContent: product.landingPageContent as LandingPageContent | null,
    contentLang: product.contentLang as "ar" | "en",
    colorPalette: product.colorPalette,
    metadata: product.metadata as Record<string, unknown> | null,
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const merchantId = await requireMerchant(request);
  const { id } = params;

  const formData = await request.formData();
  const intent = formData.get("intent");

  const product = await db.product.findFirst({
    where: { id, merchantId },
    include: { merchant: true },
  });

  if (!product) {
    throw new Response("Product not found", { status: 404 });
  }

  switch (intent) {
    case "enhance": {
      if (!isGeminiConfigured()) {
        // Mock enhancement for dev without API key
        await db.product.update({
          where: { id },
          data: {
            titleAr: product.titleAr || "عنوان محسّن بالذكاء الاصطناعي",
            titleEn: product.titleEn || "AI Enhanced Title",
            descriptionAr: product.descriptionAr || "وصف محسّن بالذكاء الاصطناعي. هذا منتج رائع يلبي احتياجاتك.",
            descriptionEn: product.descriptionEn || "AI Enhanced Description. This is a great product that meets your needs.",
            status: "ENHANCED",
          },
        });
        return data({ success: true, message: "تم تحسين المنتج (وضع التطوير)", error: null });
      }

      try {
        const gemini = getGeminiProvider();

        // Extract metadata for rich signals
        const metadata = (product.metadata as Record<string, unknown>) || {};

        const enhanced = await gemini.enhanceProduct({
          title: product.titleEn || product.titleAr || "",
          description: product.descriptionEn || product.descriptionAr || "",
          price: Number(product.price),
          currency: product.currency,
          images: product.images,
          brand: metadata.brand as string | undefined,
          specifications: metadata.specifications as Record<string, string> | undefined,
          reviewSummary: metadata.reviewSummary as { rating: number; count: number } | undefined,
          seller: metadata.seller as { name: string; rating?: number } | undefined,
          platform: product.platform.toLowerCase() as "aliexpress" | "amazon",
          sourceUrl: product.sourceUrl,
        });

        await db.product.update({
          where: { id },
          data: {
            titleEn: enhanced.title,
            descriptionEn: enhanced.description,
            status: "ENHANCED",
            metadata: {
              ...(product.metadata as object || {}),
              aiProvider: enhanced.provider,
              aiGeneratedAt: enhanced.generatedAt.toISOString(),
              highlights: enhanced.highlights,
            },
          },
        });

        return data({ success: true, message: "تم تحسين المنتج بنجاح", error: null });
      } catch (error) {
        console.error("Enhancement error:", error);
        return data({ success: false, message: null, error: "فشل في تحسين المنتج" }, { status: 500 });
      }
    }

    case "translate-arabic": {
      if (!isGeminiConfigured()) {
        return data({ success: false, message: null, error: "Gemini API غير مكوّن" }, { status: 500 });
      }

      if (!product.titleEn) {
        return data({ success: false, message: null, error: "يجب وجود عنوان إنجليزي للترجمة" }, { status: 400 });
      }

      try {
        const metadata = (product.metadata as Record<string, unknown>) || {};
        const highlights = metadata.highlights as string[] | undefined;

        const arabicContent = await translateToArabic({
          title: product.titleEn,
          description: product.descriptionEn || "",
          highlights,
        });

        await db.product.update({
          where: { id },
          data: {
            titleAr: arabicContent.titleAr,
            descriptionAr: arabicContent.descriptionAr,
            metadata: {
              ...metadata,
              highlightsAr: arabicContent.highlightsAr,
            },
          },
        });

        return data({ success: true, message: "تمت الترجمة للعربية بنجاح", error: null });
      } catch (error) {
        console.error("Translation error:", error);
        return data({ success: false, message: null, error: "فشل في الترجمة" }, { status: 500 });
      }
    }

    case "push": {
      try {
        // Get a SallaClient with valid token (auto-refreshes with DB locking if needed)
        const salla = await getSallaClient(merchantId);

        // Get images to upload
        const imagesToUpload = product.selectedImages.length > 0
          ? product.selectedImages.map(i => product.images[i]).filter(Boolean)
          : product.images.slice(0, 5);

        // Convert relative URLs to absolute for fetching
        const baseUrl = new URL(request.url).origin;
        const absoluteImageUrls = imagesToUpload.map(img =>
          img.startsWith("http") ? img : `${baseUrl}${img}`
        );

        // Extract metadata for richer product data
        const metadata = (product.metadata as Record<string, unknown>) || {};
        const highlights = metadata.highlights as string[] | undefined;
        const sku = metadata.sku as string | undefined;

        // Build rich description with highlights
        let fullDescription = product.descriptionAr || product.descriptionEn || "";
        if (highlights && highlights.length > 0) {
          fullDescription += "\n\n" + highlights.map(h => `• ${h}`).join("\n");
        }

        // Create product in Salla with image URLs (Salla fetches them)
        const sallaProduct = await salla.createProduct({
          name: product.titleAr || product.titleEn || "منتج جديد",
          description: fullDescription,
          price: Number(product.price),
          quantity: 100,
          status: "sale",
          product_type: "product",
          sku: sku,
          require_shipping: true,
          weight: 0.5, // Default weight for dropshipping products
          weight_type: "kg",
          metadata_title: product.titleEn?.slice(0, 70) || undefined,
          metadata_description: highlights ? highlights.slice(0, 2).join(". ").slice(0, 160) : undefined,
          images: absoluteImageUrls.map((url, i) => ({
            original: url,
            sort: i + 1,
          })),
        });

        await db.product.update({
          where: { id },
          data: {
            status: "PUSHED",
            sallaProductId: sallaProduct.id,
            pushedAt: new Date(),
          },
        });

        return redirect("/dashboard?pushed=true");
      } catch (error) {
        console.error("Push to Salla error:", error);
        await db.product.update({
          where: { id },
          data: { status: "FAILED" },
        });
        return data({ success: false, message: null, error: "فشل في نشر المنتج على سلة" }, { status: 500 });
      }
    }

    case "update": {
      const titleAr = formData.get("titleAr") as string;
      const titleEn = formData.get("titleEn") as string;
      const descriptionAr = formData.get("descriptionAr") as string;
      const descriptionEn = formData.get("descriptionEn") as string;
      const price = formData.get("price") as string;
      const selectedImagesStr = formData.get("selectedImages") as string;

      await db.product.update({
        where: { id },
        data: {
          titleAr: titleAr || null,
          titleEn: titleEn || null,
          descriptionAr: descriptionAr || null,
          descriptionEn: descriptionEn || null,
          price: parseFloat(price) || product.price,
          selectedImages: selectedImagesStr ? JSON.parse(selectedImagesStr) : product.selectedImages,
        },
      });

      return data({ success: true, message: "تم حفظ التغييرات", error: null });
    }

    case "generate-landing-page": {
      try {
        const metadata = (product.metadata as Record<string, unknown>) || {};

        const landingContent = await generateLandingPageContent(
          {
            titleAr: product.titleAr,
            titleEn: product.titleEn,
            descriptionAr: product.descriptionAr,
            descriptionEn: product.descriptionEn,
            price: Number(product.price),
            currency: product.currency,
            images: product.images,
            metadata: {
              brand: metadata.brand as string | undefined,
              reviewSummary: metadata.reviewSummary as { rating: number; count: number } | undefined,
              highlights: metadata.highlights as string[] | undefined,
            },
          },
          product.contentLang as "ar" | "en"
        );

        await db.product.update({
          where: { id },
          data: {
            landingPageContent: landingContent as unknown as object,
          },
        });

        return data({ success: true, message: "تم إنشاء صفحة الهبوط بنجاح", error: null });
      } catch (error) {
        console.error("Landing page generation error:", error);
        return data({ success: false, message: null, error: "فشل في إنشاء صفحة الهبوط" }, { status: 500 });
      }
    }

    case "update-palette": {
      const palette = formData.get("palette") as string;
      if (palette && PALETTE_IDS.includes(palette)) {
        await db.product.update({
          where: { id },
          data: { colorPalette: palette },
        });
        return data({ success: true, message: null, error: null });
      }
      return data({ success: false, message: null, error: "لون غير صالح" }, { status: 400 });
    }

    default:
      return data({ success: false, message: null, error: "إجراء غير معروف" }, { status: 400 });
  }
}

const STATUS_CONFIG: Record<string, { labelAr: string; labelEn: string; color: string }> = {
  IMPORTING: { labelAr: "جاري الاستيراد", labelEn: "Importing", color: "bg-yellow-100 text-yellow-700" },
  IMPORTED: { labelAr: "مستورد", labelEn: "Imported", color: "bg-gray-100 text-gray-700" },
  ENHANCED: { labelAr: "محسّن", labelEn: "Enhanced", color: "bg-blue-100 text-blue-700" },
  PUSHING: { labelAr: "جاري النشر", labelEn: "Publishing", color: "bg-purple-100 text-purple-700" },
  PUSHED: { labelAr: "تم النشر", labelEn: "Published", color: "bg-green-100 text-green-700" },
  FAILED: { labelAr: "فشل", labelEn: "Failed", color: "bg-red-100 text-red-700" },
};

function ProductDetailContent({ product, actionData }: { product: Route.ComponentProps["loaderData"]; actionData: Route.ComponentProps["actionData"] }) {
  const { t, language, isRtl } = useLanguage();
  const navigation = useNavigation();
  const paletteFetcher = useFetcher();
  const isSubmitting = navigation.state === "submitting";
  const currentIntent = navigation.formData?.get("intent") as string | undefined;
  const [selectedImages, setSelectedImages] = useState<number[]>(product.selectedImages);
  const [selectedPalette, setSelectedPalette] = useState(product.colorPalette);
  const currentPalette = getPalette(selectedPalette);

  const toggleImage = (index: number) => {
    setSelectedImages(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const statusConfig = STATUS_CONFIG[product.status] || STATUS_CONFIG.IMPORTED;
  const statusLabel = language === "ar" ? statusConfig.labelAr : statusConfig.labelEn;

  // Get selected images for preview
  const previewImages = selectedImages.length > 0
    ? selectedImages.map(i => product.images[i]).filter(Boolean)
    : product.images.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-coral-50">
      <Header showAuth />

      {/* Sub Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors"
            >
              <ArrowLeft className={`w-5 h-5 ${isRtl ? "rotate-180" : ""}`} />
              {t("import.back")}
            </Link>
            <h1 className="text-xl font-bold">{t("config.title")}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              {product.contentLang === "ar" ? "🇸🇦 العربية" : "🇺🇸 English"}
            </span>
            <span className={`px-3 py-1 text-sm rounded-full ${statusConfig.color}`}>
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Content - Side by Side Layout */}
      <div className="flex h-[calc(100vh-130px)]">
        {/* Left Panel - Form (55%) */}
        <div className="w-[55%] overflow-y-auto p-6 border-e border-gray-200">
          {(actionData?.message || actionData?.error) && (
            <div className={`mb-6 p-4 rounded-lg border ${
              actionData.error
                ? "bg-red-50 border-red-200 text-red-600"
                : "bg-green-50 border-green-200 text-green-600"
            }`}>
              {actionData.message || actionData.error}
            </div>
          )}

          {/* Images Section */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              صور المنتج
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              اختر الصور التي تريد استخدامها في متجرك
            </p>
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleImage(index)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImages.includes(index)
                      ? "border-orange-500 ring-2 ring-orange-500/30"
                      : "border-gray-200 hover:border-orange-300"
                  }`}
                >
                  <img src={image} alt={`صورة ${index + 1}`} className="w-full h-full object-cover" />
                  {selectedImages.includes(index) && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Product Details Form */}
          <Form
            method="post"
            key={`${product.titleAr}-${product.descriptionAr}`}
            className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 mb-6"
          >
            <input type="hidden" name="intent" value="update" />
            <input type="hidden" name="selectedImages" value={JSON.stringify(selectedImages)} />

            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              تفاصيل المنتج
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    العنوان (عربي)
                  </label>
                  <input
                    type="text"
                    name="titleAr"
                    defaultValue={product.titleAr || ""}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    العنوان (إنجليزي)
                  </label>
                  <input
                    type="text"
                    name="titleEn"
                    defaultValue={product.titleEn || ""}
                    dir="ltr"
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الوصف (عربي)
                  </label>
                  <textarea
                    name="descriptionAr"
                    rows={3}
                    defaultValue={product.descriptionAr || ""}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الوصف (إنجليزي)
                  </label>
                  <textarea
                    name="descriptionEn"
                    rows={3}
                    defaultValue={product.descriptionEn || ""}
                    dir="ltr"
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    السعر
                  </label>
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    defaultValue={product.price}
                    dir="ltr"
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    العملة
                  </label>
                  <input
                    type="text"
                    value={product.currency}
                    disabled
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg bg-gray-100 text-gray-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    حفظ التغييرات
                  </button>
                </div>
              </div>
            </div>
          </Form>

          {/* Arabic Translation Warning */}
          {product.contentLang === "ar" && !product.titleAr && product.titleEn && (
            <div className="mb-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">
                    المحتوى العربي غير مكتمل
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    اخترت اللغة العربية عند الاستيراد، لكن الترجمة لم تكتمل. انقر على "ترجمة" لإكمال المحتوى العربي.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Enhance Card */}
            <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                تحسين بالذكاء الاصطناعي
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                تحسين العنوان والوصف تلقائياً
              </p>
              <Form method="post">
                <input type="hidden" name="intent" value="enhance" />
                <button
                  type="submit"
                  disabled={isSubmitting || product.status === "PUSHED"}
                  className="w-full px-4 py-2 text-sm text-white bg-gradient-to-r from-orange-500 to-coral-500 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting && currentIntent === "enhance" ? "جاري التحسين..." : "✨ تحسين"}
                </button>
              </Form>
            </div>

            {/* Translate to Arabic Card */}
            <div className={`bg-white rounded-xl shadow-sm border-2 p-4 ${
              product.contentLang === "ar" && !product.titleAr && product.titleEn
                ? "border-amber-400 ring-2 ring-amber-200"
                : "border-gray-200"
            }`}>
              <h3 className="font-semibold text-gray-900 mb-2">
                ترجمة للعربية
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                ترجمة المحتوى بأسلوب سعودي
              </p>
              <Form method="post">
                <input type="hidden" name="intent" value="translate-arabic" />
                <button
                  type="submit"
                  disabled={isSubmitting || !product.titleEn || product.status === "PUSHED"}
                  className={`w-full px-4 py-2 text-sm text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    product.contentLang === "ar" && !product.titleAr && product.titleEn
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg animate-pulse"
                      : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg"
                  }`}
                >
                  {isSubmitting && currentIntent === "translate-arabic" ? "جاري الترجمة..." : "🇸🇦 ترجمة"}
                </button>
              </Form>
              {!product.titleEn && (
                <p className="mt-2 text-xs text-amber-600">يجب وجود عنوان إنجليزي</p>
              )}
            </div>
          </div>

          {/* Second Actions Row */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Push to Salla Card */}
            <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                نشر في سلة
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                إنشاء المنتج في متجرك
              </p>
              <Form method="post">
                <input type="hidden" name="intent" value="push" />
                <button
                  type="submit"
                  disabled={isSubmitting || product.status === "PUSHED"}
                  className="w-full px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {product.status === "PUSHED" ? "✓ تم النشر" : isSubmitting && currentIntent === "push" ? "جاري النشر..." : "🚀 نشر"}
                </button>
              </Form>
              {product.sallaProductId && (
                <p className="mt-2 text-xs text-gray-500">
                  معرف سلة: {product.sallaProductId}
                </p>
              )}
            </div>
          </div>

          {/* Source Info */}
          <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
            <p className="text-xs text-gray-500 mb-1">المصدر:</p>
            <p className="text-sm text-gray-600 mb-2">
              {product.platform === "ALIEXPRESS" ? "AliExpress" : "Amazon"}
            </p>
            <a
              href={product.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-orange-500 hover:text-orange-600 hover:underline break-all"
              dir="ltr"
            >
              {product.sourceUrl}
            </a>
          </div>
        </div>

        {/* Right Panel - Mobile Preview (45%) */}
        <div className="w-[45%] bg-gray-100 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              معاينة صفحة الهبوط
            </h2>
            <Form method="post">
              <input type="hidden" name="intent" value="generate-landing-page" />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-coral-500 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isSubmitting && currentIntent === "generate-landing-page"
                  ? "جاري الإنشاء..."
                  : product.landingPageContent
                    ? "🔄 إعادة الإنشاء"
                    : "✨ إنشاء صفحة هبوط"}
              </button>
            </Form>
          </div>

          {/* Color Palette Selector - Compact Horizontal */}
          <div className="mb-3 flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              الألوان:
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {PALETTE_IDS.map((paletteId) => {
                const palette = COLOR_PALETTES[paletteId];
                const isSelected = selectedPalette === paletteId;
                return (
                  <button
                    key={paletteId}
                    type="button"
                    onClick={() => {
                      setSelectedPalette(paletteId);
                      paletteFetcher.submit(
                        { intent: "update-palette", palette: paletteId },
                        { method: "post" }
                      );
                    }}
                    className={`relative flex gap-0.5 p-1 rounded-md border-2 transition-all ${
                      isSelected
                        ? "border-orange-500 ring-1 ring-orange-500/30"
                        : "border-gray-200 hover:border-orange-300"
                    }`}
                    title={palette.nameAr}
                  >
                    <div
                      className="w-5 h-5 rounded-sm"
                      style={{ backgroundColor: palette.primary }}
                    />
                    <div
                      className="w-5 h-5 rounded-sm"
                      style={{ backgroundColor: palette.accent }}
                    />
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[6px]">✓</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Frame */}
          <div className="flex-1 flex items-start justify-center overflow-hidden">
            <div className="w-[375px] h-[667px] bg-white rounded-[40px] shadow-xl border-8 border-gray-800 overflow-hidden relative">
              {/* Phone Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-10" />

              {/* Screen Content */}
              <div className="h-full overflow-hidden pt-6">
                <LandingPagePreview
                  content={product.landingPageContent}
                  productImages={previewImages}
                  price={product.price}
                  currency={product.currency}
                  palette={currentPalette}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetail({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <LanguageProvider>
      <ProductDetailContent product={loaderData} actionData={actionData} />
    </LanguageProvider>
  );
}

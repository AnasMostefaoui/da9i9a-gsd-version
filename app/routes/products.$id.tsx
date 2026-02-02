import type { Route } from "./+types/products.$id";
import { Link, Form, useNavigation, useFetcher } from "react-router";
import { redirect, data } from "react-router";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { db } from "~/lib/db.server";
import { requireMerchant } from "~/lib/session.server";
import { getSallaClient } from "~/lib/token-refresh.server";
import { inngest } from "~/inngest/client";
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

  const metadata = (product.metadata as Record<string, unknown>) || {};

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
    // AI processing state
    aiProcessing: metadata.aiProcessing === true,
    aiTasks: (metadata.aiTasks as string[]) || [],
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
    // Queue single AI task via Inngest
    case "enhance": {
      const tasks: Array<"enhance" | "translate" | "landing-page"> = ["enhance"];
      const metadata = (product.metadata as object) || {};

      await db.product.update({
        where: { id },
        data: {
          metadata: {
            ...metadata,
            aiProcessing: true,
            aiTasks: tasks,
            aiResults: {},
            aiErrors: [],
          },
        },
      });

      await inngest.send({
        name: "product/enhance.requested",
        data: { productId: id, merchantId, tasks },
      });

      return data({ success: true, message: "جاري تحسين المحتوى...", error: null, processing: true });
    }

    case "translate-arabic": {
      if (!product.titleEn) {
        return data({ success: false, message: null, error: "يجب وجود عنوان إنجليزي للترجمة" }, { status: 400 });
      }

      const tasks: Array<"enhance" | "translate" | "landing-page"> = ["translate"];
      const metadata = (product.metadata as object) || {};

      await db.product.update({
        where: { id },
        data: {
          metadata: {
            ...metadata,
            aiProcessing: true,
            aiTasks: tasks,
            aiResults: {},
            aiErrors: [],
          },
        },
      });

      await inngest.send({
        name: "product/enhance.requested",
        data: { productId: id, merchantId, tasks },
      });

      return data({ success: true, message: "جاري الترجمة للعربية...", error: null, processing: true });
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
      const tasks: Array<"enhance" | "translate" | "landing-page"> = ["landing-page"];
      const metadata = (product.metadata as object) || {};

      await db.product.update({
        where: { id },
        data: {
          metadata: {
            ...metadata,
            aiProcessing: true,
            aiTasks: tasks,
            aiResults: {},
            aiErrors: [],
          },
        },
      });

      await inngest.send({
        name: "product/enhance.requested",
        data: { productId: id, merchantId, tasks },
      });

      return data({ success: true, message: "جاري إنشاء صفحة الهبوط...", error: null, processing: true });
    }

    // Queue ALL AI tasks at once (enhance → translate → landing page)
    case "enhance-all": {
      const tasks: Array<"enhance" | "translate" | "landing-page"> = ["enhance", "translate", "landing-page"];
      const metadata = (product.metadata as object) || {};

      await db.product.update({
        where: { id },
        data: {
          metadata: {
            ...metadata,
            aiProcessing: true,
            aiTasks: tasks,
            aiResults: {},
            aiErrors: [],
          },
        },
      });

      await inngest.send({
        name: "product/enhance.requested",
        data: { productId: id, merchantId, tasks },
      });

      return data({ success: true, message: "جاري معالجة المنتج بالكامل...", error: null, processing: true });
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

interface AIStatus {
  processing: boolean;
  tasks: string[];
  completedTasks: string[];
  errors: string[];
  status: string;
}

function ProductDetailContent({ product, actionData }: { product: Route.ComponentProps["loaderData"]; actionData: Route.ComponentProps["actionData"] }) {
  const { t, language, isRtl } = useLanguage();
  const navigation = useNavigation();
  const paletteFetcher = useFetcher();
  const isSubmitting = navigation.state === "submitting";
  const currentIntent = navigation.formData?.get("intent") as string | undefined;
  const [selectedImages, setSelectedImages] = useState<number[]>(product.selectedImages);
  const [selectedPalette, setSelectedPalette] = useState(product.colorPalette);
  const currentPalette = getPalette(selectedPalette);

  // AI Processing state
  const [aiStatus, setAiStatus] = useState<AIStatus>({
    processing: product.aiProcessing,
    tasks: product.aiTasks,
    completedTasks: [],
    errors: [],
    status: product.status,
  });

  // Poll for AI status when processing
  const pollAIStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/ai-status/${product.id}`);
      if (response.ok) {
        const data: AIStatus = await response.json();
        setAiStatus(data);

        // If processing just finished, reload the page data
        if (!data.processing && aiStatus.processing) {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error("Failed to poll AI status:", error);
    }
  }, [product.id, aiStatus.processing]);

  useEffect(() => {
    // Start polling if processing
    if (aiStatus.processing) {
      const interval = setInterval(pollAIStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [aiStatus.processing, pollAIStatus]);

  // Start polling after action returns processing=true
  useEffect(() => {
    const actionResult = actionData as { processing?: boolean } | undefined;
    if (actionResult?.processing) {
      setAiStatus(prev => ({ ...prev, processing: true }));
    }
  }, [actionData]);

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
        <div className="max-w-7xl mx-auto px-3 lg:px-6 py-3 lg:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 lg:gap-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-1 lg:gap-2 text-gray-600 hover:text-orange-500 transition-colors"
            >
              <ArrowLeft className={`w-4 lg:w-5 h-4 lg:h-5 ${isRtl ? "rotate-180" : ""}`} />
              <span className="text-sm lg:text-base">{t("import.back")}</span>
            </Link>
            <h1 className="text-base lg:text-xl font-bold hidden sm:block">{t("config.title")}</h1>
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
            <span className="text-xs text-gray-500 hidden sm:inline">
              {product.contentLang === "ar" ? "🇸🇦 العربية" : "🇺🇸 English"}
            </span>
            <span className={`px-2 lg:px-3 py-0.5 lg:py-1 text-xs lg:text-sm rounded-full ${statusConfig.color}`}>
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Content - Responsive Layout */}
      <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-130px)]">
        {/* Main Panel - Form */}
        <div className="flex-1 lg:w-[55%] overflow-y-auto p-4 lg:p-6 lg:border-e border-gray-200">
          {/* AI Processing Banner */}
          {aiStatus.processing && (
            <div className="mb-6 p-4 rounded-xl border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50">
              <div className="flex items-center gap-3 mb-3">
                <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                <span className="font-semibold text-orange-700">
                  جاري معالجة المنتج بالذكاء الاصطناعي...
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {aiStatus.tasks.map((task) => {
                  const isCompleted = aiStatus.completedTasks.includes(task);
                  const labels: Record<string, string> = {
                    enhance: "تحسين المحتوى",
                    translate: "الترجمة",
                    "landing-page": "صفحة الهبوط",
                  };
                  return (
                    <span
                      key={task}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isCompleted
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700 animate-pulse"
                      }`}
                    >
                      {isCompleted ? "✓" : "⏳"} {labels[task] || task}
                    </span>
                  );
                })}
              </div>
              {aiStatus.errors.length > 0 && (
                <div className="mt-3 text-sm text-red-600">
                  {aiStatus.errors.map((error, i) => (
                    <p key={i}>⚠️ {error}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {(actionData?.message || actionData?.error) && !aiStatus.processing && (
            <div className={`mb-6 p-4 rounded-lg border ${
              actionData.error
                ? "bg-red-50 border-red-200 text-red-600"
                : "bg-green-50 border-green-200 text-green-600"
            }`}>
              {actionData.message || actionData.error}
            </div>
          )}

          {/* Images Section */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4 lg:p-6 mb-4 lg:mb-6">
            <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-2 lg:mb-4">
              صور المنتج
            </h2>
            <p className="text-xs lg:text-sm text-gray-600 mb-3 lg:mb-4">
              اختر الصور التي تريد استخدامها في متجرك
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 lg:gap-3">
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
            className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4 lg:p-6 mb-4 lg:mb-6"
          >
            <input type="hidden" name="intent" value="update" />
            <input type="hidden" name="selectedImages" value={JSON.stringify(selectedImages)} />

            <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">
              تفاصيل المنتج
            </h2>

            <div className="space-y-3 lg:space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                <div>
                  <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                <div>
                  <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">
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

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                <div>
                  <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">
                    العملة
                  </label>
                  <input
                    type="text"
                    value={product.currency}
                    disabled
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg bg-gray-100 text-gray-500"
                  />
                </div>
                <div className="col-span-2 lg:col-span-1 flex items-end">
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

          {/* Quick Enhance All Button */}
          {!aiStatus.processing && product.status !== "PUSHED" && (
            <div className="mb-4 lg:mb-6">
              <Form method="post">
                <input type="hidden" name="intent" value="enhance-all" />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-4 lg:px-6 py-3 lg:py-4 text-sm lg:text-lg font-bold text-white bg-gradient-to-r from-orange-500 via-coral-500 to-pink-500 rounded-xl hover:shadow-xl transition-all disabled:opacity-50"
                >
                  🚀 تحسين كامل بالذكاء الاصطناعي
                  <span className="hidden sm:inline"> (تحسين + ترجمة + صفحة هبوط)</span>
                </button>
              </Form>
            </div>
          )}

          {/* Actions Grid - Stack on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 mb-4 lg:mb-6">
            {/* Enhance Card */}
            <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-3 lg:p-4">
              <h3 className="font-semibold text-gray-900 mb-1 lg:mb-2 text-sm lg:text-base">
                تحسين بالذكاء الاصطناعي
              </h3>
              <p className="text-xs text-gray-600 mb-2 lg:mb-3">
                تحسين العنوان والوصف تلقائياً
              </p>
              <Form method="post">
                <input type="hidden" name="intent" value="enhance" />
                <button
                  type="submit"
                  disabled={isSubmitting || aiStatus.processing || product.status === "PUSHED"}
                  className="w-full px-4 py-2 text-sm text-white bg-gradient-to-r from-orange-500 to-coral-500 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting && currentIntent === "enhance" ? "جاري الإرسال..." : "✨ تحسين"}
                </button>
              </Form>
            </div>

            {/* Translate to Arabic Card */}
            <div className={`bg-white rounded-xl shadow-sm border-2 p-3 lg:p-4 ${
              product.contentLang === "ar" && !product.titleAr && product.titleEn
                ? "border-amber-400 ring-2 ring-amber-200"
                : "border-gray-200"
            }`}>
              <h3 className="font-semibold text-gray-900 mb-1 lg:mb-2 text-sm lg:text-base">
                ترجمة للعربية
              </h3>
              <p className="text-xs text-gray-600 mb-2 lg:mb-3">
                ترجمة المحتوى بأسلوب سعودي
              </p>
              <Form method="post">
                <input type="hidden" name="intent" value="translate-arabic" />
                <button
                  type="submit"
                  disabled={isSubmitting || aiStatus.processing || !product.titleEn || product.status === "PUSHED"}
                  className={`w-full px-4 py-2 text-sm text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    product.contentLang === "ar" && !product.titleAr && product.titleEn
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg animate-pulse"
                      : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg"
                  }`}
                >
                  {isSubmitting && currentIntent === "translate-arabic" ? "جاري الإرسال..." : "🇸🇦 ترجمة"}
                </button>
              </Form>
              {!product.titleEn && (
                <p className="mt-2 text-xs text-amber-600">يجب وجود عنوان إنجليزي</p>
              )}
            </div>

            {/* Push to Salla Card */}
            <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-3 lg:p-4 sm:col-span-2 lg:col-span-1">
              <h3 className="font-semibold text-gray-900 mb-1 lg:mb-2 text-sm lg:text-base">
                نشر في سلة
              </h3>
              <p className="text-xs text-gray-600 mb-2 lg:mb-3">
                إنشاء المنتج في متجرك
              </p>
              <Form method="post">
                <input type="hidden" name="intent" value="push" />
                <button
                  type="submit"
                  disabled={isSubmitting || aiStatus.processing || product.status === "PUSHED"}
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

          {/* Mobile-only: Landing Page Controls */}
          <div className="lg:hidden bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-sm">
                صفحة الهبوط
              </h3>
              <Form method="post">
                <input type="hidden" name="intent" value="generate-landing-page" />
                <button
                  type="submit"
                  disabled={isSubmitting || aiStatus.processing}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-orange-500 to-coral-500 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isSubmitting && currentIntent === "generate-landing-page"
                    ? "جاري..."
                    : product.landingPageContent
                      ? "🔄 إعادة"
                      : "✨ إنشاء"}
                </button>
              </Form>
            </div>
            {/* Color Palette for Mobile */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-600">الألوان:</span>
              {PALETTE_IDS.slice(0, 6).map((paletteId) => {
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
                    className={`flex gap-0.5 p-0.5 rounded border-2 transition-all ${
                      isSelected
                        ? "border-orange-500"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: palette.primary }} />
                    <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: palette.accent }} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Source Info */}
          <div className="bg-gray-50 rounded-xl p-3 lg:p-4 border-2 border-gray-200">
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

        {/* Right Panel - Mobile Preview - Hidden on mobile, shown on lg+ */}
        <div className="hidden lg:flex lg:w-[45%] bg-gray-100 p-6 flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              معاينة صفحة الهبوط
            </h2>
            <Form method="post">
              <input type="hidden" name="intent" value="generate-landing-page" />
              <button
                type="submit"
                disabled={isSubmitting || aiStatus.processing}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-coral-500 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isSubmitting && currentIntent === "generate-landing-page"
                  ? "جاري الإرسال..."
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

import type { Route } from "./+types/dashboard";
import { Link } from "react-router";
import { Plus, Package, Upload, Edit, Eye, Zap } from "lucide-react";
import { db } from "~/lib/db.server";
import { requireMerchant, isDevBypass, DEV_MERCHANT_ID } from "~/lib/session.server";
import { LanguageProvider, useLanguage } from "~/contexts/LanguageContext";
import { AppLayout } from "~/components/AppSidebar";

export function meta({}: Route.MetaArgs) {
  return [{ title: "لوحة التحكم - في دقيقة" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const merchantId = await requireMerchant(request);

  let merchant = await db.merchant.findUnique({
    where: { id: merchantId },
    include: {
      products: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // Create dev merchant if in bypass mode and doesn't exist
  if (!merchant && isDevBypass()) {
    merchant = await db.merchant.create({
      data: {
        id: DEV_MERCHANT_ID,
        sallaId: 999999,
        storeName: "متجر التطوير",
        storeUrl: "dev-store.salla.sa",
        email: "dev@test.com",
        accessToken: "dev-token",
        refreshToken: "dev-refresh",
        tokenExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      include: {
        products: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  if (!merchant) {
    throw new Response("Merchant not found", { status: 404 });
  }

  return {
    merchant: {
      id: merchant.id,
      storeName: merchant.storeName,
    },
    products: merchant.products.map((p) => ({
      id: p.id,
      titleAr: p.titleAr,
      titleEn: p.titleEn,
      price: p.price.toString(),
      currency: p.currency,
      status: p.status,
      platform: p.platform,
      images: p.images,
      createdAt: p.createdAt.toISOString(),
    })),
  };
}

const STATUS_CONFIG: Record<string, { labelAr: string; labelEn: string; color: string }> = {
  IMPORTING: { labelAr: "جاري الاستيراد", labelEn: "Importing", color: "bg-yellow-100 text-yellow-700" },
  IMPORTED: { labelAr: "مستورد", labelEn: "Imported", color: "bg-gray-100 text-gray-700" },
  ENHANCED: { labelAr: "محسّن", labelEn: "Enhanced", color: "bg-blue-100 text-blue-700" },
  PUSHING: { labelAr: "جاري النشر", labelEn: "Publishing", color: "bg-purple-100 text-purple-700" },
  PUSHED: { labelAr: "منشور", labelEn: "Published", color: "bg-green-100 text-green-700" },
  FAILED: { labelAr: "فشل", labelEn: "Failed", color: "bg-red-100 text-red-700" },
};

interface DashboardContentProps {
  merchant: { id: string; storeName: string };
  products: Array<{
    id: string;
    titleAr: string | null;
    titleEn: string | null;
    price: string;
    currency: string;
    status: string;
    platform: string;
    images: string[];
    createdAt: string;
  }>;
}

function DashboardContent({ merchant, products }: DashboardContentProps) {
  const { t, language, isRtl } = useLanguage();

  const publishedCount = products.filter((p) => p.status === "PUSHED").length;
  const draftCount = products.filter((p) => !["PUSHED", "FAILED"].includes(p.status)).length;

  return (
    <AppLayout storeName={merchant.storeName}>
      <div className="max-w-6xl mx-auto px-6 py-8 pt-16 lg:pt-8">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t("dashboard.title")}</h1>
            <p className="text-gray-600">{t("dashboard.subtitle")}</p>
          </div>
          <Link
            to="/import"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-coral-500 text-white rounded-xl font-bold hover:shadow-lg transition-shadow"
          >
            <Plus className="w-5 h-5" />
            {t("dashboard.addProduct")}
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">{t("dashboard.totalProducts")}</div>
              <Package className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold">{products.length}</div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">{t("dashboard.published")}</div>
              <Upload className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold">{publishedCount}</div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">{t("dashboard.drafts")}</div>
              <Edit className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold">{draftCount}</div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">{t("dashboard.thisMonth")}</div>
              <Zap className="w-5 h-5 text-coral-500" fill="currentColor" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold">{products.length}</div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">{t("dashboard.myProducts")}</h2>

          {products.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t("dashboard.noProducts")}</h3>
              <p className="text-gray-600 mb-6">{t("dashboard.noProductsDesc")}</p>
              <Link
                to="/import"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-coral-500 text-white rounded-xl font-bold hover:shadow-lg transition-shadow"
              >
                <Plus className="w-5 h-5" />
                {t("dashboard.addProduct")}
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {products.map((product) => {
                const statusConfig = STATUS_CONFIG[product.status] || STATUS_CONFIG.IMPORTED;
                const statusLabel = language === "ar" ? statusConfig.labelAr : statusConfig.labelEn;
                const image = product.images[0] || "https://placehold.co/400x400/fed7aa/ea580c?text=No+Image";
                const title = (language === "ar" ? product.titleAr : product.titleEn) || product.titleAr || product.titleEn || "منتج بدون عنوان";

                return (
                  <div
                    key={product.id}
                    className="group bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-orange-300 transition-colors"
                  >
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute top-3 end-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          {statusLabel}
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                            product.platform === "AMAZON"
                              ? "bg-orange-100 text-orange-600"
                              : "bg-coral-100 text-coral-600"
                          }`}
                        >
                          {product.platform === "AMAZON" ? "A" : "AE"}
                        </div>
                        <span className="text-xs text-gray-500 uppercase">
                          {product.platform === "AMAZON" ? "Amazon" : "AliExpress"}
                        </span>
                      </div>

                      <h3 className="font-bold mb-2 line-clamp-2">{title}</h3>
                      <div className="text-xl font-bold text-orange-500 mb-4">
                        {product.price} {product.currency}
                      </div>

                      <div className="flex gap-2">
                        <Link
                          to={`/products/${product.id}`}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-lg font-medium hover:bg-orange-100 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          {t("dashboard.edit")}
                        </Link>
                        <button
                          type="button"
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          {t("dashboard.preview")}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  return (
    <LanguageProvider>
      <DashboardContent {...loaderData} />
    </LanguageProvider>
  );
}

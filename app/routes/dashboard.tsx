import type { Route } from "./+types/dashboard";
import { Link } from "react-router";
import { db } from "~/lib/db.server";
import { requireMerchant } from "~/lib/session.server";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "لوحة التحكم - سلة دقيقة" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const merchantId = await requireMerchant(request);

  const merchant = await db.merchant.findUnique({
    where: { id: merchantId },
    include: {
      products: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!merchant) {
    throw new Response("Merchant not found", { status: 404 });
  }

  return {
    merchant: {
      id: merchant.id,
      storeName: merchant.storeName,
    },
    products: merchant.products.map(p => ({
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

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  IMPORTING: { label: "جاري الاستيراد", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  IMPORTED: { label: "مستورد", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
  ENHANCED: { label: "محسّن", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  PUSHING: { label: "جاري النشر", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  PUSHED: { label: "تم النشر", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  FAILED: { label: "فشل", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { merchant, products } = loaderData;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              سلة دقيقة
            </h1>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {merchant.storeName}
            </span>
          </div>
          <Link
            to="/import"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + استيراد منتج
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              لا توجد منتجات بعد
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              ابدأ باستيراد أول منتج من AliExpress أو Amazon
            </p>
            <Link
              to="/import"
              className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              استيراد منتج جديد
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const status = STATUS_LABELS[product.status] || STATUS_LABELS.IMPORTED;
              const image = product.images[0] || "https://placehold.co/400x400/e2e8f0/64748b?text=No+Image";

              return (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800">
                    <img
                      src={image}
                      alt={product.titleAr || product.titleEn || "منتج"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1 line-clamp-2">
                      {product.titleAr || product.titleEn || "منتج بدون عنوان"}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {product.price} {product.currency}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {product.platform === "ALIEXPRESS" ? "AliExpress" : "Amazon"}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

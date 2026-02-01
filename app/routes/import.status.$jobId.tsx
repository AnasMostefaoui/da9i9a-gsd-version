/**
 * Import Status Page
 *
 * Polls the scraping job status and redirects when complete.
 * Shows progress indicator during scraping and error state if failed.
 */

import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useLoaderData } from "react-router";
import { redirect } from "react-router";
import { ArrowLeft, AlertCircle, Loader, CheckCircle } from "lucide-react";
import { db } from "~/lib/db.server";
import { requireMerchant } from "~/lib/session.server";
import { LanguageProvider, useLanguage } from "~/contexts/LanguageContext";
import Header from "~/components/Header";

interface LoaderData {
  jobId: string;
  sourceUrl: string;
  initialStatus: string;
}

export const meta: MetaFunction = () => {
  return [
    { title: "جاري الاستيراد... - في دقيقة" },
  ];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const merchantId = await requireMerchant(request);

  const jobId = params.jobId;
  if (!jobId) {
    return redirect("/import");
  }

  // Verify product exists and belongs to merchant
  const product = await db.product.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      merchantId: true,
      status: true,
      sourceUrl: true,
    },
  });

  if (!product || product.merchantId !== merchantId) {
    return redirect("/import");
  }

  // If already complete, redirect to product page
  if (product.status === "IMPORTED" || product.status === "ENHANCED") {
    return redirect(`/products/${product.id}`);
  }

  return {
    jobId: product.id,
    sourceUrl: product.sourceUrl,
    initialStatus: product.status,
  };
}

interface ScrapeStatusResponse {
  status: "IMPORTING" | "IMPORTED" | "ENHANCED" | "FAILED";
  productId: string;
  error: string | null;
}

function ImportStatusContent() {
  const { jobId, sourceUrl, initialStatus } = useLoaderData<LoaderData>();
  const navigate = useNavigate();
  const { t, isRtl } = useLanguage();

  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  const pollStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/scrape-status/${jobId}`);
      const data: ScrapeStatusResponse = await response.json();

      setStatus(data.status);

      if (data.status === "IMPORTED" || data.status === "ENHANCED") {
        // Success - redirect to product page
        navigate(`/products/${data.productId}`);
      } else if (data.status === "FAILED") {
        // Failed - show error
        setError(data.error || "حدث خطأ أثناء استيراد المنتج");
      }

      setPollCount((c) => c + 1);
    } catch (err) {
      console.error("Status poll error:", err);
      // Don't set error for network issues, keep polling
    }
  }, [jobId, navigate]);

  useEffect(() => {
    // Don't poll if already complete or failed
    if (status === "IMPORTED" || status === "ENHANCED" || status === "FAILED") {
      return;
    }

    // Poll every 10 seconds to reduce server load
    const interval = setInterval(pollStatus, 10000);

    // Initial poll
    pollStatus();

    return () => clearInterval(interval);
  }, [status, pollStatus]);

  // Helper to get platform from URL
  const getPlatform = (url: string): string => {
    if (url.includes("aliexpress")) return "AliExpress";
    if (url.includes("amazon")) return "Amazon";
    return "Unknown";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-coral-50">
      <Header showAuth />

      {/* Sub Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            to="/import"
            className="flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors"
          >
            <ArrowLeft className={`w-5 h-5 ${isRtl ? "rotate-180" : ""}`} />
            {t("import.back")}
          </Link>
          <h1 className="text-xl font-bold">{t("import.importing")}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-8">
          {status === "FAILED" ? (
            // Error state
            <div className="text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                فشل الاستيراد
              </h2>
              <p className="text-gray-600 mb-8">
                {error || "حدث خطأ غير متوقع"}
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  to="/import"
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-coral-500 text-white rounded-xl font-bold hover:shadow-lg transition-shadow"
                >
                  المحاولة مرة أخرى
                </Link>
                <Link
                  to="/dashboard"
                  className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  العودة للوحة التحكم
                </Link>
              </div>
            </div>
          ) : (
            // Loading state
            <div className="text-center">
              {/* Animated loader */}
              <div className="mx-auto w-20 h-20 mb-8 relative">
                <div className="absolute inset-0 rounded-full border-4 border-orange-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader className="w-8 h-8 text-orange-500 animate-pulse" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-3">
                جاري استيراد المنتج...
              </h2>
              <p className="text-gray-600 mb-6">
                يتم الآن استخراج بيانات المنتج من {getPlatform(sourceUrl)}
              </p>

              {/* Source URL */}
              <div className="bg-gray-50 rounded-xl p-4 mb-8 border-2 border-gray-200">
                <p
                  className="text-sm text-gray-500 truncate"
                  dir="ltr"
                >
                  {sourceUrl}
                </p>
              </div>

              {/* Progress indicators */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">تم إنشاء المنتج</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      pollCount > 0 ? "bg-green-500" : "bg-orange-500 animate-pulse"
                    }`}
                  >
                    {pollCount > 0 ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : (
                      <Loader className="w-3 h-3 text-white animate-spin" />
                    )}
                  </span>
                  <span className="text-gray-700">جاري استخراج البيانات...</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-gray-300"></span>
                  <span className="text-gray-400">
                    معالجة البيانات
                  </span>
                </div>
              </div>

              {/* Estimated time */}
              <p className="mt-8 text-xs text-gray-400">
                قد تستغرق العملية من 30 إلى 60 ثانية
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ImportStatus() {
  return (
    <LanguageProvider>
      <ImportStatusContent />
    </LanguageProvider>
  );
}

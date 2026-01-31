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
import { db } from "~/lib/db.server";
import { requireMerchant } from "~/lib/session.server";

interface LoaderData {
  jobId: string;
  sourceUrl: string;
  initialStatus: string;
}

export const meta: MetaFunction = () => {
  return [
    { title: "جاري الاستيراد... - سلة دقيقة" },
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

export default function ImportStatus() {
  const { jobId, sourceUrl, initialStatus } = useLoaderData<LoaderData>();
  const navigate = useNavigate();

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

    // Poll every 2 seconds
    const interval = setInterval(pollStatus, 2000);

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
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            to="/import"
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            &larr; العودة
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            جاري الاستيراد
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-8">
            {status === "FAILED" ? (
              // Error state
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  فشل الاستيراد
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {error || "حدث خطأ غير متوقع"}
                </p>
                <div className="flex gap-3 justify-center">
                  <Link
                    to="/import"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    المحاولة مرة أخرى
                  </Link>
                  <Link
                    to="/dashboard"
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    العودة للوحة التحكم
                  </Link>
                </div>
              </div>
            ) : (
              // Loading state
              <div className="text-center">
                {/* Animated loader */}
                <div className="mx-auto w-16 h-16 mb-6 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-900"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                </div>

                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  جاري استيراد المنتج...
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  يتم الآن استخراج بيانات المنتج من {getPlatform(sourceUrl)}
                </p>

                {/* Source URL */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-6">
                  <p
                    className="text-sm text-gray-500 dark:text-gray-400 truncate"
                    dir="ltr"
                  >
                    {sourceUrl}
                  </p>
                </div>

                {/* Progress indicators */}
                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span>تم إنشاء المنتج</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        pollCount > 0 ? "bg-green-500" : "bg-yellow-500 animate-pulse"
                      }`}
                    ></span>
                    <span>جاري استخراج البيانات...</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                    <span className="text-gray-400 dark:text-gray-500">
                      معالجة البيانات
                    </span>
                  </div>
                </div>

                {/* Estimated time */}
                <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
                  قد تستغرق العملية من 30 إلى 60 ثانية
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

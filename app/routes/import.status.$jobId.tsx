/**
 * Import Status Page
 *
 * Polls the scraping job status and redirects when complete.
 * Shows detailed progress indicator during scraping with animated steps.
 */

import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate, useLoaderData } from "react-router";
import { redirect } from "react-router";
import { ArrowLeft, AlertCircle, Loader2, CheckCircle2, Circle, Sparkles, Package, Link2, Database, Image, Wand2, FileCheck } from "lucide-react";
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

// Step definitions for the import process
const IMPORT_STEPS = [
  { id: 1, labelAr: "إنشاء سجل المنتج", labelEn: "Creating product record", icon: Package, phase: 1 },
  { id: 2, labelAr: "التحقق من الرابط", labelEn: "Verifying URL", icon: Link2, phase: 1 },
  { id: 3, labelAr: "الاتصال بالمصدر", labelEn: "Connecting to source", icon: Database, phase: 2 },
  { id: 4, labelAr: "استخراج عنوان المنتج", labelEn: "Extracting product title", icon: FileCheck, phase: 2 },
  { id: 5, labelAr: "استخراج تفاصيل المنتج", labelEn: "Extracting product details", icon: Database, phase: 2 },
  { id: 6, labelAr: "استخراج الأسعار", labelEn: "Extracting prices", icon: Sparkles, phase: 2 },
  { id: 7, labelAr: "تحميل الصور", labelEn: "Downloading images", icon: Image, phase: 2 },
  { id: 8, labelAr: "معالجة البيانات", labelEn: "Processing data", icon: Wand2, phase: 3 },
  { id: 9, labelAr: "جاهز للتحرير", labelEn: "Ready for editing", icon: CheckCircle2, phase: 3 },
];

function ImportStatusContent() {
  const { jobId, sourceUrl, initialStatus } = useLoaderData<LoaderData>();
  const navigate = useNavigate();
  const { t, isRtl } = useLanguage();

  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const startTimeRef = useRef(Date.now());

  // Simulate step progress based on time (since scraping doesn't give step-by-step status)
  useEffect(() => {
    if (status === "IMPORTED" || status === "ENHANCED") {
      setCurrentStep(IMPORT_STEPS.length);
      return;
    }
    if (status === "FAILED") return;

    // Advance steps based on elapsed time (simulate realistic progress)
    const stepInterval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      // Each step takes ~3-5 seconds to complete visually
      const estimatedStep = Math.min(
        Math.floor(elapsed / 3500) + 2, // Start at step 2 (step 1 is instant)
        IMPORT_STEPS.length - 1 // Don't complete last step until actually done
      );
      setCurrentStep(estimatedStep);
    }, 500);

    return () => clearInterval(stepInterval);
  }, [status]);

  const pollStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/scrape-status/${jobId}`);
      const data: ScrapeStatusResponse = await response.json();

      setStatus(data.status);

      if (data.status === "IMPORTED" || data.status === "ENHANCED") {
        // Success - briefly show completion then redirect
        setCurrentStep(IMPORT_STEPS.length);
        setTimeout(() => {
          navigate(`/products/${data.productId}`);
        }, 1500);
      } else if (data.status === "FAILED") {
        setError(data.error || "حدث خطأ أثناء استيراد المنتج");
      }

      setPollCount((c) => c + 1);
    } catch (err) {
      console.error("Status poll error:", err);
    }
  }, [jobId, navigate]);

  useEffect(() => {
    if (status === "IMPORTED" || status === "ENHANCED" || status === "FAILED") {
      return;
    }

    // Poll every 5 seconds for faster feedback
    const interval = setInterval(pollStatus, 5000);
    pollStatus();

    return () => clearInterval(interval);
  }, [status, pollStatus]);

  const getPlatform = (url: string): string => {
    if (url.includes("aliexpress")) return "AliExpress";
    if (url.includes("amazon")) return "Amazon";
    return "Unknown";
  };

  const getPlatformColor = (url: string): string => {
    if (url.includes("aliexpress")) return "from-orange-500 to-red-500";
    if (url.includes("amazon")) return "from-amber-500 to-orange-500";
    return "from-gray-500 to-gray-600";
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
            // Loading state with detailed progress
            <div>
              {/* Header with animated gradient */}
              <div className="text-center mb-8">
                <div className={`mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br ${getPlatformColor(sourceUrl)} flex items-center justify-center mb-4 shadow-lg`}>
                  <Package className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  جاري استيراد المنتج
                </h2>
                <p className="text-gray-500 text-sm">
                  من {getPlatform(sourceUrl)}
                </p>
              </div>

              {/* Progress bar */}
              <div className="mb-8">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>التقدم</span>
                  <span>{Math.round((currentStep / IMPORT_STEPS.length) * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 via-coral-500 to-pink-500 transition-all duration-500 ease-out"
                    style={{ width: `${(currentStep / IMPORT_STEPS.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Detailed steps checklist */}
              <div className="space-y-1">
                {IMPORT_STEPS.map((step, index) => {
                  const isComplete = currentStep > step.id;
                  const isCurrent = currentStep === step.id;
                  const isPending = currentStep < step.id;
                  const StepIcon = step.icon;

                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-300 ${
                        isCurrent
                          ? "bg-orange-50 border border-orange-200"
                          : isComplete
                          ? "bg-green-50/50"
                          : ""
                      }`}
                    >
                      {/* Step indicator */}
                      <div className="flex-shrink-0">
                        {isComplete ? (
                          <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        ) : isCurrent ? (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-coral-500 flex items-center justify-center shadow-md animate-pulse">
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                            <Circle className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Step icon */}
                      <StepIcon
                        className={`w-4 h-4 flex-shrink-0 ${
                          isComplete
                            ? "text-green-600"
                            : isCurrent
                            ? "text-orange-600"
                            : "text-gray-400"
                        }`}
                      />

                      {/* Step label */}
                      <span
                        className={`flex-1 text-sm font-medium ${
                          isComplete
                            ? "text-green-700"
                            : isCurrent
                            ? "text-orange-700"
                            : "text-gray-400"
                        }`}
                      >
                        {step.labelAr}
                      </span>

                      {/* Status indicator */}
                      {isComplete && (
                        <span className="text-xs text-green-600 font-medium">✓</span>
                      )}
                      {isCurrent && (
                        <span className="text-xs text-orange-600 animate-pulse">جاري...</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Source URL */}
              <div className="mt-6 bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-xs text-gray-400 mb-1">الرابط:</p>
                <p className="text-xs text-gray-600 truncate" dir="ltr">
                  {sourceUrl}
                </p>
              </div>

              {/* Estimated time */}
              <p className="mt-4 text-center text-xs text-gray-400">
                تتم معالجة المنتج تلقائياً، يرجى الانتظار...
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

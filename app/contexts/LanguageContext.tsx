import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Language = "ar" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRtl: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // App
    "app.name": "في دقيقة",
    "app.tagline": "حوّل رابط منتج من Amazon أو AliExpress إلى متجر سلة كامل في دقائق",

    // Navigation
    "nav.features": "المميزات",
    "nav.howItWorks": "كيف يعمل",
    "nav.login": "تسجيل الدخول",
    "nav.logout": "تسجيل الخروج",
    "nav.dashboard": "لوحة التحكم",

    // Landing Page
    "landing.badge": "في دقيقة واحدة",
    "landing.cta": "ابدأ الآن - ثبّت من سلة",
    "landing.subtitle": "استورد، ترجم، وانشر منتجاتك من Amazon و AliExpress إلى متجر سلة الخاص بك مع صفحات هبوط احترافية",
    "landing.productsImported": "منتج مستورد",
    "landing.feature1.title": "استيراد تلقائي",
    "landing.feature1.desc": "الصق رابط المنتج وسيتم استخراج جميع البيانات تلقائياً",
    "landing.feature2.title": "ترجمة فورية",
    "landing.feature2.desc": "ترجمة محتوى المنتج إلى العربية بشكل احترافي",
    "landing.feature3.title": "صفحة هبوط جاهزة",
    "landing.feature3.desc": "اختر ألوان علامتك التجارية واحصل على صفحة جاهزة",
    "landing.feature4.title": "نشر على سلة",
    "landing.feature4.desc": "ادفع المنتج مباشرة إلى متجرك على سلة",
    "landing.how.title": "كيف يعمل؟",
    "landing.how.subtitle": "ثلاث خطوات بسيطة فقط",
    "landing.how.step1": "الصق رابط المنتج",
    "landing.how.step1.desc": "من Amazon أو AliExpress",
    "landing.how.step2": "تخصيص وترجمة",
    "landing.how.step2.desc": "اختر الألوان والمحتوى",
    "landing.how.step3": "انشر على سلة",
    "landing.how.step3.desc": "جاهز للبيع في دقيقة",
    "landing.ready": "جاهز للبيع!",
    "landing.platforms": "المنصات المدعومة:",
    "landing.ctaTitle": "جاهز للبدء؟",
    "landing.ctaSubtitle": "ثبّت في دقيقة من متجر سلة وابدأ في استيراد منتجاتك الأولى اليوم",
    "landing.copyright": "في دقيقة واحدة",

    // Dashboard
    "dashboard.title": "لوحة التحكم",
    "dashboard.subtitle": "إدارة منتجاتك وصفحات الهبوط",
    "dashboard.addProduct": "إضافة منتج",
    "dashboard.myProducts": "منتجاتي",
    "dashboard.noProducts": "لا توجد منتجات بعد",
    "dashboard.noProductsDesc": "ابدأ باستيراد منتجك الأول من Amazon أو AliExpress",
    "dashboard.edit": "تحرير",
    "dashboard.preview": "معاينة",
    "dashboard.publish": "نشر على سلة",
    "dashboard.totalProducts": "إجمالي المنتجات",
    "dashboard.published": "منشورة",
    "dashboard.drafts": "مسودات",
    "dashboard.thisMonth": "هذا الشهر",
    "dashboard.status.importing": "جاري الاستيراد",
    "dashboard.status.imported": "مستورد",
    "dashboard.status.enhanced": "محسّن",
    "dashboard.status.pushing": "جاري النشر",
    "dashboard.status.pushed": "منشور",
    "dashboard.status.failed": "فشل",

    // Import Product
    "import.title": "استيراد منتج",
    "import.back": "العودة",
    "import.pasteLink": "الصق رابط المنتج",
    "import.linkPlaceholder": "https://www.amazon.com/item/... أو https://www.aliexpress.com/item/...",
    "import.language": "لغة المحتوى المُولَّد",
    "import.languageNote": "سيتم إنشاء العنوان والوصف وصفحة الهبوط بهذه اللغة",
    "import.button": "استيراد المنتج",
    "import.importing": "جاري الاستيراد...",
    "import.forceRefresh": "فرض التحديث (تجاهل الذاكرة المؤقتة)",
    "import.supported": "المنصات المدعومة:",
    "import.note": "سيتم استخراج العنوان والأوصاف والصور ومعلومات الأسعار تلقائياً",
    "import.examples": "أمثلة على الروابط المدعومة:",

    // Configure Product
    "config.title": "تحرير المنتج",
    "config.details": "تفاصيل المنتج",
    "config.productImage": "صور المنتج",
    "config.selectImages": "اختر أو أعد ترتيب الصور لاستخدامها في صفحتك",
    "config.branding": "تخصيص صفحة الهبوط",
    "config.colorTheme": "لوحة الألوان",
    "config.regenerateLanding": "إعادة إنشاء",
    "config.previewLanding": "معاينة الصفحة",
    "config.publishToSalla": "نشر على سلة",
    "config.productTitle": "عنوان المنتج",
    "config.price": "السعر",
    "config.description": "الوصف",
    "config.translate": "ترجمة",
    "config.improve": "تحسين بالذكاء الاصطناعي",

    // Product Landing
    "product.buyNow": "اشتر الآن",
    "product.addToCart": "أضف للسلة",
    "product.source": "المصدر",
    "product.price": "السعر",

    // Common
    "common.loading": "جاري التحميل...",
    "common.error": "حدث خطأ",
    "common.retry": "إعادة المحاولة",
  },
  en: {
    // App
    "app.name": "FiDakika",
    "app.tagline": "Turn Amazon or AliExpress links into Salla stores in minutes",

    // Navigation
    "nav.features": "Features",
    "nav.howItWorks": "How It Works",
    "nav.login": "Login",
    "nav.logout": "Logout",
    "nav.dashboard": "Dashboard",

    // Landing Page
    "landing.badge": "In One Minute",
    "landing.cta": "Install Now from Salla",
    "landing.subtitle": "Import, translate, and publish products from Amazon & AliExpress to your Salla store with professional landing pages",
    "landing.productsImported": "Products Imported",
    "landing.feature1.title": "Auto Import",
    "landing.feature1.desc": "Paste product link and all data is extracted automatically",
    "landing.feature2.title": "Instant Translation",
    "landing.feature2.desc": "Professional Arabic translation of product content",
    "landing.feature3.title": "Ready Landing Page",
    "landing.feature3.desc": "Choose your brand colors and get a ready page",
    "landing.feature4.title": "Publish to Salla",
    "landing.feature4.desc": "Push product directly to your Salla store",
    "landing.how.title": "How It Works?",
    "landing.how.subtitle": "Just three simple steps",
    "landing.how.step1": "Paste Product Link",
    "landing.how.step1.desc": "From Amazon or AliExpress",
    "landing.how.step2": "Customize & Translate",
    "landing.how.step2.desc": "Choose colors and content",
    "landing.how.step3": "Publish to Salla",
    "landing.how.step3.desc": "Ready to sell in one minute",
    "landing.ready": "Ready to Sell!",
    "landing.platforms": "Supported Platforms:",
    "landing.ctaTitle": "Ready to Start?",
    "landing.ctaSubtitle": "Install FiDakika from Salla Store and start importing your first products today",
    "landing.copyright": "In One Minute",

    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.subtitle": "Manage your products and landing pages",
    "dashboard.addProduct": "Add Product",
    "dashboard.myProducts": "My Products",
    "dashboard.noProducts": "No products yet",
    "dashboard.noProductsDesc": "Start by importing your first product from Amazon or AliExpress",
    "dashboard.edit": "Edit",
    "dashboard.preview": "Preview",
    "dashboard.publish": "Publish to Salla",
    "dashboard.totalProducts": "Total Products",
    "dashboard.published": "Published",
    "dashboard.drafts": "Drafts",
    "dashboard.thisMonth": "This Month",
    "dashboard.status.importing": "Importing",
    "dashboard.status.imported": "Imported",
    "dashboard.status.enhanced": "Enhanced",
    "dashboard.status.pushing": "Publishing",
    "dashboard.status.pushed": "Published",
    "dashboard.status.failed": "Failed",

    // Import Product
    "import.title": "Import Product",
    "import.back": "Back",
    "import.pasteLink": "Paste Product Link",
    "import.linkPlaceholder": "https://www.amazon.com/item/... or https://www.aliexpress.com/item/...",
    "import.language": "Generated Content Language",
    "import.languageNote": "Title, description, and landing page will be created in this language",
    "import.button": "Import Product",
    "import.importing": "Importing...",
    "import.forceRefresh": "Force refresh (skip cache)",
    "import.supported": "Supported Platforms:",
    "import.note": "Title, descriptions, images, and price information will be extracted automatically",
    "import.examples": "Example Supported Links:",

    // Configure Product
    "config.title": "Edit Product",
    "config.details": "Product Details",
    "config.productImage": "Product Images",
    "config.selectImages": "Select or reorder images to use on your page",
    "config.branding": "Landing Page Customization",
    "config.colorTheme": "Color Theme",
    "config.regenerateLanding": "Regenerate",
    "config.previewLanding": "Preview Page",
    "config.publishToSalla": "Publish to Salla",
    "config.productTitle": "Product Title",
    "config.price": "Price",
    "config.description": "Description",
    "config.translate": "Translate",
    "config.improve": "Improve with AI",

    // Product Landing
    "product.buyNow": "Buy Now",
    "product.addToCart": "Add to Cart",
    "product.source": "Source",
    "product.price": "Price",

    // Common
    "common.loading": "Loading...",
    "common.error": "An error occurred",
    "common.retry": "Retry",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ar");

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("fidakika-lang", lang);
    }
  };

  useEffect(() => {
    // Load saved language preference
    const saved = localStorage.getItem("fidakika-lang") as Language | null;
    if (saved && (saved === "ar" || saved === "en")) {
      setLanguageState(saved);
    }
  }, []);

  useEffect(() => {
    // Update document direction and lang
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const isRtl = language === "ar";

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

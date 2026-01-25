/**
 * Landing Page Preview
 * Mobile frame wrapper that displays the landing page in a phone-style preview
 */

import type { LandingPageContent } from "~/services/ai/types";
import { HeroSection } from "./HeroSection";
import { FeatureSection } from "./FeatureSection";
import { CTASection } from "./CTASection";
import { SocialProofSection } from "./SocialProofSection";
import { BenefitsGrid } from "./BenefitsGrid";
import { ComparisonTable } from "./ComparisonTable";
import { FAQSection } from "./FAQSection";

interface LandingPagePreviewProps {
  content: LandingPageContent | null;
  productImages: string[];
  price: number | string;
  currency: string;
}

export function LandingPagePreview({
  content,
  productImages,
  price,
  currency,
}: LandingPagePreviewProps) {
  const isRTL = content?.lang === "ar";

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="text-6xl mb-4">📱</div>
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
          {isRTL ? "معاينة صفحة الهبوط" : "Landing Page Preview"}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isRTL
            ? 'انقر على "إنشاء صفحة هبوط" لتوليد المحتوى'
            : 'Click "Generate Landing Page" to create content'}
        </p>
      </div>
    );
  }

  return (
    <div
      className="h-full overflow-y-auto bg-white"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Hero */}
      <HeroSection
        hero={content.hero}
        images={productImages}
        price={price}
        currency={currency}
        isRTL={isRTL}
      />

      {/* Features */}
      <FeatureSection features={content.features} isRTL={isRTL} />

      {/* CTA Banner */}
      <CTASection cta={content.cta} isRTL={isRTL} />

      {/* Social Proof */}
      <SocialProofSection socialProof={content.socialProof} isRTL={isRTL} />

      {/* Benefits Grid */}
      <BenefitsGrid benefits={content.benefits} isRTL={isRTL} />

      {/* Comparison */}
      <ComparisonTable comparison={content.comparison} isRTL={isRTL} />

      {/* FAQ */}
      <FAQSection faq={content.faq} isRTL={isRTL} />

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-center">
        <p className="text-white font-medium mb-3">{content.cta.headline}</p>
        <button className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold shadow-lg">
          {content.cta.buttonText}
        </button>
      </div>
    </div>
  );
}

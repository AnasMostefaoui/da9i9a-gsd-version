/**
 * Landing Page Preview
 * Mobile frame wrapper that displays the landing page in a phone-style preview
 */

import type { LandingPageContent } from "~/services/ai/types";
import type { ColorPalette } from "~/lib/color-palettes";
import { getPalette } from "~/lib/color-palettes";
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
  palette?: ColorPalette;
}

export function LandingPagePreview({
  content,
  productImages,
  price,
  currency,
  palette = getPalette("orange"),
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
        palette={palette}
      />

      {/* Features */}
      <FeatureSection features={content.features} isRTL={isRTL} palette={palette} />

      {/* CTA Banner */}
      <CTASection cta={content.cta} isRTL={isRTL} palette={palette} />

      {/* Social Proof */}
      <SocialProofSection socialProof={content.socialProof} isRTL={isRTL} palette={palette} />

      {/* Benefits Grid */}
      <BenefitsGrid benefits={content.benefits} isRTL={isRTL} palette={palette} />

      {/* Comparison */}
      <ComparisonTable comparison={content.comparison} isRTL={isRTL} palette={palette} />

      {/* FAQ */}
      <FAQSection faq={content.faq} isRTL={isRTL} palette={palette} />

      {/* Footer CTA */}
      <div
        className="p-6 text-center"
        style={{ background: `linear-gradient(135deg, ${palette.ctaBgFrom} 0%, ${palette.ctaBgTo} 100%)` }}
      >
        <p className="font-medium mb-3" style={{ color: palette.textOnPrimary }}>
          {content.cta.headline}
        </p>
        <button
          className="px-8 py-3 rounded-full font-bold shadow-lg"
          style={{ backgroundColor: "white", color: palette.primary }}
        >
          {content.cta.buttonText}
        </button>
      </div>
    </div>
  );
}

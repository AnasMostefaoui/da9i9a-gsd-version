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

export interface LandingPageVisibility {
  hero: boolean;
  features: boolean;
  cta: boolean;
  socialProof: boolean;
  benefits: boolean;
  comparison: boolean;
  faq: boolean;
}

interface LandingPagePreviewProps {
  content: LandingPageContent | null;
  productImages: string[];
  price: number | string;
  currency: string;
  palette?: ColorPalette;
  visibility?: LandingPageVisibility;
}

const DEFAULT_VISIBILITY: LandingPageVisibility = {
  hero: true,
  features: true,
  cta: true,
  socialProof: true,
  benefits: true,
  comparison: true,
  faq: true,
};

export function LandingPagePreview({
  content,
  productImages,
  price,
  currency,
  palette = getPalette("orange"),
  visibility,
}: LandingPagePreviewProps) {
  const isRTL = content?.lang === "ar";

  // Get visibility from content._visibility or use provided/default
  const contentVisibility = (content as LandingPageContent & { _visibility?: LandingPageVisibility })?._visibility;
  const vis = visibility || contentVisibility || DEFAULT_VISIBILITY;

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
      {vis.hero && (
        <HeroSection
          hero={content.hero}
          images={productImages}
          price={price}
          currency={currency}
          isRTL={isRTL}
          palette={palette}
        />
      )}

      {/* Features */}
      {vis.features && (
        <FeatureSection features={content.features} isRTL={isRTL} palette={palette} />
      )}

      {/* CTA Banner */}
      {vis.cta && (
        <CTASection cta={content.cta} isRTL={isRTL} palette={palette} />
      )}

      {/* Social Proof */}
      {vis.socialProof && (
        <SocialProofSection socialProof={content.socialProof} isRTL={isRTL} palette={palette} />
      )}

      {/* Benefits Grid */}
      {vis.benefits && (
        <BenefitsGrid benefits={content.benefits} isRTL={isRTL} palette={palette} />
      )}

      {/* Comparison */}
      {vis.comparison && (
        <ComparisonTable comparison={content.comparison} isRTL={isRTL} palette={palette} />
      )}

      {/* FAQ */}
      {vis.faq && (
        <FAQSection faq={content.faq} isRTL={isRTL} palette={palette} />
      )}

      {/* Footer CTA - always show if CTA is visible */}
      {vis.cta && (
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
      )}
    </div>
  );
}

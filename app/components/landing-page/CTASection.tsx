/**
 * CTA Section
 * Call-to-action banner with urgency messaging
 */

import type { ColorPalette } from "~/lib/color-palettes";

interface CTASectionProps {
  cta: {
    headline: string;
    description: string;
    buttonText: string;
  };
  isRTL: boolean;
  palette: ColorPalette;
}

export function CTASection({ cta, isRTL, palette }: CTASectionProps) {
  return (
    <div
      className="mx-4 my-6 rounded-2xl p-6 text-center shadow-lg"
      style={{ background: `linear-gradient(135deg, ${palette.ctaBgFrom} 0%, ${palette.ctaBgTo} 100%)` }}
    >
      <h3 className="text-xl font-bold mb-2" style={{ color: palette.textOnPrimary }}>
        {cta.headline}
      </h3>
      <p className="mb-4" style={{ color: `${palette.textOnPrimary}dd` }}>
        {cta.description}
      </p>
      <button
        className="px-8 py-3 rounded-full font-bold shadow-md hover:shadow-lg transition-shadow"
        style={{ backgroundColor: "white", color: palette.primary }}
      >
        {cta.buttonText}
      </button>
    </div>
  );
}

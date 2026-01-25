/**
 * Social Proof Section
 * Stats grid showing customer satisfaction metrics
 */

import type { ColorPalette } from "~/lib/color-palettes";

interface SocialProofSectionProps {
  socialProof: {
    title: string;
    stats: Array<{
      value: string;
      label: string;
    }>;
  };
  isRTL: boolean;
  palette: ColorPalette;
}

export function SocialProofSection({ socialProof, isRTL, palette }: SocialProofSectionProps) {
  return (
    <div className="px-4 py-6 bg-gray-50">
      <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
        {socialProof.title}
      </h2>

      <div className="grid grid-cols-3 gap-3">
        {socialProof.stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-4 text-center shadow-sm"
          >
            <div className="text-2xl font-bold mb-1" style={{ color: palette.statsColor }}>
              {stat.value}
            </div>
            <div className="text-xs text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

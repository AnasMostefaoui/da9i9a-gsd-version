/**
 * Feature Section
 * Main selling points with icons and descriptions
 */

import type { ColorPalette } from "~/lib/color-palettes";

interface FeatureSectionProps {
  features: {
    title: string;
    description: string;
    highlights: Array<{
      icon: "mic" | "headphones" | "shield" | "zap" | "star" | "check";
      title: string;
      description: string;
    }>;
  };
  isRTL: boolean;
  palette: ColorPalette;
}

const iconMap: Record<string, string> = {
  mic: "🎤",
  headphones: "🎧",
  shield: "🛡️",
  zap: "⚡",
  star: "⭐",
  check: "✅",
};

export function FeatureSection({ features, isRTL, palette }: FeatureSectionProps) {
  return (
    <div className="px-4 py-6 bg-white">
      <h2 className="text-xl font-bold text-gray-900 mb-2">{features.title}</h2>
      <p className="text-gray-600 mb-6">{features.description}</p>

      <div className="space-y-4">
        {features.highlights.map((highlight, i) => (
          <div
            key={i}
            className="flex gap-4 p-4 bg-gray-50 rounded-xl"
          >
            <div
              className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: palette.primaryLight }}
            >
              {iconMap[highlight.icon] || "✨"}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {highlight.title}
              </h3>
              <p className="text-sm text-gray-600">{highlight.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Comparison Table
 * "Us vs Others" feature checklist
 */

import type { ColorPalette } from "~/lib/color-palettes";

interface ComparisonTableProps {
  comparison: {
    title: string;
    description: string;
    features: Array<{
      name: string;
      us: boolean;
      others: boolean;
    }>;
  };
  isRTL: boolean;
  palette: ColorPalette;
}

export function ComparisonTable({ comparison, isRTL, palette }: ComparisonTableProps) {
  const usLabel = isRTL ? "نحن" : "Us";
  const othersLabel = isRTL ? "الآخرين" : "Others";

  return (
    <div className="px-4 py-6 bg-gray-50">
      <h2 className="text-xl font-bold text-gray-900 mb-2">{comparison.title}</h2>
      <p className="text-gray-600 mb-4">{comparison.description}</p>

      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="grid grid-cols-[1fr_60px_60px] bg-gray-100 text-center text-sm font-medium text-gray-700 py-3 px-4">
          <div className={isRTL ? "text-right" : "text-left"}>{isRTL ? "الميزة" : "Feature"}</div>
          <div>{usLabel}</div>
          <div>{othersLabel}</div>
        </div>

        {/* Rows */}
        {comparison.features.map((feature, i) => (
          <div
            key={i}
            className={`grid grid-cols-[1fr_60px_60px] text-center py-3 px-4 ${
              i < comparison.features.length - 1 ? "border-b border-gray-100" : ""
            }`}
          >
            <div className={`text-sm text-gray-700 ${isRTL ? "text-right" : "text-left"}`}>
              {feature.name}
            </div>
            <div>
              {feature.us ? (
                <span className="text-green-500 text-lg">✓</span>
              ) : (
                <span className="text-gray-300 text-lg">✕</span>
              )}
            </div>
            <div>
              {feature.others ? (
                <span className="text-green-500 text-lg">✓</span>
              ) : (
                <span className="text-gray-300 text-lg">✕</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

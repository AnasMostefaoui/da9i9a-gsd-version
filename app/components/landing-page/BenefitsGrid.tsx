/**
 * Benefits Grid
 * 4-icon grid showing shipping, support, quality, and returns
 */

interface BenefitsGridProps {
  benefits: Array<{
    icon: "truck" | "headset" | "award" | "refresh";
    title: string;
    description: string;
  }>;
  isRTL: boolean;
}

const iconMap: Record<string, string> = {
  truck: "🚚",
  headset: "🎧",
  award: "🏆",
  refresh: "🔄",
};

export function BenefitsGrid({ benefits, isRTL }: BenefitsGridProps) {
  return (
    <div className="px-4 py-6 bg-white">
      <div className="grid grid-cols-2 gap-4">
        {benefits.map((benefit, i) => (
          <div
            key={i}
            className="bg-gray-50 rounded-xl p-4 text-center"
          >
            <div className="text-3xl mb-2">{iconMap[benefit.icon] || "✨"}</div>
            <h3 className="font-semibold text-gray-900 text-sm mb-1">
              {benefit.title}
            </h3>
            <p className="text-xs text-gray-600">{benefit.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

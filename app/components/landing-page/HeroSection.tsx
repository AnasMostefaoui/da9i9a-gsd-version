/**
 * Hero Section
 * Above-the-fold content with product images, price, badges, and trust signals
 */

import type { ColorPalette } from "~/lib/color-palettes";

interface HeroSectionProps {
  hero: {
    headline: string;
    subheadline: string;
    badges: string[];
    trustSignals: string[];
  };
  images: string[];
  price: number | string;
  currency: string;
  isRTL: boolean;
  palette: ColorPalette;
}

export function HeroSection({ hero, images, price, currency, isRTL, palette }: HeroSectionProps) {
  const formattedPrice = typeof price === "string" ? parseFloat(price) : price;

  return (
    <div
      className="pb-6"
      style={{ background: `linear-gradient(to bottom, ${palette.heroBgFrom} 0%, ${palette.heroBgTo} 100%)` }}
    >
      {/* Product Image Carousel */}
      <div className="relative aspect-square bg-white">
        {images.length > 0 ? (
          <img
            src={images[0]}
            alt="Product"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-4xl">📦</span>
          </div>
        )}
        {/* Image indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.slice(0, 5).map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: i === 0 ? palette.primary : "#d1d5db" }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pt-4">
        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          {hero.badges.map((badge, i) => (
            <span
              key={i}
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ backgroundColor: palette.primaryLight, color: palette.accent }}
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Headline */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {hero.headline}
        </h1>
        <p className="text-gray-600 mb-4">{hero.subheadline}</p>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-3xl font-bold" style={{ color: palette.primary }}>
            {formattedPrice.toFixed(2)}
          </span>
          <span className="text-lg text-gray-500">{currency}</span>
        </div>

        {/* Trust Signals */}
        <div className="flex flex-wrap gap-3">
          {hero.trustSignals.map((signal, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 text-sm text-gray-600"
            >
              <span className="text-green-500">✓</span>
              {signal}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

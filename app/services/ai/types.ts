/**
 * AI Provider Interface
 * Marketing-focused content generation from product signals
 */

export interface ProductSignals {
  // Core product data
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];

  // Rich signals for marketing context
  brand?: string;
  category?: string;
  specifications?: Record<string, string>;
  reviewSummary?: {
    rating: number;
    count: number;
  };
  seller?: {
    name: string;
    rating?: number;
  };

  // Source context
  platform: "aliexpress" | "amazon";
  sourceUrl: string;
}

export interface EnhancedContent {
  // Marketing-focused title (benefit-driven, not feature-listing)
  title: string;

  // Compelling description with:
  // - Hook/headline that addresses a pain point
  // - Key benefits (not features)
  // - Social proof angle if reviews available
  // - Call to action
  description: string;

  // SEO-friendly bullet points (optional, for future use)
  highlights?: string[];

  // Generation metadata
  generatedAt: Date;
  provider: string;
}

export interface AIProvider {
  name: string;
  enhanceProduct(signals: ProductSignals): Promise<EnhancedContent>;
}

/**
 * Image Enhancement Provider Interface
 * (For future implementation with Claid.ai, Nano Banana, etc.)
 */

export interface ImageEnhancementRequest {
  imageUrl: string;
  enhancements?: {
    upscale?: boolean;
    removeBackground?: boolean;
    improveQuality?: boolean;
  };
}

export interface ImageEnhancementResponse {
  enhancedUrl: string;
  originalUrl: string;
}

export interface ImageEnhancementProvider {
  name: string;
  enhanceImage(request: ImageEnhancementRequest): Promise<ImageEnhancementResponse>;
}

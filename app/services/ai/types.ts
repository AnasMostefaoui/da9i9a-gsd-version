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

/**
 * Landing Page Content
 * AI-generated content that fills a fixed React template
 * Supports Arabic (RTL) and English
 */

export interface LandingPageContent {
  // Hero section - above the fold
  hero: {
    headline: string;          // Main benefit (e.g., "صوت احترافي لمحتواك")
    subheadline: string;       // Supporting claim
    badges: string[];          // Trust badges (e.g., ["شحن مجاني", "ضمان سنة"])
    trustSignals: string[];    // Social proof (e.g., ["5000+ عميل راضي"])
  };

  // Features section - main selling points
  features: {
    title: string;             // Section heading
    description: string;       // Brief intro paragraph
    highlights: Array<{
      icon: "mic" | "headphones" | "shield" | "zap" | "star" | "check";
      title: string;
      description: string;
    }>;
  };

  // Call-to-action banner
  cta: {
    headline: string;          // Urgency message
    description: string;       // Value proposition
    buttonText: string;        // Action text (e.g., "اطلب الآن")
  };

  // Social proof with stats
  socialProof: {
    title: string;
    stats: Array<{
      value: string;           // e.g., "92%"
      label: string;           // e.g., "رضا العملاء"
    }>;
  };

  // Benefits grid (4 items)
  benefits: Array<{
    icon: "truck" | "headset" | "award" | "refresh";
    title: string;
    description: string;
  }>;

  // Comparison section (us vs others)
  comparison: {
    title: string;
    description: string;
    features: Array<{
      name: string;
      us: boolean;             // We have this feature
      others: boolean;         // Competitors have this
    }>;
  };

  // FAQ section
  faq: Array<{
    question: string;
    answer: string;
  }>;

  // Metadata
  generatedAt: string;         // ISO date string
  lang: "ar" | "en";
}

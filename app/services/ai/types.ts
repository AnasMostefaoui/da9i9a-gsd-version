/**
 * AI Provider Interface
 * Allows swapping between Gemini, OpenAI, etc.
 */

export interface TextEnhancementRequest {
  title: string;
  description: string;
  images?: string[]; // URLs for vision-based enhancement
  targetLanguages: ("ar" | "en")[];
}

export interface TextEnhancementResponse {
  title: {
    ar: string;
    en: string;
  };
  description: {
    ar: string;
    en: string;
  };
}

export interface AIProvider {
  name: string;
  enhanceProductText(request: TextEnhancementRequest): Promise<TextEnhancementResponse>;
}

/**
 * Image Enhancement Provider Interface
 * Allows swapping between Claid.ai, Nano Banana, etc.
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

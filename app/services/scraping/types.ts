/**
 * Scraper Provider Interface
 * Allows swapping between ScraperAPI, Scrapingdog, Oxylabs, etc.
 */

export type Platform = "aliexpress" | "amazon";

export interface ScrapedProduct {
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  variants?: ProductVariant[];
  reviewSummary?: ReviewSummary;
  sourceUrl: string;
  platform: Platform;
}

export interface ProductVariant {
  name: string;
  options: string[];
}

export interface ReviewSummary {
  rating: number;
  count: number;
}

export interface ScraperProvider {
  name: string;
  supportedPlatforms: Platform[];
  scrapeProduct(url: string): Promise<ScrapedProduct>;
}

/**
 * URL validation patterns for supported platforms
 */
export const URL_PATTERNS: Record<Platform, RegExp> = {
  aliexpress: /^https?:\/\/(www\.)?aliexpress\.(com|us)\/item\/(\d+)\.html/i,
  amazon: /^https?:\/\/(www\.)?amazon\.(com|sa|ae|eg)\/.*\/dp\/([A-Z0-9]+)/i,
};

export function detectPlatform(url: string): Platform | null {
  for (const [platform, pattern] of Object.entries(URL_PATTERNS)) {
    if (pattern.test(url)) {
      return platform as Platform;
    }
  }
  return null;
}

export function extractProductId(url: string, platform: Platform): string | null {
  const match = url.match(URL_PATTERNS[platform]);
  if (!match) return null;
  // The product ID is typically in capture group 3
  return match[3] || null;
}

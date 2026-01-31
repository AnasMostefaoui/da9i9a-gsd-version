/**
 * Scraper Provider Interface
 * Supports Apify, Oxylabs with configurable fallback chains
 */

export type Platform = "aliexpress" | "amazon";

/**
 * Cost metadata tracked for each scrape operation
 */
export interface ScrapeCostMetadata {
  provider: string;
  platform: string;
  estimatedCostUsd: number;
  scrapedAt: string; // ISO timestamp
  duration: number; // milliseconds
}

export interface ScrapedProduct {
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  sourceUrl: string;
  platform: Platform;

  // Optional enriched data from providers
  brand?: string;
  sku?: string;
  variants?: ProductVariant[];
  specifications?: Record<string, string>;
  reviewSummary?: ReviewSummary;
  seller?: SellerInfo;
  shipping?: ShippingInfo;

  // Metadata about the scrape
  scrapedAt: Date;
  provider: string;

  // Cost tracking metadata (attached by orchestrator)
  costMetadata?: ScrapeCostMetadata;
}

export interface ProductVariant {
  name: string;
  options: VariantOption[];
}

export interface VariantOption {
  label: string;
  value: string;
  priceModifier?: number;
  image?: string;
}

export interface ReviewSummary {
  rating: number;
  count: number;
  distribution?: Record<number, number>; // 5: 100, 4: 50, etc.
}

export interface SellerInfo {
  name: string;
  rating?: number;
  url?: string;
}

export interface ShippingInfo {
  cost?: number;
  currency?: string;
  estimatedDays?: string;
  freeShipping?: boolean;
}

/**
 * Provider interface - each scraping service implements this
 */
export interface ScraperProvider {
  name: string;
  supportedPlatforms: Platform[];
  /**
   * @param url Product URL to scrape
   * @param forceRefresh Skip cache and fetch fresh data (optional)
   */
  scrapeProduct(url: string, forceRefresh?: boolean): Promise<ScrapedProduct>;
}

/**
 * Result of a scraping attempt with provider info
 */
export interface ScrapeResult {
  success: boolean;
  product?: ScrapedProduct;
  error?: string;
  provider: string;
  duration: number;
}

/**
 * Configuration for provider fallback chains
 */
export interface ScrapingConfig {
  // Provider priority per platform (first = primary, rest = fallbacks)
  providerChains: Record<Platform, string[]>;

  // Retry settings
  maxRetries: number;
  retryDelayMs: number;

  // Timeout per request
  timeoutMs: number;
}

/**
 * Default scraping configuration
 * - AliExpress: Apify (primary) → Oxylabs (fallback)
 * - Amazon: Oxylabs (primary) → Apify (fallback)
 */
export const DEFAULT_SCRAPING_CONFIG: ScrapingConfig = {
  providerChains: {
    aliexpress: ["apify", "oxylabs"],
    amazon: ["oxylabs", "apify"],
  },
  maxRetries: 2,
  retryDelayMs: 1000,
  timeoutMs: 60000,
};

/**
 * URL validation patterns for supported platforms
 */
export const URL_PATTERNS: Record<Platform, RegExp> = {
  aliexpress: /^https?:\/\/(www\.)?([\w-]+\.)?aliexpress\.(com|us|ru)\/item\/(\d+)\.html/i,
  amazon: /^https?:\/\/(www\.)?amazon\.(com|sa|ae|eg|co\.uk|de|fr|es|it|ca|com\.mx|com\.br|in|co\.jp|com\.au)\/.*\/(dp|gp\/product)\/([A-Z0-9]{10})/i,
};

export function detectPlatform(url: string): Platform | null {
  // Normalize URL
  const normalizedUrl = url.trim();

  for (const [platform, pattern] of Object.entries(URL_PATTERNS)) {
    if (pattern.test(normalizedUrl)) {
      return platform as Platform;
    }
  }

  // Fallback: check by hostname
  try {
    const hostname = new URL(normalizedUrl).hostname.toLowerCase();
    if (hostname.includes("aliexpress")) return "aliexpress";
    if (hostname.includes("amazon")) return "amazon";
  } catch {
    // Invalid URL
  }

  return null;
}

export function extractProductId(url: string, platform: Platform): string | null {
  const match = url.match(URL_PATTERNS[platform]);
  if (!match) return null;

  // AliExpress: capture group 4 (after the optional subdomain groups)
  // Amazon: capture group 3 (the ASIN)
  if (platform === "aliexpress") {
    return match[4] || null;
  }
  return match[3] || null;
}

/**
 * Normalize URL to canonical form
 */
export function normalizeProductUrl(url: string, platform: Platform): string {
  const productId = extractProductId(url, platform);
  if (!productId) return url;

  if (platform === "aliexpress") {
    return `https://www.aliexpress.com/item/${productId}.html`;
  }

  if (platform === "amazon") {
    // Extract domain from original URL
    const domainMatch = url.match(/amazon\.([\w.]+)/i);
    const domain = domainMatch ? domainMatch[1] : "com";
    return `https://www.amazon.${domain}/dp/${productId}`;
  }

  return url;
}

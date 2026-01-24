/**
 * Apify E-commerce Scraping Tool Provider
 * Uses the official Apify actor: apify/e-commerce-scraping-tool
 * https://apify.com/apify/e-commerce-scraping-tool
 */

import { ApifyClient } from "apify-client";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

// Cache configuration
const CACHE_DIR = ".cache/apify";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes default
import type {
  ScraperProvider,
  ScrapedProduct,
  Platform,
  ReviewSummary,
  SellerInfo,
} from "./types";
import { detectPlatform } from "./types";

/**
 * Apify Actor IDs - configurable per platform
 *
 * Defaults:
 *   - AliExpress: apify/e-commerce-scraping-tool
 *   - Amazon: apify/e-commerce-scraping-tool
 *
 * Override via env:
 *   - APIFY_ACTOR_ALIEXPRESS=actor/id
 *   - APIFY_ACTOR_AMAZON=actor/id
 *   - APIFY_ACTOR_DEFAULT=actor/id (fallback for all)
 */
const DEFAULT_ACTOR = "apify/e-commerce-scraping-tool";

const ACTOR_IDS: Record<string, string> = {
  aliexpress: process.env.APIFY_ACTOR_ALIEXPRESS || process.env.APIFY_ACTOR_DEFAULT || DEFAULT_ACTOR,
  amazon: process.env.APIFY_ACTOR_AMAZON || process.env.APIFY_ACTOR_DEFAULT || DEFAULT_ACTOR,
};

/**
 * Response structure from Apify E-commerce Scraping Tool
 * Based on actual API response
 */
interface ApifyProductResult {
  url?: string;
  title?: string;
  name?: string;
  description?: string | null;
  price?: number | string;
  currency?: string;
  // Brand can be string or object { slogan: string }
  brand?: string | { slogan?: string; name?: string };
  images?: string[];
  image?: string;
  mainImage?: string;
  rating?: number;
  reviewsCount?: number;
  reviewCount?: number;
  seller?: string;
  sellerName?: string;
  sku?: string;
  productId?: string;
  availability?: string;
  specifications?: Record<string, string>;
  features?: string[];
  variants?: Array<{
    name?: string;
    options?: string[];
  }>;
  // Offers contain price info
  offers?: {
    price?: number | string;
    priceCurrency?: string;
  };
  // Additional properties from Apify (the rich data)
  additionalProperties?: {
    asin?: string;
    features?: string[];
    highResolutionImages?: string[];
    galleryThumbnails?: string[];
    seller?: {
      name?: string;
      id?: string;
      url?: string;
    };
    starsBreakdown?: Record<string, number>;
    reviewsCount?: number;
    attributes?: Array<{ key: string; value: string }>;
    productOverview?: Array<{ key: string; value: string }>;
  };
}

export class ApifyProvider implements ScraperProvider {
  name = "apify";
  supportedPlatforms: Platform[] = ["aliexpress", "amazon"];

  private client: ApifyClient;
  private timeoutMs: number;
  private cacheTtlMs: number;

  constructor(apiToken: string, timeoutMs: number = 120000, cacheTtlMs: number = CACHE_TTL_MS) {
    this.client = new ApifyClient({ token: apiToken });
    this.timeoutMs = timeoutMs;
    this.cacheTtlMs = cacheTtlMs;
  }

  /**
   * Scrape product with caching support
   * @param url Product URL to scrape
   * @param forceRefresh Skip cache and fetch fresh data
   */
  async scrapeProduct(url: string, forceRefresh: boolean = false): Promise<ScrapedProduct> {
    const platform = detectPlatform(url);
    if (!platform) {
      throw new Error(`Unsupported URL: ${url}`);
    }

    const actorId = ACTOR_IDS[platform] || DEFAULT_ACTOR;
    const cacheKey = this.getCacheKey(url);

    // Try cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log(`[Apify] Using cached response (${this.getCacheAge(cacheKey)}s old)`);
        return this.mapToScrapedProduct(cached, url, platform);
      }
    }

    console.log(`[Apify] Scraping ${platform} product using actor: ${actorId}`);
    console.log(`[Apify] URL: ${url}`);

    try {
      // Run the configured actor for this platform
      // call() waits for completion by default
      const run = await this.client.actor(actorId).call({
        // Input for product detail URLs (per OpenAPI schema)
        detailsUrls: [{ url }],
        // Limit to single product
        maxProductResults: 1,
        // Include all available data
        additionalProperties: true,
      });

      // Fetch results from the default dataset
      const { items } = await this.client
        .dataset(run.defaultDatasetId)
        .listItems();

      if (!items || items.length === 0) {
        throw new Error("No product data returned from Apify");
      }

      const result = items[0] as ApifyProductResult;

      // Save to cache
      this.saveToCache(cacheKey, result);
      console.log(`[Apify] Response cached at ${cacheKey}`);

      return this.mapToScrapedProduct(result, url, platform);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Apify] Scraping failed: ${message}`);
      throw new Error(`Apify scraping failed: ${message}`);
    }
  }

  // ─── Cache Methods ─────────────────────────────────────────────────────────

  private getCacheKey(url: string): string {
    const hash = crypto.createHash("md5").update(url).digest("hex").slice(0, 12);
    return `${hash}.json`;
  }

  private getCachePath(key: string): string {
    return path.join(process.cwd(), CACHE_DIR, key);
  }

  private ensureCacheDir(): void {
    const dir = path.join(process.cwd(), CACHE_DIR);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private getFromCache(key: string): ApifyProductResult | null {
    const cachePath = this.getCachePath(key);

    if (!fs.existsSync(cachePath)) {
      return null;
    }

    const stat = fs.statSync(cachePath);
    const ageMs = Date.now() - stat.mtimeMs;

    // Check if cache is expired
    if (ageMs > this.cacheTtlMs) {
      console.log(`[Apify] Cache expired (${Math.round(ageMs / 1000)}s old)`);
      return null;
    }

    try {
      const content = fs.readFileSync(cachePath, "utf-8");
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private saveToCache(key: string, data: ApifyProductResult): void {
    this.ensureCacheDir();
    const cachePath = this.getCachePath(key);
    fs.writeFileSync(cachePath, JSON.stringify(data, null, 2));
  }

  private getCacheAge(key: string): number {
    const cachePath = this.getCachePath(key);
    if (!fs.existsSync(cachePath)) return 0;
    const stat = fs.statSync(cachePath);
    return Math.round((Date.now() - stat.mtimeMs) / 1000);
  }

  private mapToScrapedProduct(
    data: ApifyProductResult,
    sourceUrl: string,
    platform: Platform
  ): ScrapedProduct {
    // Extract title
    const title = data.title || data.name || "";
    if (!title) {
      throw new Error("No title found in scraped data");
    }

    // Extract description
    const description = this.extractDescription(data);

    // Extract price
    const price = this.extractPrice(data);

    // Extract currency (prefer offers.priceCurrency)
    const currency = data.offers?.priceCurrency || data.currency || "USD";

    // Extract images
    const images = this.extractImages(data);
    if (images.length === 0) {
      throw new Error("No images found in scraped data");
    }

    // Build review summary if available
    let reviewSummary: ReviewSummary | undefined;
    const reviewCount = data.reviewsCount || data.reviewCount;
    if (data.rating && reviewCount) {
      reviewSummary = {
        rating: data.rating,
        count: reviewCount,
      };
    }

    // Build seller info if available
    let seller: SellerInfo | undefined;
    if (data.additionalProperties?.seller?.name) {
      seller = { name: data.additionalProperties.seller.name };
    } else {
      const sellerName = data.seller || data.sellerName;
      if (sellerName) {
        seller = { name: sellerName };
      }
    }

    // Extract brand (can be string or object)
    let brand: string | undefined;
    if (typeof data.brand === "string") {
      brand = data.brand;
    } else if (data.brand && typeof data.brand === "object") {
      brand = data.brand.name || data.brand.slogan;
    }

    return {
      title,
      description,
      price,
      currency,
      images,
      sourceUrl,
      platform,
      brand,
      sku: data.sku || data.productId || data.additionalProperties?.asin,
      specifications: data.specifications,
      reviewSummary,
      seller,
      scrapedAt: new Date(),
      provider: this.name,
    };
  }

  private extractDescription(data: ApifyProductResult): string {
    // Try description field first
    if (data.description && data.description.trim()) {
      return data.description.trim();
    }

    // Try additionalProperties.features (where Amazon puts bullet points)
    if (data.additionalProperties?.features && data.additionalProperties.features.length > 0) {
      return data.additionalProperties.features.join("\n\n");
    }

    // Try top-level features as fallback
    if (data.features && data.features.length > 0) {
      return data.features.join("\n");
    }

    return "";
  }

  private extractPrice(data: ApifyProductResult): number {
    // Try direct price field
    if (typeof data.price === "number" && data.price > 0) {
      return data.price;
    }

    if (typeof data.price === "string") {
      const cleaned = data.price.replace(/[^0-9.,]/g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }

    // Try offers.price as fallback
    if (data.offers?.price) {
      if (typeof data.offers.price === "number") {
        return data.offers.price;
      }
      if (typeof data.offers.price === "string") {
        const cleaned = data.offers.price.replace(/[^0-9.,]/g, "").replace(",", ".");
        const parsed = parseFloat(cleaned);
        if (!isNaN(parsed)) {
          return parsed;
        }
      }
    }

    return 0;
  }

  private extractImages(data: ApifyProductResult): string[] {
    const images: string[] = [];

    // Prefer high resolution images from additionalProperties
    if (data.additionalProperties?.highResolutionImages && data.additionalProperties.highResolutionImages.length > 0) {
      images.push(
        ...data.additionalProperties.highResolutionImages.filter(
          (img) => typeof img === "string" && img.startsWith("http")
        )
      );
    }

    // Add images array if no high-res found
    if (images.length === 0 && data.images && Array.isArray(data.images)) {
      images.push(
        ...data.images.filter((img) => typeof img === "string" && img.startsWith("http"))
      );
    }

    // Add single image fields as fallback
    if (data.image && typeof data.image === "string" && data.image.startsWith("http")) {
      if (!images.includes(data.image)) {
        images.unshift(data.image);
      }
    }

    if (data.mainImage && typeof data.mainImage === "string" && data.mainImage.startsWith("http")) {
      if (!images.includes(data.mainImage)) {
        images.unshift(data.mainImage);
      }
    }

    // Deduplicate and limit
    return [...new Set(images)].slice(0, 15);
  }
}

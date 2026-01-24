/**
 * Apify E-commerce Scraping Tool Provider
 * Uses the official Apify actor: apify/e-commerce-scraping-tool
 * https://apify.com/apify/e-commerce-scraping-tool
 */

import { ApifyClient } from "apify-client";
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
 * Based on their documented output schema
 */
interface ApifyProductResult {
  url?: string;
  title?: string;
  name?: string;
  description?: string;
  price?: number | string;
  currency?: string;
  brand?: string;
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
}

export class ApifyProvider implements ScraperProvider {
  name = "apify";
  supportedPlatforms: Platform[] = ["aliexpress", "amazon"];

  private client: ApifyClient;
  private timeoutMs: number;

  constructor(apiToken: string, timeoutMs: number = 120000) {
    this.client = new ApifyClient({ token: apiToken });
    this.timeoutMs = timeoutMs;
  }

  async scrapeProduct(url: string): Promise<ScrapedProduct> {
    const platform = detectPlatform(url);
    if (!platform) {
      throw new Error(`Unsupported URL: ${url}`);
    }

    const actorId = ACTOR_IDS[platform] || DEFAULT_ACTOR;
    console.log(`[Apify] Scraping ${platform} product using actor: ${actorId}`);
    console.log(`[Apify] URL: ${url}`);

    try {
      // Run the configured actor for this platform
      const run = await this.client.actor(actorId).call(
        {
          // Input for product detail URLs
          productUrls: [{ url }],
          // Request all available data
          maxItems: 1,
        },
        {
          // Wait for completion with timeout
          timeout: this.timeoutMs,
        }
      );

      // Fetch results from the default dataset
      const { items } = await this.client
        .dataset(run.defaultDatasetId)
        .listItems();

      if (!items || items.length === 0) {
        throw new Error("No product data returned from Apify");
      }

      const result = items[0] as ApifyProductResult;
      return this.mapToScrapedProduct(result, url, platform);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Apify] Scraping failed: ${message}`);
      throw new Error(`Apify scraping failed: ${message}`);
    }
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

    // Extract currency
    const currency = data.currency || "USD";

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
    const sellerName = data.seller || data.sellerName;
    if (sellerName) {
      seller = { name: sellerName };
    }

    return {
      title,
      description,
      price,
      currency,
      images,
      sourceUrl,
      platform,
      brand: data.brand,
      sku: data.sku || data.productId,
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

    // Try features as fallback
    if (data.features && data.features.length > 0) {
      return data.features.join("\n");
    }

    return "";
  }

  private extractPrice(data: ApifyProductResult): number {
    if (typeof data.price === "number") {
      return data.price;
    }

    if (typeof data.price === "string") {
      // Remove currency symbols and parse
      const cleaned = data.price.replace(/[^0-9.,]/g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }

    return 0;
  }

  private extractImages(data: ApifyProductResult): string[] {
    const images: string[] = [];

    // Add images array
    if (data.images && Array.isArray(data.images)) {
      images.push(
        ...data.images.filter((img) => typeof img === "string" && img.startsWith("http"))
      );
    }

    // Add single image fields
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

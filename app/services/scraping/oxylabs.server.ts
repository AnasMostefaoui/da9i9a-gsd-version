/**
 * Oxylabs E-commerce Scraper API Provider
 * https://developers.oxylabs.io/scraping-solutions/web-scraper-api
 *
 * Uses:
 * - amazon_product source for Amazon
 * - universal_ecommerce source for AliExpress
 */

import type {
  ScraperProvider,
  ScrapedProduct,
  Platform,
  ReviewSummary,
  SellerInfo,
  ShippingInfo,
} from "./types";
import { detectPlatform, extractProductId } from "./types";

const OXYLABS_API_URL = "https://realtime.oxylabs.io/v1/queries";

/**
 * Oxylabs Amazon parsed response structure
 */
interface OxylabsAmazonProduct {
  title?: string;
  price?: number;
  price_strikethrough?: number;
  currency?: string;
  description?: string;
  feature_bullets?: string[];
  images?: string[];
  rating?: number;
  reviews_count?: number;
  brand?: string;
  asin?: string;
  seller_name?: string;
  seller_url?: string;
  availability?: string;
  categories?: Array<{ name: string }>;
  specifications?: Array<{ name: string; value: string }>;
  shipping_price?: number;
}

/**
 * Oxylabs universal e-commerce parsed response structure
 */
interface OxylabsUniversalProduct {
  title?: string;
  name?: string;
  price?: number | string;
  currency?: string;
  description?: string;
  images?: string[];
  image?: string;
  rating?: number;
  reviews_count?: number;
  brand?: string;
  sku?: string;
  seller?: string;
  url?: string;
}

interface OxylabsResponse {
  results: Array<{
    content: OxylabsAmazonProduct | OxylabsUniversalProduct | string;
    status_code: number;
    url: string;
  }>;
}

export class OxylabsProvider implements ScraperProvider {
  name = "oxylabs";
  supportedPlatforms: Platform[] = ["aliexpress", "amazon"];

  private username: string;
  private password: string;
  private timeoutMs: number;

  constructor(username: string, password: string, timeoutMs: number = 60000) {
    this.username = username;
    this.password = password;
    this.timeoutMs = timeoutMs;
  }

  async scrapeProduct(url: string): Promise<ScrapedProduct> {
    const platform = detectPlatform(url);
    if (!platform) {
      throw new Error(`Unsupported URL: ${url}`);
    }

    console.log(`[Oxylabs] Scraping ${platform} product: ${url}`);

    if (platform === "amazon") {
      return this.scrapeAmazon(url);
    } else {
      return this.scrapeAliExpress(url);
    }
  }

  private async scrapeAmazon(url: string): Promise<ScrapedProduct> {
    const asin = extractProductId(url, "amazon");
    if (!asin) {
      throw new Error(`Could not extract ASIN from URL: ${url}`);
    }

    // Extract domain from URL
    const domainMatch = url.match(/amazon\.([\w.]+)/i);
    const domain = domainMatch ? domainMatch[1] : "com";

    const payload = {
      source: "amazon_product",
      query: asin,
      domain: domain,
      parse: true,
    };

    const response = await this.makeRequest(payload);
    const result = response.results[0];

    if (result.status_code !== 200) {
      throw new Error(`Oxylabs returned status ${result.status_code}`);
    }

    const data = result.content as OxylabsAmazonProduct;
    return this.mapAmazonProduct(data, url);
  }

  private async scrapeAliExpress(url: string): Promise<ScrapedProduct> {
    const payload = {
      source: "universal_ecommerce",
      url: url,
      parse: true,
      render: "html",
    };

    const response = await this.makeRequest(payload);
    const result = response.results[0];

    if (result.status_code !== 200) {
      throw new Error(`Oxylabs returned status ${result.status_code}`);
    }

    const data = result.content as OxylabsUniversalProduct;
    return this.mapAliExpressProduct(data, url);
  }

  private async makeRequest(payload: Record<string, unknown>): Promise<OxylabsResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(OXYLABS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Basic " +
            Buffer.from(`${this.username}:${this.password}`).toString("base64"),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Oxylabs API error (${response.status}): ${errorText}`);
      }

      return (await response.json()) as OxylabsResponse;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Oxylabs request timed out after ${this.timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private mapAmazonProduct(
    data: OxylabsAmazonProduct,
    sourceUrl: string
  ): ScrapedProduct {
    const title = data.title;
    if (!title) {
      throw new Error("No title found in Amazon product data");
    }

    // Build description from feature bullets or description
    let description = "";
    if (data.description) {
      description = data.description;
    } else if (data.feature_bullets && data.feature_bullets.length > 0) {
      description = data.feature_bullets.join("\n");
    }

    const price = data.price || 0;
    const currency = data.currency || "USD";

    const images = data.images || [];
    if (images.length === 0) {
      throw new Error("No images found in Amazon product data");
    }

    // Build review summary
    let reviewSummary: ReviewSummary | undefined;
    if (data.rating && data.reviews_count) {
      reviewSummary = {
        rating: data.rating,
        count: data.reviews_count,
      };
    }

    // Build seller info
    let seller: SellerInfo | undefined;
    if (data.seller_name) {
      seller = {
        name: data.seller_name,
        url: data.seller_url,
      };
    }

    // Build shipping info
    let shipping: ShippingInfo | undefined;
    if (data.shipping_price !== undefined) {
      shipping = {
        cost: data.shipping_price,
        currency: currency,
        freeShipping: data.shipping_price === 0,
      };
    }

    // Build specifications
    let specifications: Record<string, string> | undefined;
    if (data.specifications && data.specifications.length > 0) {
      specifications = {};
      for (const spec of data.specifications) {
        if (spec.name && spec.value) {
          specifications[spec.name] = spec.value;
        }
      }
    }

    return {
      title,
      description,
      price,
      currency,
      images: images.slice(0, 15),
      sourceUrl,
      platform: "amazon",
      brand: data.brand,
      sku: data.asin,
      specifications,
      reviewSummary,
      seller,
      shipping,
      scrapedAt: new Date(),
      provider: this.name,
    };
  }

  private mapAliExpressProduct(
    data: OxylabsUniversalProduct,
    sourceUrl: string
  ): ScrapedProduct {
    const title = data.title || data.name;
    if (!title) {
      throw new Error("No title found in AliExpress product data");
    }

    const description = data.description || "";

    // Extract price
    let price = 0;
    if (typeof data.price === "number") {
      price = data.price;
    } else if (typeof data.price === "string") {
      const cleaned = data.price.replace(/[^0-9.,]/g, "").replace(",", ".");
      price = parseFloat(cleaned) || 0;
    }

    const currency = data.currency || "USD";

    // Extract images
    const images: string[] = [];
    if (data.images && Array.isArray(data.images)) {
      images.push(
        ...data.images.filter(
          (img): img is string => typeof img === "string" && img.startsWith("http")
        )
      );
    }
    if (data.image && typeof data.image === "string" && data.image.startsWith("http")) {
      if (!images.includes(data.image)) {
        images.unshift(data.image);
      }
    }

    if (images.length === 0) {
      throw new Error("No images found in AliExpress product data");
    }

    // Build review summary
    let reviewSummary: ReviewSummary | undefined;
    if (data.rating && data.reviews_count) {
      reviewSummary = {
        rating: data.rating,
        count: data.reviews_count,
      };
    }

    // Build seller info
    let seller: SellerInfo | undefined;
    if (data.seller) {
      seller = { name: data.seller };
    }

    return {
      title,
      description,
      price,
      currency,
      images: [...new Set(images)].slice(0, 15),
      sourceUrl,
      platform: "aliexpress",
      brand: data.brand,
      sku: data.sku,
      reviewSummary,
      seller,
      scrapedAt: new Date(),
      provider: this.name,
    };
  }
}

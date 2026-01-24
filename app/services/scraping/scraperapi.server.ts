import type { ScraperProvider, ScrapedProduct, Platform } from "./types";

/**
 * ScraperAPI Provider
 * Primary provider for AliExpress, fallback for Amazon
 * https://www.scraperapi.com/
 */
export class ScraperAPIProvider implements ScraperProvider {
  name = "scraperapi";
  supportedPlatforms: Platform[] = ["aliexpress", "amazon"];
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async scrapeProduct(url: string): Promise<ScrapedProduct> {
    const platform = this.detectPlatform(url);
    if (!platform) {
      throw new Error("Unsupported URL format");
    }

    // ScraperAPI endpoint
    const apiUrl = new URL("https://api.scraperapi.com/");
    apiUrl.searchParams.set("api_key", this.apiKey);
    apiUrl.searchParams.set("url", url);
    apiUrl.searchParams.set("render", "true"); // Enable JavaScript rendering

    const response = await fetch(apiUrl.toString());

    if (!response.ok) {
      throw new Error(`ScraperAPI error: ${response.status}`);
    }

    const html = await response.text();

    // Parse based on platform
    if (platform === "aliexpress") {
      return this.parseAliExpress(html, url);
    } else {
      return this.parseAmazon(html, url);
    }
  }

  private detectPlatform(url: string): Platform | null {
    if (url.includes("aliexpress.")) return "aliexpress";
    if (url.includes("amazon.")) return "amazon";
    return null;
  }

  private parseAliExpress(html: string, sourceUrl: string): ScrapedProduct {
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)</i);
    const title = titleMatch?.[1]?.replace(/ - AliExpress.*/, "").trim() || "منتج من AliExpress";

    // Extract description from JSON data or meta tags
    let description = "";

    // Try JSON embedded data first
    const descJsonMatch = html.match(/"description"\s*:\s*"([^"]+)"/);
    if (descJsonMatch?.[1]) {
      description = descJsonMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
    }

    // Try meta description as fallback
    if (!description) {
      const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      description = metaDescMatch?.[1] || "";
    }

    // Try og:description as another fallback
    if (!description) {
      const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
      description = ogDescMatch?.[1] || "";
    }

    // Extract images from JSON data embedded in page
    const imageMatches = html.match(/"imageUrl"\s*:\s*"([^"]+)"/g) || [];
    const images = imageMatches
      .map(m => m.match(/"imageUrl"\s*:\s*"([^"]+)"/)?.[1])
      .filter((url): url is string => !!url && url.startsWith("http"))
      .slice(0, 10);

    // Extract price
    const priceMatch = html.match(/"formattedActivityPrice"\s*:\s*"([^"]+)"/);
    const priceStr = priceMatch?.[1] || "0";
    const price = parseFloat(priceStr.replace(/[^0-9.]/g, "")) || 0;

    return {
      title,
      description,
      price,
      currency: "USD",
      images: images.length > 0 ? images : ["https://placehold.co/400x400/e2e8f0/64748b?text=No+Image"],
      sourceUrl,
      platform: "aliexpress",
      scrapedAt: new Date(),
      provider: this.name,
    };
  }

  private parseAmazon(html: string, sourceUrl: string): ScrapedProduct {
    // Extract title
    const titleMatch = html.match(/<span[^>]*id="productTitle"[^>]*>([^<]+)</i);
    const title = titleMatch?.[1]?.trim() || "منتج من Amazon";

    // Extract description from various Amazon locations
    let description = "";

    // Try product description div
    const descDivMatch = html.match(/<div[^>]*id="productDescription"[^>]*>([\s\S]*?)<\/div>/i);
    if (descDivMatch?.[1]) {
      // Strip HTML tags and clean up
      description = descDivMatch[1]
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    // Try feature bullets as fallback
    if (!description) {
      const bulletMatches = html.match(/<span[^>]*class="[^"]*a-list-item[^"]*"[^>]*>([^<]+)</gi) || [];
      const bullets = bulletMatches
        .map(m => m.match(/>([^<]+)</)?.[1]?.trim())
        .filter(Boolean)
        .slice(0, 5);
      if (bullets.length > 0) {
        description = bullets.join(". ");
      }
    }

    // Try meta description as final fallback
    if (!description) {
      const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      description = metaDescMatch?.[1] || "";
    }

    // Extract images
    const imageMatches = html.match(/"large"\s*:\s*"([^"]+)"/g) || [];
    const images = imageMatches
      .map(m => m.match(/"large"\s*:\s*"([^"]+)"/)?.[1])
      .filter((url): url is string => !!url && url.startsWith("http"))
      .slice(0, 10);

    // Extract price
    const priceMatch = html.match(/<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>([^<]+)/i);
    const priceStr = priceMatch?.[1] || "0";
    const price = parseFloat(priceStr.replace(/[^0-9.]/g, "")) || 0;

    return {
      title,
      description,
      price,
      currency: "USD",
      images: images.length > 0 ? images : ["https://placehold.co/400x400/e2e8f0/64748b?text=No+Image"],
      sourceUrl,
      platform: "amazon",
      scrapedAt: new Date(),
      provider: this.name,
    };
  }
}

/**
 * Scraping Orchestrator
 * Manages provider fallback chains and retry logic
 *
 * Configuration:
 * - Per-platform provider chains (primary → fallback → ...)
 * - Automatic retry with exponential backoff
 * - Detailed logging for debugging
 */

import type {
  ScraperProvider,
  ScrapedProduct,
  Platform,
  ScrapingConfig,
  ScrapeResult,
} from "./types";
import { detectPlatform, DEFAULT_SCRAPING_CONFIG } from "./types";
import { ApifyProvider } from "./apify.server";
import { OxylabsProvider } from "./oxylabs.server";
import {
  estimateScrapeCost,
  createCostMetadata,
  type ScrapeCostMetadata,
} from "./cost-tracker.server";
import {
  analyzeProductImage,
  isVisionConfigured,
} from "~/services/ai/vision.server";

interface ProviderCredentials {
  apify?: {
    token: string;
  };
  oxylabs?: {
    username: string;
    password: string;
  };
}

export class ScrapingOrchestrator {
  private providers: Map<string, ScraperProvider> = new Map();
  private config: ScrapingConfig;

  constructor(credentials: ProviderCredentials, config?: Partial<ScrapingConfig>) {
    this.config = { ...DEFAULT_SCRAPING_CONFIG, ...config };

    // Initialize available providers based on credentials
    if (credentials.apify?.token) {
      this.providers.set(
        "apify",
        new ApifyProvider(credentials.apify.token, this.config.timeoutMs)
      );
      console.log("[Orchestrator] Apify provider initialized");
    }

    if (credentials.oxylabs?.username && credentials.oxylabs?.password) {
      this.providers.set(
        "oxylabs",
        new OxylabsProvider(
          credentials.oxylabs.username,
          credentials.oxylabs.password,
          this.config.timeoutMs
        )
      );
      console.log("[Orchestrator] Oxylabs provider initialized");
    }

    if (this.providers.size === 0) {
      throw new Error(
        "No scraping providers configured. Please set APIFY_TOKEN or OXYLABS_USERNAME/OXYLABS_PASSWORD."
      );
    }
  }

  /**
   * Update configuration (e.g., from dashboard settings)
   */
  updateConfig(config: Partial<ScrapingConfig>): void {
    this.config = { ...this.config, ...config };
    console.log("[Orchestrator] Configuration updated:", this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): ScrapingConfig {
    return { ...this.config };
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Scrape a product URL with automatic fallback
   * @param url Product URL to scrape
   * @param forceRefresh Skip cache and fetch fresh data
   */
  async scrapeProduct(url: string, forceRefresh: boolean = false): Promise<ScrapedProduct> {
    const platform = detectPlatform(url);
    if (!platform) {
      throw new Error(
        `Unsupported URL. Only AliExpress and Amazon URLs are supported.\nURL: ${url}`
      );
    }

    console.log(`[Orchestrator] Starting scrape for ${platform}: ${url}`);

    // Get provider chain for this platform
    const providerChain = this.config.providerChains[platform];
    const availableProviders = providerChain.filter((name) =>
      this.providers.has(name)
    );

    if (availableProviders.length === 0) {
      throw new Error(
        `No providers available for ${platform}. ` +
          `Configured: [${providerChain.join(", ")}], ` +
          `Available: [${this.getAvailableProviders().join(", ")}]`
      );
    }

    console.log(
      `[Orchestrator] Provider chain for ${platform}: [${availableProviders.join(" → ")}]`
    );

    const attempts: ScrapeResult[] = [];
    let lastError: Error | null = null;

    // Try each provider in the chain
    for (const providerName of availableProviders) {
      const provider = this.providers.get(providerName)!;

      // Try with retries
      for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
        const startTime = Date.now();

        try {
          console.log(
            `[Orchestrator] Attempting ${providerName} (attempt ${attempt}/${this.config.maxRetries})`
          );

          const product = await provider.scrapeProduct(url, forceRefresh);
          const duration = Date.now() - startTime;

          console.log(
            `[Orchestrator] ✓ Success with ${providerName} in ${duration}ms`
          );

          // Validate the result - may throw if critical data missing
          const validationResult = this.validateProduct(product);

          // Check if AI vision fallback is needed (title missing but images exist)
          if (validationResult.needsVisionFallback) {
            console.log("[Orchestrator] Text scraping incomplete, attempting AI vision fallback...");

            if (isVisionConfigured() && product.images.length > 0) {
              try {
                const visionResult = await analyzeProductImage(product.images[0], platform);
                product.title = visionResult.title;
                product.description = visionResult.description || product.description;
                product.provider = `${product.provider}+vision`; // Track hybrid source
                product.aiGenerated = true; // Mark as AI-generated
                console.log(`[Orchestrator] AI vision generated: "${product.title}"`);
              } catch (visionError) {
                const visionErrorMsg = visionError instanceof Error ? visionError.message : String(visionError);
                console.error("[Orchestrator] AI vision fallback failed:", visionErrorMsg);
                // Re-throw original validation error - we truly have no title
                throw new Error(`Failed to scrape product text and AI vision fallback failed: ${visionErrorMsg}`);
              }
            } else if (!isVisionConfigured()) {
              console.warn("[Orchestrator] AI vision not configured (GEMINI_API_KEY missing)");
              throw new Error("Failed to scrape product title and AI vision is not configured");
            } else {
              throw new Error("Failed to scrape product title and no images available for AI fallback");
            }
          }

          // Attach cost metadata for subscription enforcement
          const costMetadata = createCostMetadata(
            product.provider,
            platform,
            duration
          );
          product.costMetadata = costMetadata;

          console.log(
            `[Orchestrator] Scrape cost: $${costMetadata.estimatedCostUsd.toFixed(4)} (${costMetadata.provider})`
          );

          attempts.push({
            success: true,
            product,
            provider: providerName,
            duration,
          });

          return product;
        } catch (error) {
          const duration = Date.now() - startTime;
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          console.error(
            `[Orchestrator] ✗ ${providerName} attempt ${attempt} failed: ${errorMessage}`
          );

          lastError = error instanceof Error ? error : new Error(errorMessage);

          attempts.push({
            success: false,
            error: errorMessage,
            provider: providerName,
            duration,
          });

          // Wait before retry (exponential backoff)
          if (attempt < this.config.maxRetries) {
            const delay = this.config.retryDelayMs * Math.pow(2, attempt - 1);
            console.log(`[Orchestrator] Waiting ${delay}ms before retry...`);
            await this.sleep(delay);
          }
        }
      }

      console.log(
        `[Orchestrator] ${providerName} exhausted all retries, trying next provider...`
      );
    }

    // All providers failed
    const attemptsSummary = attempts
      .map((a) => `${a.provider}: ${a.success ? "✓" : "✗"} (${a.duration}ms)`)
      .join(", ");

    throw new Error(
      `All scraping providers failed for ${platform}.\n` +
        `URL: ${url}\n` +
        `Attempts: ${attemptsSummary}\n` +
        `Last error: ${lastError?.message || "Unknown error"}`
    );
  }

  /**
   * Validation result indicating whether AI vision fallback is needed
   */
  private validateProduct(product: ScrapedProduct): { needsVisionFallback: boolean } {
    const errors: string[] = [];
    const missingTitle = !product.title || product.title.trim().length === 0;
    const hasImages = product.images && product.images.length > 0;

    // Images are always required - no fallback possible without them
    if (!hasImages) {
      errors.push("Missing images");
    }

    if (product.price < 0) {
      errors.push("Invalid price");
    }

    // Description is optional but log a warning if empty
    if (!product.description || product.description.trim().length === 0) {
      console.warn(
        "[Orchestrator] Warning: Product has no description, AI enhancement recommended"
      );
    }

    // Throw for critical errors (no images, invalid price)
    if (errors.length > 0) {
      throw new Error(`Invalid product data: ${errors.join(", ")}`);
    }

    // If title is missing but we have images, indicate vision fallback is needed
    if (missingTitle && hasImages) {
      console.log("[Orchestrator] Product missing title but has images - vision fallback candidate");
      return { needsVisionFallback: true };
    }

    return { needsVisionFallback: false };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create a singleton orchestrator from environment variables
 */
let orchestratorInstance: ScrapingOrchestrator | null = null;

export function getScrapingOrchestrator(): ScrapingOrchestrator {
  if (!orchestratorInstance) {
    const credentials: ProviderCredentials = {};

    // Apify credentials
    const apifyToken = process.env.APIFY_TOKEN;
    if (apifyToken) {
      credentials.apify = { token: apifyToken };
    }

    // Oxylabs credentials
    const oxylabsUsername = process.env.OXYLABS_USERNAME;
    const oxylabsPassword = process.env.OXYLABS_PASSWORD;
    if (oxylabsUsername && oxylabsPassword) {
      credentials.oxylabs = {
        username: oxylabsUsername,
        password: oxylabsPassword,
      };
    }

    orchestratorInstance = new ScrapingOrchestrator(credentials);
  }

  return orchestratorInstance;
}

/**
 * Reset the singleton (useful for testing or config changes)
 */
export function resetScrapingOrchestrator(): void {
  orchestratorInstance = null;
}

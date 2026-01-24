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
   */
  async scrapeProduct(url: string): Promise<ScrapedProduct> {
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

          const product = await provider.scrapeProduct(url);
          const duration = Date.now() - startTime;

          console.log(
            `[Orchestrator] ✓ Success with ${providerName} in ${duration}ms`
          );

          // Validate the result
          this.validateProduct(product);

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
   * Validate that scraped product has required fields
   */
  private validateProduct(product: ScrapedProduct): void {
    const errors: string[] = [];

    if (!product.title || product.title.trim().length === 0) {
      errors.push("Missing title");
    }

    if (!product.images || product.images.length === 0) {
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

    if (errors.length > 0) {
      throw new Error(`Invalid product data: ${errors.join(", ")}`);
    }
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

/**
 * Product Scraping Inngest Function
 *
 * Handles async product scraping triggered by `product/scrape.requested` event.
 * Uses step.run() for automatic retry on failure.
 *
 * Flow:
 * 1. Load product by ID (should exist with status IMPORTING)
 * 2. Call scraping orchestrator to scrape the URL
 * 3. On success: Update product with scraped data, set status to IMPORTED
 * 4. On failure: Set status to FAILED, store error in metadata
 */

import { inngest } from "../client";
import { db } from "~/lib/db.server";
import { getScrapingOrchestrator } from "~/services/scraping/orchestrator.server";

export const scrapeProduct = inngest.createFunction(
  {
    id: "scrape-product",
    // Use scraper retry preset: 3 attempts with 5s starting delay
    retries: 3,
  },
  { event: "product/scrape.requested" },
  async ({ event, step }) => {
    const { productId, sourceUrl, merchantId } = event.data;
    const startTime = Date.now();

    console.log(`[ScrapeProduct] Starting scrape for product ${productId}`);
    console.log(`[ScrapeProduct] URL: ${sourceUrl}`);

    // Load the product to verify it exists
    const product = await step.run("load-product", async () => {
      const found = await db.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          status: true,
          merchantId: true,
          platform: true,
          contentLang: true,
        },
      });

      if (!found) {
        throw new Error(`Product not found: ${productId}`);
      }

      if (found.merchantId !== merchantId) {
        throw new Error(`Product ${productId} does not belong to merchant ${merchantId}`);
      }

      if (found.status !== "IMPORTING") {
        console.log(`[ScrapeProduct] Product ${productId} has status ${found.status}, expected IMPORTING`);
      }

      return found;
    });

    try {
      // Perform the scraping operation
      const scraped = await step.run("scrape-product", async () => {
        const orchestrator = getScrapingOrchestrator();
        console.log(`[ScrapeProduct] Available providers: ${orchestrator.getAvailableProviders().join(", ")}`);

        return await orchestrator.scrapeProduct(sourceUrl, false);
      });

      const scrapeDuration = Date.now() - startTime;

      console.log(`[ScrapeProduct] Successfully scraped: "${scraped.title}" via ${scraped.provider}`);
      console.log(`[ScrapeProduct] Duration: ${scrapeDuration}ms`);

      // Update product with scraped data
      await step.run("update-product-success", async () => {
        await db.product.update({
          where: { id: productId },
          data: {
            titleEn: scraped.title,
            descriptionEn: scraped.description || null,
            price: scraped.price,
            currency: scraped.currency,
            images: scraped.images,
            status: "IMPORTED",
            metadata: JSON.parse(JSON.stringify({
              // scrapedAt is a Date object, convert to ISO string for JSON storage
              scrapedAt: new Date(scraped.scrapedAt).toISOString(),
              provider: scraped.provider,
              scrapeDuration: scrapeDuration,
              brand: scraped.brand,
              sku: scraped.sku,
              reviewSummary: scraped.reviewSummary,
              seller: scraped.seller,
              // Cost tracking for subscription tier enforcement (Phase 5)
              scrapeCost: scraped.costMetadata,
              aiGenerated: scraped.aiGenerated,
            })),
          },
        });

        console.log(`[ScrapeProduct] Product ${productId} updated with scraped data, status: IMPORTED`);
      });

      // Emit completion event for downstream processing (e.g., AI enhancement)
      await step.sendEvent("emit-completed", {
        name: "product/scrape.completed",
        data: {
          productId,
          success: true,
          provider: scraped.provider,
          duration: scrapeDuration,
        },
      });

      return {
        success: true,
        productId,
        provider: scraped.provider,
        duration: scrapeDuration,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const scrapeDuration = Date.now() - startTime;

      console.error(`[ScrapeProduct] Scraping failed for product ${productId}:`, errorMessage);

      // Update product with failure status
      await step.run("update-product-failure", async () => {
        await db.product.update({
          where: { id: productId },
          data: {
            status: "FAILED",
            metadata: JSON.parse(JSON.stringify({
              scrapeError: errorMessage,
              scrapeFailedAt: new Date().toISOString(),
              scrapeDuration: scrapeDuration,
            })),
          },
        });

        console.log(`[ScrapeProduct] Product ${productId} marked as FAILED`);
      });

      // Emit failure event
      await step.sendEvent("emit-failed", {
        name: "product/scrape.failed",
        data: {
          productId,
          error: errorMessage,
          duration: scrapeDuration,
        },
      });

      // Don't re-throw - we've handled the failure gracefully
      // Inngest will mark this as completed (not failed) since we caught the error
      return {
        success: false,
        productId,
        error: errorMessage,
        duration: scrapeDuration,
      };
    }
  }
);

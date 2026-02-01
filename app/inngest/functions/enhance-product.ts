/**
 * Product AI Enhancement Inngest Function
 *
 * Handles async AI tasks: enhance, translate, landing-page generation.
 * Runs with concurrency limit to prevent server overload.
 *
 * Flow:
 * 1. Load product
 * 2. Run requested AI tasks in sequence
 * 3. Update product with results
 * 4. Emit completion event
 */

import { inngest } from "../client";
import { db } from "~/lib/db.server";
import {
  getGeminiProvider,
  isGeminiConfigured,
  translateToArabic,
  generateLandingPageContent,
} from "~/services/ai";

export const enhanceProduct = inngest.createFunction(
  {
    id: "enhance-product",
    // Concurrency limit: max 10 AI calls across all users
    concurrency: {
      limit: 10,
    },
    retries: 2,
  },
  { event: "product/enhance.requested" },
  async ({ event, step }) => {
    const { productId, merchantId, tasks } = event.data;
    const startTime = Date.now();

    console.log(`[EnhanceProduct] Starting AI tasks for product ${productId}`);
    console.log(`[EnhanceProduct] Tasks: ${tasks.join(", ")}`);

    // Load the product
    const product = await step.run("load-product", async () => {
      const found = await db.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          merchantId: true,
          titleEn: true,
          titleAr: true,
          descriptionEn: true,
          descriptionAr: true,
          price: true,
          currency: true,
          images: true,
          platform: true,
          sourceUrl: true,
          contentLang: true,
          metadata: true,
        },
      });

      if (!found) {
        throw new Error(`Product not found: ${productId}`);
      }

      if (found.merchantId !== merchantId) {
        throw new Error(`Product ${productId} does not belong to merchant ${merchantId}`);
      }

      return found;
    });

    const results: Record<string, boolean> = {};
    const errors: string[] = [];

    // Task 1: Enhance (English marketing copy)
    if (tasks.includes("enhance")) {
      try {
        await step.run("enhance-content", async () => {
          if (!isGeminiConfigured()) {
            throw new Error("Gemini API not configured");
          }

          const gemini = getGeminiProvider();
          const metadata = (product.metadata as Record<string, unknown>) || {};

          const enhanced = await gemini.enhanceProduct({
            title: product.titleEn || product.titleAr || "",
            description: product.descriptionEn || product.descriptionAr || "",
            price: Number(product.price),
            currency: product.currency,
            images: product.images,
            brand: metadata.brand as string | undefined,
            specifications: metadata.specifications as Record<string, string> | undefined,
            reviewSummary: metadata.reviewSummary as { rating: number; count: number } | undefined,
            seller: metadata.seller as { name: string; rating?: number } | undefined,
            platform: product.platform.toLowerCase() as "aliexpress" | "amazon",
            sourceUrl: product.sourceUrl,
          });

          await db.product.update({
            where: { id: productId },
            data: {
              titleEn: enhanced.title,
              descriptionEn: enhanced.description,
              metadata: {
                ...(product.metadata as object || {}),
                aiProvider: enhanced.provider,
                aiGeneratedAt: enhanced.generatedAt.toISOString(),
                highlights: enhanced.highlights,
              },
            },
          });

          console.log(`[EnhanceProduct] Enhanced content for ${productId}`);
        });
        results.enhance = true;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`[EnhanceProduct] Enhance failed: ${msg}`);
        errors.push(`enhance: ${msg}`);
        results.enhance = false;
      }
    }

    // Task 2: Translate to Arabic
    if (tasks.includes("translate")) {
      try {
        await step.run("translate-arabic", async () => {
          // Reload product to get latest titleEn (if just enhanced)
          const latest = await db.product.findUnique({
            where: { id: productId },
            select: {
              titleEn: true,
              descriptionEn: true,
              metadata: true,
            },
          });

          if (!latest?.titleEn) {
            throw new Error("No English title to translate");
          }

          const metadata = (latest.metadata as Record<string, unknown>) || {};
          const highlights = metadata.highlights as string[] | undefined;

          const arabicContent = await translateToArabic({
            title: latest.titleEn,
            description: latest.descriptionEn || "",
            highlights,
          });

          await db.product.update({
            where: { id: productId },
            data: {
              titleAr: arabicContent.titleAr,
              descriptionAr: arabicContent.descriptionAr,
              metadata: {
                ...metadata,
                highlightsAr: arabicContent.highlightsAr,
              },
            },
          });

          console.log(`[EnhanceProduct] Translated to Arabic for ${productId}`);
        });
        results.translate = true;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`[EnhanceProduct] Translate failed: ${msg}`);
        errors.push(`translate: ${msg}`);
        results.translate = false;
      }
    }

    // Task 3: Generate landing page
    if (tasks.includes("landing-page")) {
      try {
        await step.run("generate-landing-page", async () => {
          // Reload product to get latest content
          const latest = await db.product.findUnique({
            where: { id: productId },
            select: {
              titleEn: true,
              titleAr: true,
              descriptionEn: true,
              descriptionAr: true,
              price: true,
              currency: true,
              images: true,
              contentLang: true,
              metadata: true,
            },
          });

          if (!latest) {
            throw new Error("Product not found");
          }

          const metadata = (latest.metadata as Record<string, unknown>) || {};

          const landingContent = await generateLandingPageContent(
            {
              titleAr: latest.titleAr,
              titleEn: latest.titleEn,
              descriptionAr: latest.descriptionAr,
              descriptionEn: latest.descriptionEn,
              price: Number(latest.price),
              currency: latest.currency,
              images: latest.images,
              metadata: {
                brand: metadata.brand as string | undefined,
                reviewSummary: metadata.reviewSummary as { rating: number; count: number } | undefined,
                highlights: metadata.highlights as string[] | undefined,
              },
            },
            latest.contentLang as "ar" | "en"
          );

          await db.product.update({
            where: { id: productId },
            data: {
              landingPageContent: landingContent as unknown as object,
            },
          });

          console.log(`[EnhanceProduct] Generated landing page for ${productId}`);
        });
        results["landing-page"] = true;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`[EnhanceProduct] Landing page failed: ${msg}`);
        errors.push(`landing-page: ${msg}`);
        results["landing-page"] = false;
      }
    }

    // Update final status - clear processing flag
    const allSucceeded = Object.values(results).every(v => v);
    const duration = Date.now() - startTime;

    await step.run("update-status", async () => {
      // Get latest metadata to preserve other fields
      const latest = await db.product.findUnique({
        where: { id: productId },
        select: { metadata: true },
      });
      const currentMetadata = (latest?.metadata as Record<string, unknown>) || {};

      await db.product.update({
        where: { id: productId },
        data: {
          status: allSucceeded ? "ENHANCED" : "IMPORTED",
          metadata: {
            ...currentMetadata,
            aiProcessing: false, // Clear processing flag
            aiProcessedAt: new Date().toISOString(),
            aiDuration: duration,
            aiResults: results,
            aiErrors: errors.length > 0 ? errors : undefined,
          },
        },
      });
    });

    // Emit completion event
    await step.sendEvent("emit-completed", {
      name: "product/enhance.completed",
      data: {
        productId,
        tasks: tasks.filter(t => results[t]),
        duration,
      },
    });

    console.log(`[EnhanceProduct] Completed in ${duration}ms. Results: ${JSON.stringify(results)}`);

    return {
      success: allSucceeded,
      productId,
      results,
      errors: errors.length > 0 ? errors : undefined,
      duration,
    };
  }
);

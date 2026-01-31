/**
 * Gemini Vision Service
 * AI-powered product image analysis for fallback when text scraping fails
 *
 * Uses Gemini 2.5 Flash's multimodal capabilities to:
 * - Analyze product images
 * - Generate titles and descriptions from visual content
 * - Extract category information
 */

import type { Platform } from "~/services/scraping/types";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const VISION_TIMEOUT_MS = 30000;

export interface VisionAnalysisResult {
  title: string;
  description: string;
  category?: string;
  source: "ai-vision";
}

/**
 * Check if Gemini Vision is configured (uses same API key as text generation)
 */
export function isVisionConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

/**
 * Analyze a product image and generate title/description
 * Falls back to base64 encoding if URL fetch fails
 *
 * @param imageUrl URL of the product image to analyze
 * @param platform Source platform (aliexpress, amazon) for context
 */
export async function analyzeProductImage(
  imageUrl: string,
  platform: Platform
): Promise<VisionAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  console.log(`[Vision] Analyzing product image from ${platform}: ${imageUrl.slice(0, 80)}...`);

  // Build the prompt for product image analysis
  const prompt = buildVisionPrompt(platform);

  // Try URL-based analysis first, fall back to base64 if needed
  let imagePart: { inlineData: { mimeType: string; data: string } } | { fileData: { mimeType: string; fileUri: string } };

  try {
    // Gemini can accept image URLs directly via fileData
    // However, some URLs may not be accessible, so we try base64 as fallback
    const imageData = await fetchImageAsBase64(imageUrl);
    imagePart = {
      inlineData: {
        mimeType: imageData.mimeType,
        data: imageData.base64,
      },
    };
  } catch (fetchError) {
    console.warn(`[Vision] Failed to fetch image, trying direct URL: ${fetchError}`);
    // Fall back to using the URL directly (Gemini may be able to fetch it)
    throw new Error(`Failed to fetch product image: ${fetchError}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), VISION_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                imagePart,
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                title: {
                  type: "STRING",
                  description: "Concise, benefit-focused product title (max 65 characters)",
                },
                description: {
                  type: "STRING",
                  description: "Marketing description (2 paragraphs) based on visible product features",
                },
                category: {
                  type: "STRING",
                  description: "Product category (e.g., Electronics, Fashion, Home & Garden)",
                },
              },
              required: ["title", "description"],
            },
            temperature: 0.5, // Lower temperature for more consistent product descriptions
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      console.error(`[Vision] API error: ${error}`);
      throw new Error(`Gemini Vision API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("No response from Gemini Vision");
    }

    // Parse the JSON response
    try {
      const parsed = JSON.parse(text);

      // Validate title length (max 65 chars as specified)
      let title = parsed.title || "";
      if (title.length > 65) {
        title = title.slice(0, 62) + "...";
      }

      console.log(`[Vision] Successfully analyzed image: "${title}"`);

      return {
        title,
        description: parsed.description || "",
        category: parsed.category,
        source: "ai-vision",
      };
    } catch (parseError) {
      // Fallback: Extract fields with regex if JSON is malformed
      console.warn(`[Vision] JSON parse failed, attempting regex extraction...`);

      const titleMatch = text.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const descMatch = text.match(/"description"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const categoryMatch = text.match(/"category"\s*:\s*"((?:[^"\\]|\\.)*)"/);

      if (titleMatch) {
        let title = titleMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
        if (title.length > 65) {
          title = title.slice(0, 62) + "...";
        }

        console.log(`[Vision] Recovered content via regex: "${title}"`);

        return {
          title,
          description: descMatch?.[1]?.replace(/\\n/g, "\n").replace(/\\"/g, '"') || "",
          category: categoryMatch?.[1]?.replace(/\\n/g, "\n").replace(/\\"/g, '"'),
          source: "ai-vision",
        };
      }

      throw new Error("Failed to parse Gemini Vision response");
    }
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Vision analysis timed out after ${VISION_TIMEOUT_MS}ms`);
    }

    throw error;
  }
}

/**
 * Build the vision analysis prompt for product images
 */
function buildVisionPrompt(platform: Platform): string {
  const platformName = platform === "aliexpress" ? "AliExpress" : "Amazon";

  return `You are analyzing a product image from ${platformName} to generate listing content.

Look at this product image and provide:
1. A concise, benefit-focused product title (max 65 characters)
2. A marketing description (2 paragraphs) based on what you see
3. Product category (e.g., "Electronics", "Fashion", "Home & Garden")

Focus on:
- What the product IS (not assumptions about brand/price)
- Visible features and quality indicators
- Use case and benefits

Guidelines:
- Title should highlight the main benefit or key feature
- Description should be compelling marketing copy, not just a list of features
- Be specific about what you can SEE, avoid making assumptions
- If you can identify text/branding in the image, you may include it

Return JSON: { "title": "...", "description": "...", "category": "..." }`;
}

/**
 * Fetch an image and convert to base64 for Gemini API
 */
async function fetchImageAsBase64(
  imageUrl: string
): Promise<{ base64: string; mimeType: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for image fetch

  try {
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        // Some CDNs require a User-Agent
        "User-Agent": "Mozilla/5.0 (compatible; ProductScraper/1.0)",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // Validate mime type
    const validMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const mimeType = validMimeTypes.includes(contentType) ? contentType : "image/jpeg";

    return { base64, mimeType };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Image fetch timed out");
    }

    throw error;
  }
}

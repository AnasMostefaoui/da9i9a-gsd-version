/**
 * Gemini AI Provider
 * Marketing-focused content generation (Atlas-inspired approach)
 *
 * Philosophy: Act as a copywriter, not a translator
 * - Transform product specs into buyer benefits
 * - Address pain points and objections
 * - Use social proof when available
 */

import type { AIProvider, ProductSignals, EnhancedContent } from "./types";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export class GeminiProvider implements AIProvider {
  name = "gemini";
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Gemini API key is required");
    }
    this.apiKey = apiKey;
  }

  async enhanceProduct(signals: ProductSignals): Promise<EnhancedContent> {
    const prompt = this.buildMarketingPrompt(signals);

    console.log(`[Gemini] Enhancing product: "${signals.title.slice(0, 50)}..."`);

    const response = await fetch(
      `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7, // Some creativity for marketing copy
            maxOutputTokens: 4096, // Increased to avoid truncation
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`[Gemini] API error: ${error}`);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("No response from Gemini");
    }

    try {
      const parsed = JSON.parse(text);

      console.log(`[Gemini] Successfully generated marketing content`);

      return {
        title: parsed.title,
        description: parsed.description,
        highlights: parsed.highlights || [],
        generatedAt: new Date(),
        provider: this.name,
      };
    } catch (parseError) {
      console.error(`[Gemini] Failed to parse response: ${text.slice(0, 500)}...`);

      // Try to salvage truncated JSON
      const salvaged = this.tryRecoverTruncatedJson(text);
      if (salvaged) {
        console.log(`[Gemini] Recovered truncated response`);
        return {
          title: salvaged.title || signals.title,
          description: salvaged.description || "",
          highlights: salvaged.highlights || [],
          generatedAt: new Date(),
          provider: this.name,
        };
      }

      throw new Error("Failed to parse Gemini response as JSON");
    }
  }

  /**
   * Attempt to recover usable data from truncated JSON
   */
  private tryRecoverTruncatedJson(text: string): { title?: string; description?: string; highlights?: string[] } | null {
    try {
      // Try to extract fields with regex even if JSON is broken
      const titleMatch = text.match(/"title"\s*:\s*"([^"]+)"/);
      const descMatch = text.match(/"description"\s*:\s*"((?:[^"\\]|\\.)*)"/);

      if (titleMatch || descMatch) {
        // Extract highlights that are complete
        const highlightsMatch = text.match(/"highlights"\s*:\s*\[([\s\S]*)/);
        let highlights: string[] = [];
        if (highlightsMatch) {
          const itemMatches = highlightsMatch[1].matchAll(/"([^"]+)"/g);
          highlights = Array.from(itemMatches, m => m[1]).filter(h => h.length > 5);
        }

        return {
          title: titleMatch?.[1],
          description: descMatch?.[1]?.replace(/\\n/g, '\n').replace(/\\"/g, '"'),
          highlights,
        };
      }
    } catch {
      // Recovery failed
    }
    return null;
  }

  private buildMarketingPrompt(signals: ProductSignals): string {
    // Build context sections
    const reviewContext = signals.reviewSummary
      ? `\n- Reviews: ${signals.reviewSummary.rating}/5 stars (${signals.reviewSummary.count} reviews)`
      : "";

    const brandContext = signals.brand ? `\n- Brand: ${signals.brand}` : "";

    const specsContext = signals.specifications
      ? `\n- Key Specs: ${Object.entries(signals.specifications)
          .slice(0, 5)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ")}`
      : "";

    return `You are an expert e-commerce copywriter who transforms product listings into compelling sales copy.

## Your Task
Transform this product data into marketing-focused content that SELLS, not just describes.

## Product Data
- Original Title: ${signals.title}
- Price: ${signals.price} ${signals.currency}
- Platform: ${signals.platform}${brandContext}${reviewContext}${specsContext}

## Original Description (use as reference, don't copy):
${signals.description || "(No description available - generate based on title and context)"}

## Marketing Guidelines

### For the TITLE:
- Lead with the primary BENEFIT, not the product name
- Include the key differentiator (why THIS product?)
- **CRITICAL: Maximum 65 characters** (hard limit for SEO)
- Be concise - every word must earn its place
- Examples of good titles (all under 65 chars):
  - "Crystal Clear Audio for Streamers - FIFINE Mic" (46 chars)
  - "Block Noise, Hear More - ANC Wireless Headphones" (49 chars)
  - "4K Action Camera with Pro Stabilization" (40 chars)

### For the DESCRIPTION:
Write 2-3 paragraphs that:

1. **Hook (first sentence)**: Address a pain point or desire
   - "Tired of muffled audio ruining your streams?"
   - "Finally, professional sound quality without the professional price tag."

2. **Benefits (not features)**: Transform specs into outcomes
   - DON'T say: "Has a cardioid polar pattern"
   - DO say: "Captures your voice clearly while blocking background noise"

3. **Social Proof** (if reviews available): Weave in credibility
   - "Join thousands of satisfied creators..."
   - "Rated ${signals.reviewSummary?.rating || "highly"} by users who..."

4. **Soft CTA**: End with forward momentum
   - "Upgrade your setup today."
   - "Experience the difference."

### For HIGHLIGHTS:
Create exactly 3-4 bullet points that:
- Start with action verbs or benefits
- **Maximum 50 characters each** (for clean display)
- Are scannable (under 8 words each)
- Address different buyer concerns (quality, ease, value)

## Output Format & Limits
Return ONLY valid JSON with these STRICT limits:
- title: max 65 characters
- description: 2-3 short paragraphs
- highlights: 3-4 items, each max 50 characters

{
  "title": "Short benefit-focused title (max 65 chars)",
  "description": "2-3 paragraph marketing description...",
  "highlights": [
    "Short benefit bullet (max 50 chars)",
    "Another benefit bullet",
    "Third benefit bullet"
  ]
}`;
  }
}

/**
 * Create Gemini provider from environment
 */
let geminiInstance: GeminiProvider | null = null;

export function getGeminiProvider(): GeminiProvider {
  if (!geminiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not configured. Please set it in your .env file."
      );
    }
    geminiInstance = new GeminiProvider(apiKey);
  }
  return geminiInstance;
}

/**
 * Check if Gemini is configured
 */
export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

/**
 * Translate content to KSA-style Arabic
 * Uses Gulf Arabic conventions with Modern Standard Arabic base
 */
export async function translateToArabic(content: {
  title: string;
  description: string;
  highlights?: string[];
}): Promise<{
  titleAr: string;
  descriptionAr: string;
  highlightsAr: string[];
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const prompt = `You are an expert Arabic copywriter specializing in Saudi Arabian (KSA) e-commerce content.

## Your Task
Transform the following English product content into compelling Arabic marketing copy for the Saudi market. This is NOT a literal translation - adapt the content for Saudi consumers.

## KSA Arabic Style Guidelines

### Language Style:
- Use Modern Standard Arabic (الفصحى) with a Gulf Arabic touch
- Keep it professional yet warm - Saudis appreciate quality and trust
- Be confident and direct - avoid overly flowery language

### Vocabulary Preferences (use these terms):
- "توصيل سريع" for fast delivery
- "شحن مجاني" for free shipping
- "ضمان" for warranty/guarantee
- "جودة عالية" or "جودة ممتازة" for high quality
- "أصلي 100%" for 100% authentic
- "متوفر الآن" for available now
- "أفضل سعر" for best price
- "خدمة عملاء" for customer service
- "الدفع عند الاستلام" for cash on delivery
- "منتج مميز" for featured/special product

### Cultural Considerations:
- Reference fast delivery within KSA (1-3 days)
- Mention secure payment and trusted shopping
- Quality assurance and authenticity are very important
- Warranty and return policies build trust

### Format Rules:
- Title: Maximum 70 Arabic characters, benefit-focused
- Description: 2-3 paragraphs, compelling marketing copy
- Highlights: 3-4 bullets, each under 40 Arabic characters

## English Content to Transform

**Title:**
${content.title}

**Description:**
${content.description}

**Highlights:**
${content.highlights?.map((h, i) => `${i + 1}. ${h}`).join('\n') || 'None provided'}

## Output Format
Return ONLY valid JSON:

{
  "titleAr": "العنوان العربي المقنع",
  "descriptionAr": "وصف تسويقي جذاب بالعربية من 2-3 فقرات...",
  "highlightsAr": ["ميزة 1", "ميزة 2", "ميزة 3"]
}

CRITICAL: Do NOT transliterate. Transform the message for Saudi buyers. Make it sound native, not translated.`;

  console.log(`[Gemini] Translating to KSA Arabic: "${content.title.slice(0, 30)}..."`);

  const response = await fetch(
    `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.6,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error(`[Gemini] Translation API error: ${error}`);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No translation response from Gemini");
  }

  const parsed = JSON.parse(text);
  console.log(`[Gemini] Successfully translated to KSA Arabic`);

  return {
    titleAr: parsed.titleAr,
    descriptionAr: parsed.descriptionAr,
    highlightsAr: parsed.highlightsAr || [],
  };
}

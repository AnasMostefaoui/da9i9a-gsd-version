import type { AIProvider, TextEnhancementRequest, TextEnhancementResponse } from "./types";

/**
 * Gemini AI Provider
 * Uses Google's Gemini API for text enhancement
 */
export class GeminiProvider implements AIProvider {
  name = "gemini";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async enhanceProductText(request: TextEnhancementRequest): Promise<TextEnhancementResponse> {
    const prompt = this.buildPrompt(request);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("No response from Gemini");
    }

    return JSON.parse(text) as TextEnhancementResponse;
  }

  private buildPrompt(request: TextEnhancementRequest): string {
    return `You are an expert e-commerce copywriter. Enhance this product listing for a Saudi Arabian online store.

Original Product:
- Title: ${request.title}
- Description: ${request.description}

Requirements:
1. Create compelling, SEO-optimized titles in both Arabic and English
2. Write engaging product descriptions that highlight benefits
3. Keep Arabic as the primary language, culturally appropriate for Saudi market
4. Descriptions should be 2-3 paragraphs, professional but friendly

Return JSON in this exact format:
{
  "title": {
    "ar": "العنوان بالعربية",
    "en": "English title"
  },
  "description": {
    "ar": "الوصف بالعربية",
    "en": "English description"
  }
}`;
  }
}

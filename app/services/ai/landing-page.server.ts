/**
 * Landing Page Content Generator
 * Uses Gemini to generate marketing content for product landing pages
 * Outputs structured JSON that fills a fixed React template
 */

import type { LandingPageContent } from "./types";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

interface ProductData {
  titleEn?: string | null;
  titleAr?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  price: number | string;
  currency: string;
  images: string[];
  metadata?: {
    brand?: string;
    reviewSummary?: { rating: number; count: number };
    highlights?: string[];
  } | null;
}

/**
 * Generate landing page content for a product
 */
export async function generateLandingPageContent(
  product: ProductData,
  lang: "ar" | "en"
): Promise<LandingPageContent> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const prompt = buildLandingPagePrompt(product, lang);

  console.log(`[LandingPage] Generating ${lang} content for: "${(product.titleEn || product.titleAr)?.slice(0, 40)}..."`);

  const response = await fetch(
    `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
          maxOutputTokens: 8192, // Landing page content is larger
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error(`[LandingPage] API error: ${error}`);
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No response from Gemini");
  }

  try {
    const parsed = JSON.parse(text);

    // Add metadata
    const content: LandingPageContent = {
      ...parsed,
      generatedAt: new Date().toISOString(),
      lang,
    };

    console.log(`[LandingPage] Successfully generated ${lang} landing page content`);

    return content;
  } catch (parseError) {
    console.error(`[LandingPage] Failed to parse response: ${text.slice(0, 500)}...`);
    throw new Error("Failed to parse landing page content as JSON");
  }
}

function buildLandingPagePrompt(product: ProductData, lang: "ar" | "en"): string {
  const title = lang === "ar" ? (product.titleAr || product.titleEn) : (product.titleEn || product.titleAr);
  const description = lang === "ar" ? (product.descriptionAr || product.descriptionEn) : (product.descriptionEn || product.descriptionAr);
  const price = typeof product.price === "string" ? parseFloat(product.price) : product.price;

  const langInstructions = lang === "ar"
    ? `Write ALL content in KSA-style Arabic (العربية السعودية).

## KSA Arabic Style Guidelines

### Language Style:
- Use Modern Standard Arabic (الفصحى) with a Gulf Arabic touch
- Be professional yet warm - Saudis appreciate quality and trust
- Be confident and direct - avoid overly flowery language
- Right-to-left text direction

### Vocabulary Preferences (USE THESE TERMS):
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
- "اطلب الآن" for order now
- "عرض محدود" for limited offer

### Cultural Considerations:
- Reference fast delivery within KSA (1-3 days)
- Mention secure payment and trusted shopping
- Quality assurance and authenticity are very important
- Warranty and return policies build trust

CRITICAL: Do NOT transliterate English words. Transform the message for Saudi buyers. Make it sound native, not translated.`
    : `Write ALL content in English. Use natural, compelling American English marketing language.`;

  // Language-specific examples for the JSON schema
  const examples = lang === "ar" ? {
    hero: {
      headline: "صوت احترافي لمحتواك",
      subheadline: "جودة ممتازة بأفضل سعر",
      badges: ["شحن مجاني", "ضمان سنة", "أصلي 100%"],
      trustSignals: ["أكثر من 5000 عميل راضي في السعودية"]
    },
    cta: {
      headline: "عرض محدود",
      description: "اطلب الآن واحصل على شحن مجاني داخل المملكة",
      buttonText: "اطلب الآن"
    },
    features: {
      title: "لماذا تختار هذا المنتج؟",
      description: "فقرة قصيرة عن فوائد المنتج...",
      highlights: [
        { icon: "star", title: "جودة ممتازة", description: "صُنع من أفضل الخامات" },
        { icon: "shield", title: "ضمان شامل", description: "ضمان لمدة سنة كاملة" },
        { icon: "zap", title: "أداء قوي", description: "نتائج مبهرة من أول استخدام" }
      ]
    },
    socialProof: {
      title: "ماذا يقول عملاؤنا",
      stats: [
        { value: "92%", label: "رضا العملاء" },
        { value: "87%", label: "يوصون به" },
        { value: "4.8", label: "متوسط التقييم" }
      ]
    },
    benefits: [
      { icon: "truck", title: "توصيل سريع", description: "يصلك خلال 1-3 أيام" },
      { icon: "headset", title: "خدمة عملاء", description: "متواجدون لمساعدتك" },
      { icon: "award", title: "جودة عالية", description: "منتج أصلي ومضمون" },
      { icon: "refresh", title: "استرجاع سهل", description: "ضمان 30 يوم" }
    ],
    comparison: {
      title: "ما يميزنا عن غيرنا",
      description: "قارن بنفسك واكتشف الفرق",
      features: [
        { name: "خامات ممتازة", us: true, others: false },
        { name: "شحن مجاني", us: true, others: false },
        { name: "ضمان سنة", us: true, others: true },
        { name: "خدمة عملاء 24/7", us: true, others: false }
      ]
    },
    faq: [
      { question: "كم يستغرق التوصيل؟", answer: "يصلك طلبك خلال 1-3 أيام عمل داخل المملكة." },
      { question: "هل المنتج أصلي؟", answer: "نعم، جميع منتجاتنا أصلية 100% ومضمونة." },
      { question: "ما هي سياسة الاسترجاع؟", answer: "يمكنك استرجاع المنتج خلال 30 يوم من الاستلام." },
      { question: "هل يوجد الدفع عند الاستلام؟", answer: "نعم، نوفر خيار الدفع عند الاستلام." }
    ]
  } : {
    hero: {
      headline: "Professional Sound for Creators",
      subheadline: "Studio quality at an affordable price",
      badges: ["Free Shipping", "1 Year Warranty"],
      trustSignals: ["5000+ Happy Customers"]
    },
    cta: {
      headline: "Limited Time Offer",
      description: "Order now and get free shipping",
      buttonText: "Order Now"
    },
    features: {
      title: "Why Choose This Product",
      description: "Brief intro paragraph about the product benefits...",
      highlights: [
        { icon: "star", title: "Feature 1", description: "Benefit description" },
        { icon: "shield", title: "Feature 2", description: "Benefit description" },
        { icon: "zap", title: "Feature 3", description: "Benefit description" }
      ]
    },
    socialProof: {
      title: "What Our Customers Say",
      stats: [
        { value: "92%", label: "Customer Satisfaction" },
        { value: "87%", label: "Would Recommend" },
        { value: "4.8", label: "Average Rating" }
      ]
    },
    benefits: [
      { icon: "truck", title: "Fast Shipping", description: "Delivered to your door" },
      { icon: "headset", title: "24/7 Support", description: "Always here to help" },
      { icon: "award", title: "Premium Quality", description: "Built to last" },
      { icon: "refresh", title: "Easy Returns", description: "30-day guarantee" }
    ],
    comparison: {
      title: "Why We're Different",
      description: "See how we compare to the competition",
      features: [
        { name: "Premium Materials", us: true, others: false },
        { name: "Free Shipping", us: true, others: false },
        { name: "1 Year Warranty", us: true, others: true },
        { name: "24/7 Support", us: true, others: false }
      ]
    },
    faq: [
      { question: "Question 1?", answer: "Detailed answer..." },
      { question: "Question 2?", answer: "Detailed answer..." },
      { question: "Question 3?", answer: "Detailed answer..." },
      { question: "Question 4?", answer: "Detailed answer..." }
    ]
  };

  return `You are an expert e-commerce landing page copywriter. Generate compelling marketing content for a product landing page.

## Language
${langInstructions}

## Product Information
- Title: ${title}
- Price: ${price} ${product.currency}
- Description: ${description || "(No description - generate based on title)"}
${product.metadata?.brand ? `- Brand: ${product.metadata.brand}` : ""}
${product.metadata?.reviewSummary ? `- Reviews: ${product.metadata.reviewSummary.rating}/5 (${product.metadata.reviewSummary.count} reviews)` : ""}
${product.metadata?.highlights?.length ? `- Key Features: ${product.metadata.highlights.join(", ")}` : ""}

## Your Task
Generate a complete landing page content JSON that will be rendered by a fixed template. Focus on SELLING, not just describing.

## Output JSON Schema (fill in ALL fields)

{
  "hero": ${JSON.stringify(examples.hero, null, 2).split('\n').join('\n  ')},
  "features": ${JSON.stringify(examples.features, null, 2).split('\n').join('\n  ')},
  "cta": ${JSON.stringify(examples.cta, null, 2).split('\n').join('\n  ')},
  "socialProof": ${JSON.stringify(examples.socialProof, null, 2).split('\n').join('\n  ')},
  "benefits": ${JSON.stringify(examples.benefits, null, 2).split('\n').join('\n  ')},
  "comparison": ${JSON.stringify(examples.comparison, null, 2).split('\n').join('\n  ')},
  "faq": ${JSON.stringify(examples.faq, null, 2).split('\n').join('\n  ')}
}

## Guidelines
1. **Hero**: Lead with the main BENEFIT. Badges should be trust builders (shipping, warranty, etc.)
2. **Features**: Use icons from: mic, headphones, shield, zap, star, check. Transform specs into buyer benefits.
3. **CTA**: Create urgency. Make the button text action-oriented.
4. **Social Proof**: Use realistic but compelling percentages.
5. **Benefits**: Icons must be: truck, headset, award, refresh. Keep text concise.
6. **Comparison**: Show 4-5 features where "we" win. Be realistic (some competitors may have some features).
7. **FAQ**: Address common objections and questions buyers would have.

Return ONLY valid JSON matching the schema above. Do not include markdown code blocks.`;
}

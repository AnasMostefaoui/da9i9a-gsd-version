# Phase 2: Product Scraping - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Reliable product data extraction from AliExpress and Amazon URLs. This phase delivers:
- URL validation and platform detection
- Product data scraping via SaaS APIs
- Data validation and quality checks
- Fallback to AI-from-image when text scraping fails
- Scraper abstraction layer for provider swapping

Creating products in Salla, AI content generation, and image enhancement are separate phases.

</domain>

<critical_constraint>
## MVP Philosophy (inherited from Phase 1)

- **Ship fast, iterate later**
- **Target scale:** 1000-5000 paying users
- **Budget:** $200/month total — scraping costs passed to merchant via subscription tiers
- **Don't over-engineer** — simple solutions over elegant ones

</critical_constraint>

<decisions>
## Implementation Decisions

### Provider Strategy

**Multi-provider approach with fallbacks:**

| Platform | Primary Provider | Fallback Provider |
|----------|------------------|-------------------|
| **Amazon** | Scrapingdog ($0.0002/req, 100% success, 3.5s) | ScraperAPI |
| **AliExpress** | ScraperAPI ($0.00245/req, handles JS-heavy pages) | Oxylabs |

**Rationale:** Best tool for each platform. Primary optimized for cost/reliability, fallback ensures resilience.

### Data Requirements

**Essential (must have or job fails with warning):**
- Title
- Images (minimum 1 required)
- Price
- Description

**Nice-to-have (extract if available):**
- Variants (size, color, material)
- Reviews summary

### Validation Rules

- **Missing essential field:** Warn and continue (don't block import)
- **No images:** Fail the job (minimum 1 image required)
- **Partial data:** Import with warnings, let user fix manually
- **Invalid URL:** Reject immediately with clear error message

### AI-from-Image Fallback

**When scraping gets images but no text:**
1. Send product image to Gemini Vision
2. AI analyzes product visually
3. Generates title + description from image analysis

**User controls:**
- Available as explicit option ("Generate from image")
- Can use even when scraped text exists
- User chooses between scraped text vs AI-generated

### URL Handling

- **Strict pattern matching** — only accept known AliExpress/Amazon URL formats
- **Early rejection** — invalid URLs fail fast with clear feedback
- **Platform detection** — determine provider from URL pattern

### Caching Strategy

- **User choice** in UI: "Use cached" vs "Refresh"
- Cache scraped data for cost savings
- Show cache timestamp so user knows data age

### Retry Logic

**Claude's discretion** — will implement based on cost/reliability tradeoff:
- Likely: Retry primary 2-3x with backoff
- Then: Switch to fallback provider
- Finally: Fail with clear error if both providers fail

### Abstraction Layer

**Claude's discretion** — will implement appropriate pattern:
- Interface defines: `scrape(url) → ProductData`
- Adapters for each provider
- Factory or strategy pattern for provider selection
- Easy to add new providers later

### Cost Management

- **Costs passed to merchant** via subscription tiers
- Track scraping costs per merchant
- Subscription tier determines monthly product limit
- Monitor total platform costs for budget health

### Error Messages

**Technical/precise style** (consistent with Phase 1):
- "Scraping failed: AliExpress returned 403 Forbidden"
- "Product not found at URL"
- "Rate limit exceeded, retry in 60 seconds"

</decisions>

<specifics>
## Specific Ideas

- **Resilience is key:** "This is the ground that will hold us or break us"
- Even partial scrape success should produce usable output
- AI-from-image ensures we can always generate content if we have at least one image
- User emphasized multi-provider approach for reliability

## Provider Research Summary

| Provider | Amazon | AliExpress | Cost/Request | Success | Speed |
|----------|--------|------------|--------------|---------|-------|
| Scrapingdog | ✓ 100% | ❓ | $0.0002 | 100% | 3.5s |
| ScraperAPI | ✓ 99% | ✓ | $0.00245 | 93% | 9.6s |
| Oxylabs | ✓ | ✓ | $0.00135 | 92% | 17.5s |
| Apify | ✓ | ✓ | ~$0.007 | Good | Medium |
| ScrapingBee | ✓ | ✓ | Varies | 93% | 11.7s |

**Sources:**
- [Scrapingdog benchmarks](https://www.scrapingdog.com/blog/best-amazon-scraping-apis/)
- [ScraperAPI AliExpress](https://www.scraperapi.com/solutions/aliexpress-scraper/)
- [Oxylabs AliExpress API](https://oxylabs.io/products/scraper-api/ecommerce/aliexpress)
- [Apify Amazon Scraper](https://apify.com/junglee/amazon-crawler)

</specifics>

<deferred>
## Deferred Ideas

- **Future platforms:** Temu, Shein, 1688 — add when demand proven
- **Data quality scoring:** Detect spam/fake listings — future enhancement
- **Bulk import:** Multiple URLs at once — v2 feature
- **Scheduled re-scraping:** Price monitoring — different product

</deferred>

---

*Phase: 02-product-scraping*
*Context gathered: 2026-01-22*

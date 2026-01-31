# Phase 2: Product Scraping - Context

**Gathered:** 2026-01-22
**Updated:** 2026-01-31 (aligned with actual implementation)
**Status:** Partially implemented, gaps identified

<domain>
## Phase Boundary

Reliable product data extraction from AliExpress and Amazon URLs. This phase delivers:
- URL validation and platform detection
- Product data scraping via SaaS APIs
- Data validation and quality checks
- Fallback to AI-from-image when text scraping fails
- Scraper abstraction layer for provider swapping
- Async scraping via Inngest for reliability

Creating products in Salla, AI content generation, and image enhancement are separate phases.

</domain>

<implementation_status>
## What's Already Built

### Complete (Production-Ready)

| Component | Location | Status |
|-----------|----------|--------|
| **Apify provider** | `app/services/scraping/apify.server.ts` | ✓ Complete |
| **Oxylabs provider** | `app/services/scraping/oxylabs.server.ts` | ✓ Complete |
| **Orchestrator** | `app/services/scraping/orchestrator.server.ts` | ✓ Complete |
| **URL validation** | `app/services/scraping/types.ts` | ✓ Complete |
| **Import route** | `app/routes/import.tsx` | ✓ Complete |
| **Caching** | `.cache/apify/` with 30-min TTL | ✓ Complete |
| **Database storage** | Product model with metadata JSON | ✓ Complete |

### Provider Chains (Actual Implementation)

| Platform | Primary | Fallback |
|----------|---------|----------|
| **AliExpress** | Apify | Oxylabs |
| **Amazon** | Oxylabs | Apify |

### Gaps to Close

| Gap | Priority | Reason |
|-----|----------|--------|
| **Inngest async scraping** | HIGH | Long-running scrapes block UI, no retries |
| **Cost tracking** | MEDIUM | Can't enforce subscription limits |
| **AI-from-image fallback** | MEDIUM | When scraping fails but has images |

</implementation_status>

<decisions>
## Implementation Decisions

### Provider Strategy (LOCKED - already implemented)

- **Apify** as primary for AliExpress (handles JS-heavy pages well)
- **Oxylabs** as primary for Amazon (structured data API)
- Automatic fallback to secondary provider on failure
- ScraperAPI deprecated, kept as emergency fallback

### Data Requirements (LOCKED - already implemented)

**Essential (must have or job fails):**
- Title
- Images (minimum 1 required)
- Price

**Nice-to-have (extracted when available):**
- Description
- Variants (size, color, material)
- Reviews summary
- Seller info
- Specifications

### Validation Rules (LOCKED - already implemented)

- **No images:** Fail the job
- **No title:** Fail the job
- **No price:** Fail the job
- **Missing description:** Warn and continue
- **Invalid URL:** Reject immediately

### Inngest Integration (TO IMPLEMENT)

- Use `product/scrape.requested` event (type already defined)
- Queue scraping job when user submits URL
- Return job ID immediately, poll for status
- Retry on provider failures (exponential backoff)
- Store result in database when complete

### AI-from-Image Fallback (TO IMPLEMENT)

**When scraping gets images but no text:**
1. Send product image to Gemini Vision
2. AI analyzes product visually
3. Generates title + description from image analysis

**Trigger:** Only when primary AND fallback providers fail to get text

### Cost Tracking (TO IMPLEMENT)

- Track scraping cost per merchant
- Store provider + cost in Product metadata
- Aggregate for subscription tier enforcement (Phase 5)

</decisions>

<specifics>
## Specific Ideas

- **Resilience is key:** Even partial scrape success should produce usable output
- AI-from-image ensures content generation if we have at least one image
- Current caching (30-min TTL) reduces costs for repeated URLs

## Environment Variables

```bash
# Primary providers (required)
APIFY_TOKEN=                          # Apify API token
OXYLABS_USERNAME=                     # Oxylabs credentials
OXYLABS_PASSWORD=

# Optional overrides
APIFY_ACTOR_ALIEXPRESS=apify/e-commerce-scraping-tool
APIFY_ACTOR_AMAZON=junglee/amazon-crawler

# Legacy (deprecated)
SCRAPERAPI_KEY=                       # Emergency fallback only
```

</specifics>

<deferred>
## Deferred Ideas

- **Future platforms:** Temu, Shein, 1688 — add when demand proven
- **Bulk import:** Multiple URLs at once — v2 feature
- **Price monitoring:** Scheduled re-scraping — different product
- **Provider config UI:** Let merchants choose preferred provider

</deferred>

---

*Phase: 02-product-scraping*
*Context gathered: 2026-01-22*
*Updated: 2026-01-31*

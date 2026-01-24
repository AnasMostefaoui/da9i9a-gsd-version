# E-Commerce Scraping Providers Comparison

> **Purpose**: Select the best provider(s) for structured product data extraction from AliExpress and Amazon for Salla Da9i9a dropshipping tool.

## TL;DR Recommendation

| Platform | Primary Choice | Backup Choice |
|----------|---------------|---------------|
| **Amazon** | Rainforest API ($15/mo) | Oxylabs ($1.35/1K) |
| **AliExpress** | Apify Actors (pay-per-use) | Oxylabs ($1.35/1K) |
| **Both (unified)** | Oxylabs E-Commerce API | Zyte API |

---

## Provider Comparison Matrix

### Tier 1: Enterprise-Grade (High Accuracy)

| Provider | Platforms | Success Rate | Response Time | Pricing | Structured Data |
|----------|-----------|--------------|---------------|---------|-----------------|
| **[Oxylabs](https://oxylabs.io/products/scraper-api/ecommerce)** | Amazon, AliExpress, eBay, Walmart | **98.50%** | 5.38s | $1.35/1K requests | Yes (JSON) |
| **[Bright Data](https://brightdata.com/products/web-scraper/ecommerce)** | Amazon, AliExpress, 120+ sites | **97.90%** | 9.0s | $0.90-1.50/1K requests | Yes (JSON/CSV) |
| **[Zyte](https://www.zyte.com/zyte-api/)** | Amazon, AliExpress, any site | **98.38%** | **6.61s** (fastest) | $0.13/1K + extraction | Yes (AI-powered) |

### Tier 2: Specialized APIs

| Provider | Platforms | Success Rate | Pricing | Notes |
|----------|-----------|--------------|---------|-------|
| **[Rainforest API](https://trajectdata.com/ecommerce/rainforest-api/)** | Amazon only | **99.9%** | $15/mo (1K requests) | Best for Amazon-focused apps |
| **[Apify](https://apify.com/store?category=ecommerce)** | Amazon, AliExpress via Actors | Varies by Actor | $39/mo + compute | Flexible, many pre-built scrapers |
| **[BUYFROMLO](https://www.buyfromlo.com/apis/aliexpress-product-scraper-api)** | AliExpress only | N/A | $9/mo (500 requests) | Cheapest AliExpress option |

### Tier 3: General Scrapers (Require Parsing)

| Provider | Type | Pricing | Notes |
|----------|------|---------|-------|
| **[ScraperAPI](https://www.scraperapi.com/)** | Proxy/HTML | $49/mo (100K) | Returns raw HTML - NOT recommended |
| **[ScrapingBee](https://www.scrapingbee.com/)** | Proxy/HTML | $49/mo | Has some structured scrapers |
| **[ZenRows](https://www.zenrows.com/)** | Proxy/HTML | Pay-as-you-go | AI extraction available |

---

## Detailed Provider Analysis

### 1. Oxylabs E-Commerce Scraper API

**Best for**: Unified solution for both Amazon and AliExpress

- **Website**: https://oxylabs.io/products/scraper-api/ecommerce
- **Success Rate**: 98.50% (highest reliability in benchmarks)
- **Response Time**: 5.38s average
- **Pricing**: $1.35/1,000 requests (drops to $1.25 at volume)
- **Free Trial**: 1 week, 5,000 requests

**Structured Data Fields**:
```json
{
  "title": "Product Title",
  "price": 29.99,
  "currency": "USD",
  "description": "Full product description",
  "images": ["url1", "url2"],
  "rating": 4.5,
  "reviews_count": 1234,
  "seller": "Seller Name",
  "availability": "In Stock",
  "specifications": {...}
}
```

**Pros**:
- Single API for both platforms
- OxyCopilot AI auto-parses data
- 99.99% uptime guarantee
- Custom parser support

**Cons**:
- Higher starting price than budget options
- Enterprise-focused

---

### 2. Bright Data E-Commerce Scraper

**Best for**: Large-scale operations, 600+ data fields

- **Website**: https://brightdata.com/products/web-scraper/ecommerce
- **Success Rate**: 97.90%
- **Response Time**: 9.0s average
- **Pricing**: $0.90/1,000 requests (fixed rate)
- **Free Trial**: Available

**Key Features**:
- 600+ data fields per product (industry avg: 350)
- Bulk operations up to 5,000 URLs
- Pre-built datasets available
- 72 million residential IPs

**Pros**:
- Most comprehensive data extraction
- Predictable pricing
- Market leader

**Cons**:
- Complex pricing tiers
- Can have hidden costs
- Slower response time

---

### 3. Zyte API (formerly Scrapy Cloud)

**Best for**: Speed and cost-efficiency

- **Website**: https://www.zyte.com/zyte-api/
- **Success Rate**: 98.38%
- **Response Time**: 6.61s (fastest in benchmarks)
- **Pricing**:
  - HTTP requests: $0.13/1,000
  - Automatic extraction: $0.0004-$0.0016 per field
- **Free Trial**: $5 credit

**Key Features**:
- AI-powered automatic extraction
- Best value per dollar
- Integrated with Scrapy framework
- 99.99% accuracy claim

**Pros**:
- Fastest response time
- Most cost-effective at scale
- Python/Scrapy integration

**Cons**:
- Pricing can be complex
- AI extraction accuracy varies by site

---

### 4. Rainforest API

**Best for**: Amazon-only applications

- **Website**: https://trajectdata.com/ecommerce/rainforest-api/
- **Success Rate**: 99.9%
- **Pricing**: $15/month for 1,000 requests
- **Free Trial**: Available

**Structured Data Fields**:
- Product title, description, bullets
- Price, deals, Buy Box winner
- Images, variations, attributes
- Reviews, ratings, Q&A
- Seller details, shipping

**Pros**:
- Highest accuracy for Amazon
- Simple, predictable pricing
- Excellent documentation
- Real-time data

**Cons**:
- Amazon only (no AliExpress)
- Limited requests at base tier

---

### 5. Apify

**Best for**: Flexibility and customization

- **Website**: https://apify.com/store?category=ecommerce
- **Pricing**:
  - Free: $5/month credit
  - Starter: $39/month
  - Scale: $199/month
  - Business: $999/month
- **Compute Units**: $0.25-$0.40/CU depending on plan

**Key Amazon Actors**:
- [Amazon Product Scraper](https://apify.com/junglee/amazon-crawler) - Full product data
- [Amazon Reviews Scraper](https://apify.com/neatrat/amazon-reviews-scraper) - Reviews extraction
- [Free Amazon Scraper](https://apify.com/junglee/free-amazon-product-scraper) - Basic data

**Key AliExpress Actors**:
- Various community actors available
- E-commerce scraping tool (unified)

**Structured Data**:
```json
{
  "title": "Product Title",
  "price": {"value": 29.99, "currency": "USD"},
  "images": ["url1", "url2"],
  "rating": {"score": 4.5, "count": 1234},
  "description": "Full description",
  "specifications": [...],
  "seller": {...}
}
```

**Pros**:
- Huge marketplace of pre-built scrapers
- Pay-per-use model
- Integrations (Zapier, Google Sheets, etc.)
- Can build custom actors

**Cons**:
- Quality varies by actor
- Compute unit pricing can be unpredictable
- Learning curve

---

### 6. BUYFROMLO

**Best for**: Budget AliExpress scraping

- **Website**: https://www.buyfromlo.com/apis/aliexpress-product-scraper-api
- **Pricing**: $9/month (500 requests)
- **Free Tier**: Available with limits

**Data Fields**:
- Product ID, title, description
- Min/max pricing
- Shipping costs
- Images, links
- Review metrics
- MOQ (Minimum Order Quantity)

**Limits**:
- 50 products per request
- 500 requests/month
- 5 requests/minute

**Pros**:
- Cheapest AliExpress option
- Simple API
- Good for MVPs

**Cons**:
- AliExpress only
- Limited volume
- Less comprehensive data

---

## Benchmarks Summary (2025)

Source: [AIMultiple E-Commerce Scraper Benchmarks](https://research.aimultiple.com/ecommerce-scraper/)

| Provider | Success Rate | Avg Response | Price/1K | Best Value |
|----------|-------------|--------------|----------|------------|
| Oxylabs | 98.50% | 5.38s | $1.35 | Reliability |
| Zyte | 98.38% | 6.61s | $0.13+ | Speed |
| Bright Data | 97.90% | 9.0s | $0.90 | Data depth |
| ZenRows | 92.64% | 10.0s | Varies | Budget |
| ScrapingBee | 92.69% | 11.7s | $49/mo | Simplicity |

---

## Recommendation for Salla Da9i9a

### MVP Phase (Current)

**Option A: Separate Providers**
- Amazon: **Rainforest API** ($15/mo) - 99.9% accuracy, simple
- AliExpress: **BUYFROMLO** ($9/mo) - Cheap, structured
- **Total**: ~$24/month

**Option B: Unified Provider**
- Both: **Oxylabs** ($1.35/1K) - Single integration, high accuracy
- **Estimated**: ~$15-30/month depending on volume

**Option C: Flexible**
- Both: **Apify** ($39/mo) - Use existing actors, customize as needed
- **Estimated**: ~$39-60/month

### Scale Phase (Future)

As volume increases, switch to:
- **Zyte** for cost efficiency at scale
- **Bright Data** for enterprise features and data depth

---

## Integration Notes

### API Response Format Goal

All providers should normalize to this format for our app:

```typescript
interface ScrapedProduct {
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  sourceUrl: string;
  platform: "amazon" | "aliexpress";

  // Optional enriched data
  rating?: number;
  reviewCount?: number;
  seller?: string;
  shipping?: string;
  specifications?: Record<string, string>;
}
```

### Provider Abstraction

Create provider interface to swap implementations:

```typescript
interface ScraperProvider {
  name: string;
  supportedPlatforms: Platform[];
  scrapeProduct(url: string): Promise<ScrapedProduct>;
}
```

---

## Legal Considerations

- AliExpress scraping is against their ToS
- Amazon has restrictions on automated access
- Use APIs that handle compliance (Oxylabs, Bright Data claim legal compliance)
- Consider rate limiting and respectful scraping practices

---

## Next Steps

1. [ ] Choose provider(s) for MVP
2. [ ] Sign up for free trials
3. [ ] Implement new scraping service
4. [ ] Test with real URLs
5. [ ] Monitor accuracy and adjust

---

## Sources

- [AIMultiple E-Commerce Scraper Benchmarks](https://research.aimultiple.com/ecommerce-scraper/)
- [Oxylabs E-Commerce API](https://oxylabs.io/products/scraper-api/ecommerce)
- [Bright Data Web Scraper](https://brightdata.com/products/web-scraper)
- [Zyte API Pricing](https://docs.zyte.com/zyte-api/pricing.html)
- [Rainforest API](https://trajectdata.com/ecommerce/rainforest-api/)
- [Apify Pricing](https://apify.com/pricing)
- [BUYFROMLO API](https://www.buyfromlo.com/apis/aliexpress-product-scraper-api)
- [Apify Amazon Actors](https://apify.com/store?category=ecommerce)

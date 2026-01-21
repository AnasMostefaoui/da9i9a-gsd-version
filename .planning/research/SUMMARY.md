# Research Summary: AI-Powered Salla Dropshipping Store Builder

**Project:** AI Store Builder for Salla Merchants (MENA Region)
**Researched:** 2026-01-21
**Budget:** $200/month
**Developer:** Solo with AI assistance
**Target Users:** Beginners in dropshipping

---

## Project Overview

This project is an AI-powered store builder that enables Salla merchants to launch dropshipping stores by simply pasting a product link. The system scrapes product data from AliExpress/Amazon, uses AI to generate Arabic and English content, enhances product images, and deploys a complete store to Salla via their API. The target market is MENA region merchants (primarily Saudi Arabia, UAE), where 60%+ of transactions use Cash-on-Delivery and Arabic/RTL support is non-negotiable.

The technical approach combines Next.js 15 full-stack architecture, PostgreSQL database, OpenAI GPT-4o mini for content generation, and event-driven job queues (BullMQ + Redis) for async processing. The business model is subscription-based via Lemon Squeezy, distributed through Salla App Store.

---

## Key Findings

### Stack

**Core Technology Decisions:**
- **Next.js 15 + TypeScript:** Full-stack framework with App Router, Server Actions, and built-in API routes. Official Salla SDK supports Node.js, making this the natural choice. ($20/month Vercel Pro)
- **PostgreSQL + Neon:** Serverless Postgres with free tier (0.5GB, 100 CU-hours/month). ACID compliance critical for subscription billing and merchant data. Prisma ORM for rapid development.
- **OpenAI GPT-4o mini:** $0.15/M input tokens, $0.60/M output tokens—60% cheaper than GPT-3.5 Turbo. Sufficient quality for e-commerce descriptions. (~$5-10/month for 500 products)
- **ScrapingBee:** $49/month for 1000 credits with JS rendering. Handles anti-bot measures for AliExpress/Amazon scraping legally.
- **Lemon Squeezy:** 5% + $0.50 per transaction. Merchant of Record handles all tax compliance—critical for MENA region sales.
- **Auth.js v5:** Free authentication (vs Clerk $25/month). NextAuth successor optimized for Next.js 15.
- **Salla Integration:** OAuth 2.0 with 14-day access tokens, 1-month refresh tokens. Merchant API v2 for store management.

**Total estimated monthly cost:** $94-119 (well within $200 budget with buffer for overages)

**Critical Version Requirements:**
- Next.js 15.x with React 19
- Node.js 20.x LTS (required for Salla SDK)
- Salla @salla.sa/passport-strategy 1.0.9+

**Confidence:** HIGH (verified with official documentation from all platforms)

---

### Features

**Table Stakes (Must-Have for v1):**
1. **AI Store Generation from Product Link** - Core value proposition. Users expect store in under 2 minutes.
2. **Arabic Language & RTL Support** - 80% of successful Saudi stores require this. Not optional.
3. **Mobile-Optimized Design** - 70%+ of MENA traffic is mobile. Sub-3-second load time mandatory.
4. **Cash-on-Delivery Integration** - 60% of MENA transactions. Must be enabled by default.
5. **Product Import & Catalog Management** - One-click import from AliExpress, Amazon, local suppliers.
6. **Conversion-Optimized Themes** - Pre-built RTL-ready themes with trust signals.
7. **Basic SEO Setup** - Auto-generated meta tags in Arabic + English, schema markup.
8. **Order Management Basics** - View orders, track status (leverages Salla's infrastructure).
9. **Payment Gateway Integration** - Mada, STC Pay, COD, Apple Pay (Salla handles processing).
10. **Basic Analytics Dashboard** - Sales, traffic, conversion rate, order count.

**Key Differentiators (v2+):**
- **AI Product Photo Generation** - Background removal, upscaling, lifestyle shots via Claid.ai
- **AI Landing Page Builder** - Generate campaign-specific pages for ads
- **Advanced Profit Analytics** - Track real profit including ad spend, fees, COD delivery ratios
- **Automated Order Fulfillment** - Zero-touch order processing with supplier integration
- **Pre-Built Niche Templates** - Industry-optimized templates (fashion, electronics, beauty)

**Anti-Features (Deliberately Avoid):**
- Native inventory management (dropshipping = no inventory)
- Built-in customer support ticketing (Salla handles this)
- Complex multi-user permissions (enterprise feature creep)
- Custom payment gateway development (PCI compliance nightmare)
- Cryptocurrency payments (minimal MENA demand, regulatory complexity)

**Confidence:** MEDIUM-HIGH (HelloAtlas and AutoDS set clear market expectations; MENA specifics verified but COD statistics vary by source)

---

### Architecture

**System Design:** Microservices architecture with event-driven job queue pattern.

**Core Components:**
1. **Salla App Core (Node.js + Express)** - OAuth flow, webhook handling, Salla API communication, job orchestration
2. **Job Queue (BullMQ + Redis)** - Async processing with 6 queue types (scrape, ai-content, ai-image, theme, landing, deploy)
3. **Scraping Service (Puppeteer + Proxies)** - Extract product data from AliExpress/Amazon with rate limiting
4. **AI Service (Node.js + OpenAI)** - Content generation (GPT-4o mini) and image enhancement (Claid.ai)
5. **Store Generator** - Theme configuration, landing page creation, Salla API deployment
6. **Billing Service (Stripe/Lemon Squeezy)** - Subscription management, usage tracking
7. **Data Layer (PostgreSQL)** - Merchants, jobs, stores, products, subscriptions

**Critical Flow:** User pastes product URL → Scraping Service extracts data → AI generates Arabic/English content → AI enhances 4 images → Store Generator creates theme + landing page → Deploy to Salla → Total time: 2-4 minutes

**Key Patterns:**
- **Microservices with Bounded Contexts** - Each service owns its domain
- **Event-Driven Architecture** - Services communicate via job queue, not direct calls
- **Saga Pattern** - Job chains with compensating actions for failures
- **Retry with Exponential Backoff** - Failed jobs retry with increasing delays
- **Circuit Breaker** - Stop calling failing external APIs after threshold
- **Idempotent Operations** - Repeated execution produces same result

**Salla Integration Points:**
- OAuth 2.0: 14-day access tokens, refresh token rotation (single-use, CRITICAL)
- Webhooks: Signature verification (SHA256), events for app.store.authorize, order.created
- Merchant API: Base URL https://api.salla.dev/admin/v2, rate limits by plan tier (120/min Plus, 360/min Pro, 720/min Special)
- Twilight Theme Engine: Twig templates, twilight.json config, Salla CLI deployment

**Confidence:** HIGH (official Salla documentation, proven microservices patterns, BullMQ verified as modern Node.js queue solution)

---

### Pitfalls

**Critical (Project-Ending Risks):**

1. **Refresh Token Reuse → Complete Auth Failure**
   - Salla uses single-use refresh tokens with rotation. Reusing invalidates ALL tokens.
   - Prevention: Implement mutex/locking for token refresh, serialize refresh requests via job queue
   - Phase: 1 (OAuth implementation)

2. **AI Token Cost Explosion**
   - GPT-4o costs can consume $200 budget in days without careful management
   - Prevention: Use GPT-4o mini (60-80% cost reduction), aggressive caching, batch processing, per-user quotas, real-time monitoring
   - Example: $100/month AI budget = ~100 full stores with optimization
   - Phase: 1 (MVP financial viability)

3. **Aggressive Scraping → IP Bans and Legal Liability**
   - AliExpress/Amazon employ anti-bot measures. Aggressive scraping = bans + lawsuits
   - Prevention: Rate limiting (1 req per 2-3 seconds), rotate IPs/proxies, respect robots.txt, single product scraping only
   - Alternative: Use ScrapingBee API ($49/month) to reduce liability
   - Phase: 1 (Core scraping)

4. **Salla Rate Limit Violations**
   - Rate limits by plan tier: 120/min (Plus), 360/min (Pro), 720/min (Special)
   - Prevention: Query merchant plan tier, dynamic rate limiting, request queuing, monitor X-RateLimit-Remaining header
   - Phase: 1 (API integration)

5. **Free Tier Production Downtime**
   - Supabase auto-pauses after 7 days inactivity, Vercel timeouts at 10 seconds
   - Prevention: Budget for paid tiers from day one (Supabase Pro $25, Vercel Pro $20)
   - Phase: 1 (Architecture decisions)

6. **Salla App Store Publishing Rejection**
   - Strict requirements: Arabic + English names, scope justification, professional assets
   - Prevention: Read publishing standards thoroughly, professional Arabic translation, test across plan tiers
   - Phase: 3 (Pre-launch)

**High-Impact Technical Pitfalls:**
- Poor image optimization (10+ second loads) → Use Cloudflare Images/Cloudinary, optimize to <200 KB WebP
- RTL treated as afterthought → Build RTL-first design system using logical CSS properties
- Inadequate OAuth security → Use proven libraries, implement PKCE, secure token storage
- Supplier inventory sync failures → Daily re-scraping, auto-disable unavailable products
- AI image copyright issues → Use licensed-data services or avoid AI image generation
- Webhook processing causing rate limit cascades → Extract data from webhook payload, async queue processing

**Business Pitfalls:**
- Unit economics blindness → Track cost per store from day one
- COD complexity → Educate merchants about 30-40% cancellation rates, support multiple payment methods
- Solo developer burnout → Time blocking, weekly sprints, launch fast and iterate
- Underestimating competition → Differentiate through Salla integration, MENA-specific features, beginner focus

**Confidence:** HIGH for critical technical pitfalls (verified with official docs and security standards), MEDIUM for business pitfalls (based on dropshipping failure statistics)

---

## Cross-Cutting Themes

### Theme 1: MENA Market Requirements Are Non-Negotiable

Arabic/RTL support, COD payment integration, mobile-first design, and cultural adaptation aren't "nice to have"—they're fundamental requirements for viability. Research shows 80% of successful Saudi stores have native Arabic support, 70%+ of traffic is mobile, and 60% of transactions use COD. Building LTR-first and adding RTL later breaks the experience.

**Implication:** Design and architecture decisions must be RTL-first, Arabic-native, mobile-first from day one.

### Theme 2: Cost Control is Architectural, Not Operational

AI token costs, scraping expenses, and infrastructure pricing can explode if not architected correctly from the start. Using GPT-4o instead of GPT-4o mini alone could consume the entire budget. Relying on free tiers causes production failures.

**Implication:** Budget allocation, cost monitoring, and service tier selection are Phase 1 architecture decisions, not Phase 3 optimizations.

### Theme 3: Salla Platform Integration Has Sharp Edges

OAuth refresh token rotation, rate limits by merchant plan tier, webhook signature validation, and App Store publishing standards all have specific gotchas that cause failures if not handled correctly. Salla's single-use refresh tokens are particularly dangerous—reuse invalidates all tokens.

**Implication:** Deep understanding of Salla's OAuth implementation, rate limiting, and publishing requirements is critical before coding.

### Theme 4: Beginner Users Need Guardrails, Not Features

Target users are dropshipping beginners. 75% abandon within first week without effective onboarding. They need "paste link → get store" simplicity, not feature dumps. COD complexity, inventory sync, and unit economics must be handled invisibly or explained clearly.

**Implication:** UX focus on single clear CTA, progressive disclosure, and contextual education over advanced feature exposure.

### Theme 5: Solo Developer Constraints Shape Everything

$200/month budget, solo development, and beginner target market create tight constraints. This eliminates options like enterprise features, premium AI models for all tasks, aggressive scraping infrastructure, and complex multi-service architectures.

**Implication:** Every technical decision must optimize for cost efficiency, development speed, and maintainability by a solo developer.

---

## Critical Decisions

### Decision 1: OpenAI GPT-4o mini vs GPT-4o vs Claude

**Options:**
- GPT-4o mini: $0.15/M input tokens, $0.60/M output tokens
- GPT-4o: $2.50/M input tokens, $10/M output tokens (16x more expensive)
- Claude Sonnet 4: $3/M input tokens, $15/M output tokens (25x more expensive)

**Recommendation:** GPT-4o mini for all product descriptions and SEO content. Reserve GPT-4o for complex landing page generation only.

**Rationale:** Budget constraint ($100/month AI budget) and sufficient quality for e-commerce content. Can process 500 products/month vs 30 with GPT-4o.

**Risk:** Lower content quality. Mitigation: Test quality with beta users, consider A/B testing upgrade path.

---

### Decision 2: Scraping Service vs Official APIs

**Options:**
- ScrapingBee API: $49/month, legal, handles anti-bot
- AliExpress Official API: Free, but requires affiliate approval and limited data access
- Custom scraping: $20/month proxies, but legal risk and maintenance burden

**Recommendation:** ScrapingBee for Phase 1, evaluate AliExpress API for Phase 2.

**Rationale:** Legal protection, no anti-bot maintenance, fits budget. Official APIs may have approval delays and data limitations.

**Risk:** Dependency on third-party service. Mitigation: Design abstraction layer for easy provider switching.

---

### Decision 3: Serverless (Vercel) vs Traditional Hosting (Railway/Render)

**Options:**
- Vercel Pro: $20/month, 60-second function timeouts, optimal Next.js DX
- Railway: $5/month + usage, longer timeouts, full control
- Self-hosted: $12-24/month VPS + DevOps time

**Recommendation:** Hybrid: Vercel Pro for frontend + short functions, Railway for background jobs (scraping, AI processing).

**Rationale:** Vercel's 60-second timeout insufficient for scraping (30-60 seconds) + AI processing (40-80 seconds). Railway handles long-running jobs cost-effectively.

**Risk:** Two platforms to manage. Mitigation: Clear separation of concerns, job queue handles communication.

---

### Decision 4: Free vs Paid Tier Database

**Options:**
- Neon Free: 0.5GB, 100 CU-hours/month (auto-pauses after 7 days inactivity - DEALBREAKER)
- Neon Scale: $19/month, 10GB, 300 CU-hours, no auto-pause
- Supabase Pro: $25/month, 8GB, no auto-pause

**Recommendation:** Start with Neon Scale ($19/month), not free tier.

**Rationale:** Free tier auto-pause causes production downtime. $19/month within budget and prevents critical failure.

**Risk:** Higher initial cost. Mitigation: Essential for reliability, prevents catastrophic downtime.

---

### Decision 5: Scope for MVP Launch

**Must-Have (Phase 1):**
- Product link input (AliExpress URL)
- AI content generation (Arabic + English descriptions)
- Single RTL-ready theme
- Store generation via Salla API
- Basic product import (1-10 products)
- Dashboard to view store
- Order visibility (read-only via Salla)

**Defer to Phase 2:**
- Multiple themes
- AI product photo enhancement
- Landing page builder
- Upsells/bundles
- Advanced analytics
- Automated fulfillment

**Recommendation:** Launch Phase 1 in 3 months, gather user feedback, iterate.

**Rationale:** Fast launch validates product-market fit before investing in advanced features.

---

## Recommended Build Order

### Phase 1: Foundation & MVP (Weeks 1-8)

**Goal:** Basic store generation working end-to-end

**Week 1-2: Infrastructure**
- Set up Salla Partners account, create app
- Implement OAuth 2.0 flow with refresh token mutex
- Set up PostgreSQL (Neon Scale $19/month)
- Create job queue infrastructure (BullMQ + Redis)
- Database schema (merchants, jobs, stores, products)

**Week 3-4: Scraping**
- Implement AliExpress scraper (ScrapingBee integration)
- Platform detection (URL regex)
- Error handling and retry logic
- Store scraped data in database

**Week 5-6: AI Content Generation**
- Integrate OpenAI GPT-4o mini API
- Create Arabic/English prompt templates
- Implement cost monitoring and per-user quotas
- Batch processing with caching

**Week 7-8: Store Generation & Deployment**
- Create single RTL-ready Twilight theme
- Implement Salla API product creation
- Theme activation and store settings
- End-to-end testing

**Deliverable:** User can paste AliExpress URL → get Salla store with 1 product in 2-4 minutes

**Dependencies:** None (greenfield)

**Research Needs:**
- Salla API testing in development environment (confirm rate limits, theme deployment)
- Arabic content quality testing with native speakers
- ScrapingBee credit consumption testing

---

### Phase 2: Conversion & Polish (Weeks 9-14)

**Goal:** Make stores convert better, improve UX

**Week 9-10: Image Optimization**
- Implement image processing pipeline (resize, WebP conversion)
- Integrate Cloudflare Images or Cloudinary
- AI image enhancement via Claid.ai (optional)

**Week 11-12: UX & Analytics**
- Beginner-friendly onboarding flow
- Progress tracking UI
- Basic analytics dashboard (sales, traffic, conversion)
- Mobile optimization and testing

**Week 13-14: Billing & Launch Prep**
- Integrate Lemon Squeezy subscriptions
- Usage tracking and limits enforcement
- Professional Arabic translation
- Salla App Store submission preparation

**Deliverable:** Polished product ready for public launch via Salla App Store

**Dependencies:** Phase 1 complete

**Research Needs:**
- Image processing cost comparison (Cloudflare vs Cloudinary vs self-hosted)
- Beta user testing for onboarding flow
- Competitor analysis in Salla App Store

---

### Phase 3: Automation & Scale (Months 4-6)

**Goal:** Reduce manual work, increase merchant success

**Month 4: Additional Features**
- Additional themes (3-5 niche-specific)
- Landing page builder with AI generation
- Upsells and bundles functionality

**Month 5: Automation**
- Automated order fulfillment
- Inventory sync system (daily re-scraping)
- Price monitoring and alerts

**Month 6: Advanced Analytics**
- Profit tracking with ad spend integration
- Supplier reliability scoring
- COD delivery ratio tracking

**Deliverable:** Mature product with automation and growth tools

**Dependencies:** Phase 2 complete, user feedback incorporated

**Research Needs:**
- Multi-supplier orchestration patterns
- Ad platform API integration (Meta, Google, Snapchat)
- Machine learning for supplier scoring (data collection strategy)

---

## Budget Allocation

### Monthly Operating Budget ($200)

```
Core Infrastructure:
- Vercel Pro (frontend hosting):        $20
- Railway (background jobs):            $20
- Neon Scale (database):                $19
- Redis (Upstash or Railway):           $10

APIs & Services:
- OpenAI API (AI content):              $40
- ScrapingBee (product scraping):       $49
- Cloudflare Images (CDN):              $5
- Claid.ai (image enhancement):         $20

Payment Processing:
- Lemon Squeezy: Variable (5% + $0.50 per transaction)

TOTAL FIXED:                            $183/month
BUFFER:                                 $17/month
```

### Cost Optimization Strategies

1. **AI Costs:**
   - Use GPT-4o mini (60% cheaper)
   - Batch API processing (50% savings)
   - Aggressive prompt caching
   - Per-user monthly quotas

2. **Scraping Costs:**
   - Cache scraped data 24 hours
   - Scrape on-demand only (not bulk)
   - Rate limit user requests

3. **Infrastructure:**
   - Image optimization reduces bandwidth
   - CDN reduces origin server load
   - Database connection pooling

4. **Scaling Threshold:**
   - 0-100 users: $183/month (current stack)
   - 100-500 users: Add $50/month (increased API usage)
   - 500+ users: Re-evaluate architecture, revenue covers costs

---

## Open Questions

### High Priority (Resolve in Phase 1)

1. **Salla API Capabilities:**
   - Can apps create stores programmatically? (Docs suggest yes, needs testing)
   - Theme installation via API or CLI only?
   - Exact rate limit behavior when exceeded (leaky bucket confirmed, but recovery time?)
   - **Action:** Create test Salla app, test API endpoints in development

2. **AI Token Cost Validation:**
   - Real cost per store generation with optimized prompts?
   - GPT-4o mini quality sufficient for Arabic product descriptions?
   - **Action:** Prototype generation with 20 sample products, measure token usage

3. **ScrapingBee Credit Consumption:**
   - Actual credits consumed per AliExpress product (JS rendering = 5x multiplier)?
   - Success rate for complex product pages?
   - **Action:** Test with 1000 free credits, measure consumption patterns

### Medium Priority (Resolve in Phase 2)

4. **Claid.ai Pricing:**
   - Current API pricing tiers (research showed product but not specific costs)?
   - Volume discounts available?
   - **Action:** Contact sales for API pricing sheet

5. **MENA Supplier Ecosystem:**
   - Which suppliers besides AliExpress serve MENA market?
   - DropX capabilities and API access?
   - Local wholesalers for faster shipping?
   - **Action:** Survey Salla App Store for existing supplier integrations

6. **Competitive Landscape:**
   - Does a Salla store builder already exist?
   - What features do top Salla apps have?
   - Pricing expectations in MENA market?
   - **Action:** Deep dive on Salla App Store, analyze top 20 apps

### Low Priority (Defer to Phase 3)

7. **AliExpress Official API:**
   - Approval process and timeline?
   - Data completeness vs scraping?
   - Cost structure?

8. **Multi-Supplier Orchestration:**
   - Best practices for routing orders to multiple suppliers?
   - Inventory sync across suppliers?

---

## Confidence Assessment

### Overall Research Confidence: HIGH (75-80%)

| Area | Confidence | Reasoning |
|------|------------|-----------|
| **Stack (Technology Selection)** | HIGH | Verified with official documentation from Next.js, Salla, OpenAI, Vercel, Neon. Pricing confirmed on official sites. |
| **Features (Market Requirements)** | MEDIUM-HIGH | HelloAtlas and AutoDS establish clear benchmarks. MENA-specific requirements verified across multiple sources, but COD statistics vary (60-70%). |
| **Architecture (System Design)** | HIGH | Official Salla docs detailed. BullMQ is proven modern queue solution. Microservices patterns well-documented. |
| **Pitfalls (Risk Assessment)** | HIGH | Critical technical pitfalls verified with official Salla OAuth docs, OpenAI pricing, scraping legal research. Business pitfalls based on dropshipping failure statistics. |

### Low Confidence Areas Requiring Validation

1. **Claid.ai Pricing:** Product confirmed but API pricing not on public site (MEDIUM confidence)
2. **Auth.js v5 Stability:** In beta/RC, stated as production-ready but not stable release (MEDIUM confidence)
3. **Salla Publishing Standards:** Official FAQ available but 2026-specific rejection patterns not fully documented (MEDIUM confidence)
4. **Competitive Analysis:** General SaaS dynamics understood, but Salla-specific competition not deeply researched (MEDIUM confidence)

### High Confidence Areas

- Salla OAuth implementation details and refresh token rotation
- OpenAI pricing and token economics
- Scraping legal boundaries and anti-bot measures
- MENA market payment preferences (COD, Mada, STC Pay)
- RTL/Arabic UX requirements
- PostgreSQL vs MongoDB for SaaS applications
- Next.js 15 capabilities and deployment options

---

## Ready for Roadmap Creation

### What the Roadmapper Should Know

1. **Phase Structure is Clear:**
   - Phase 1 (Weeks 1-8): Foundation & MVP
   - Phase 2 (Weeks 9-14): Polish & Launch
   - Phase 3 (Months 4-6): Automation & Scale

2. **Critical Path Dependencies:**
   - OAuth and job queue are foundational (everything depends on these)
   - Scraping → AI content → AI images → Store generation (sequential pipeline)
   - Billing can be developed in parallel during Phase 2

3. **Research Flags:**
   - Phase 1 needs Salla API testing (capabilities confirmation)
   - Phase 2 needs image processing cost comparison
   - Phase 3 needs multi-supplier orchestration research

4. **Budget Constraints:**
   - $200/month total
   - $183/month allocated to infrastructure and APIs
   - Every feature decision must consider operational cost

5. **Market Timing:**
   - Launch window: 3 months to beta
   - MENA e-commerce growing 24% annually
   - No dominant AI store builder for Salla yet
   - First-mover advantage window is open

6. **Success Metrics:**
   - Store generation < 2 minutes
   - < 5% error rate
   - Arabic content quality validated by native speakers
   - 50%+ trial-to-paid conversion
   - < $5 cost per store generated

### Risks to Flag in Roadmap

1. **Critical Technical Risks:**
   - Refresh token reuse (requires mutex implementation)
   - AI cost explosion (requires monitoring from day one)
   - Rate limit violations (requires plan tier awareness)

2. **Timeline Risks:**
   - Salla App Store approval can take 1-2 weeks
   - Beta testing may reveal Arabic content quality issues
   - Solo developer velocity may require timeline adjustment

3. **Market Risks:**
   - Competition may emerge during development
   - Salla platform changes could impact integration
   - MENA payment regulations could affect COD handling

---

## Sources

### Salla Platform
- [Salla Developer Documentation](https://docs.salla.dev/)
- [Salla OAuth 2.0 Guide](https://docs.salla.dev/421118m0)
- [Salla Merchant API v2](https://docs.salla.dev/admin/v2)
- [Salla Rate Limiting](https://docs.salla.dev/421125m0)
- [Salla Webhooks](https://docs.salla.dev/421119m0)
- [Salla Publishing Standards](https://salla.dev/blog/standards-salla-apps-publications/)

### Technology Stack
- [Next.js 15 Release](https://nextjs.org/blog/next-15)
- [OpenAI API Pricing 2026](https://openai.com/api/pricing/)
- [Neon vs Supabase Comparison](https://www.freetiers.com/blog/supabase-vs-neon-comparison)
- [BullMQ Documentation](https://bullmq.io/)
- [Lemon Squeezy vs Paddle vs Stripe](https://medium.com/@muhammadwaniai/stripe-vs-paddle-vs-lemon-squeezy-i-processed-10k-through-each-heres-what-actually-matters-27ef04e4cb43)

### Market Research
- [HelloAtlas (Reference Product)](https://helloatlas.io)
- [MENA E-commerce Trends 2025](https://www.wamda.com/2024/12/trends-define-mena-e-commerce-2025)
- [Dropshipping Statistics 2026](https://www.zikanalytics.com/blog/dropshipping-statistics/)
- [Shopify RTL Guide 2026](https://rtlmaster.com/shopify-for-arabic-stores-the-complete-guide-updated-2026/)

### Technical Patterns
- [Ecommerce Architecture 2026](https://www.bigcommerce.com/articles/ecommerce-website-development/ecommerce-architecture/)
- [Enterprise Web Scraping Architecture](https://affinco.com/enterprise-web-scraping/)
- [OAuth 2.0 Security Best Practices](https://www.apisec.ai/blog/oauth-2-0-common-security-flaws)

---

**Research Status:** COMPLETE

All four research dimensions synthesized. Ready for requirements definition and roadmap creation by gsd-roadmapper agent.

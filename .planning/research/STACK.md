# Technology Stack Research

**Project:** AI-Powered Salla Dropshipping Store Builder
**Researched:** 2026-01-21
**Budget Constraint:** $200/month
**Developer Profile:** Solo developer with AI assistance

---

## Executive Summary

For a Salla dropshipping app with AI capabilities under $200/month budget, the recommended stack is:
- **Framework:** Next.js 15 with App Router (full-stack TypeScript)
- **Database:** PostgreSQL with Neon (free tier)
- **AI:** OpenAI GPT-4o mini for content + Claid.ai for images
- **Scraping:** ScrapingBee API (budget-friendly)
- **Hosting:** Vercel Pro ($20/month) or Railway ($5-30/month)
- **Auth:** Auth.js v5 (NextAuth successor)
- **Payments:** Lemon Squeezy (simplest MoR, acquired by Stripe)

**Total estimated cost:** $70-150/month depending on usage.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Next.js** | 15.x | Full-stack framework | Official Salla SDK supports Node.js/Express; Next.js provides best-in-class DX for React with built-in API routes, Server Actions, and serverless deployment. App Router with Server Components reduces client-side JS and improves performance. |
| **TypeScript** | 5.x | Type safety | Essential for working with complex API integrations (Salla, OpenAI, scraping APIs). Catches errors at compile time. |
| **Node.js** | 20.x LTS | Runtime | Required for Salla's Express starter kit and Passport strategy. Next.js runs on Node.js. |
| **React** | 19.x | UI library | Next.js 15 ships with React 19. Modern concurrent features and Server Components. |

**Rationale:** Salla provides official Node.js/Express support via `@salla.sa/passport-strategy` and Express starter kit. Next.js 15 builds on this Node.js foundation while providing superior DX, built-in API routes via Server Actions, and excellent deployment options. The App Router's server-first approach aligns perfectly with AI content generation (happens server-side) and API integrations.

**Confidence:** HIGH (verified with Salla official GitHub repos and docs)

### Salla Integration

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **@salla.sa/passport-strategy** | 1.0.9+ | OAuth 2.0 authentication | Official Salla middleware for Passport.js. Handles merchant authorization flow. |
| **Salla Merchant API** | v2 | Store management | REST API for creating products, managing inventory, updating themes. Base URL: `https://api.salla.dev/admin/v2` |
| **Axios** | 1.x | HTTP client | For Salla API requests. Industry standard, better error handling than fetch for complex API work. |

**Implementation notes:**
- Salla uses OAuth 2.0 with 1-month refresh tokens
- Refresh token reuse invalidates access tokens (critical for parallel requests)
- Must store merchant tokens securely in database
- Authorization endpoint: `https://accounts.salla.sa/oauth2/auth`

**Confidence:** HIGH (verified with Salla official documentation and GitHub)

### Database & ORM

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **PostgreSQL** | 16.x | Primary database | ACID compliance for merchant data, subscriptions, and store configurations. Better for SaaS apps with complex queries and data integrity requirements. Superior to MongoDB for financial/subscription data. |
| **Neon** | Latest | Serverless Postgres | Free tier: 0.5GB storage, 100 CU-hours/month (enough for 400 hours of 0.25 CU compute). Auto-scaling, branches for dev/prod. No credit card required. Best free Postgres option in 2025. |
| **Prisma** | 6.x | ORM | Best TypeScript ORM for rapid development. Schema-first with excellent Next.js integration. Superior DX to Drizzle for solo developer. Type-safe queries, migrations, and Prisma Studio for DB inspection. |

**Why PostgreSQL over MongoDB:**
- Subscriptions and payments require ACID transactions
- Salla merchant data has structured relationships (stores → products → images)
- PostgreSQL's JSON columns provide flexibility where needed
- 73% increase in Postgres jobs with 12% pay premium (market trend)
- 55.6% developer adoption vs 24% for MongoDB (Stack Overflow 2025)

**Why Neon over Supabase:**
- Neon: Pure PostgreSQL focus, serverless with auto-scaling, free tier doubled to 100 CU-hours in Oct 2025
- Supabase: Full BaaS (we don't need auth/storage, we have Next.js)
- Neon's branching excellent for dev/staging/prod workflows

**Why Prisma over Drizzle:**
- Prisma: Superior DX, faster initial development, better for solo developers
- Drizzle: Better performance, lower overhead, but requires SQL knowledge
- For budget SaaS: Prisma's speed-to-market > Drizzle's performance edge

**Confidence:** HIGH (verified with multiple 2025 comparison articles and official docs)

### AI Services

| Service | Purpose | Pricing | Why |
|---------|---------|---------|-----|
| **OpenAI GPT-4o mini** | Product descriptions, meta descriptions, SEO content | $0.15/M input tokens, $0.60/M output tokens | 60% cheaper than GPT-3.5 Turbo. Sufficient quality for ecommerce descriptions. 1000 products = ~$5-10/month. |
| **Claid.ai** | Product image enhancement, background removal, upscaling | API-based, volume pricing | Built specifically for ecommerce. Auto background removal, compliance with marketplace standards, batch processing. More focused than generic upscalers like Deep-Image.ai. |

**Content Generation Strategy:**
- Use GPT-4o mini (not GPT-4o or Claude) for cost efficiency
- Batch processing via OpenAI Batch API: 50% savings on inputs/outputs
- Prompt caching for repeated system prompts: $0.075/M cached tokens
- Expected usage: 500 products/month = ~$3-7/month for text generation

**Why OpenAI over Claude for this use case:**
- OpenAI: Better for creative marketing copy, SEO optimization, keyword research
- Claude: Better for analytical, business context, but higher pricing ($3/$15 vs $0.15/$0.60)
- For product descriptions at scale: OpenAI's pricing advantage wins

**Image Enhancement:**
- Claid.ai specializes in ecommerce product photography
- Alternatives: Deep-Image.ai (generic), VanceAI (API discontinued Sept 2025)
- Estimate: $20-40/month for 500 products (depends on volume plan)

**Confidence:** HIGH for OpenAI (official pricing), MEDIUM for Claid.ai (need to verify current API pricing)

### Scraping Services

| Service | Purpose | Pricing | Why |
|---------|---------|---------|-----|
| **ScrapingBee** | AliExpress/Amazon product data | $49/month Freelance tier | 1000 free credits to test. Credit multipliers: 1x basic, 5x JS, 10x premium proxy. Handles anti-bot, CAPTCHA, JS rendering. Good balance of features and price for solo developer. |

**Alternatives considered:**

| Service | Pricing | Why NOT chosen |
|---------|---------|----------------|
| **Scrapingdog** | $0.20/1K requests | Cheapest but slower (3.55s avg response time). May need premium features for AliExpress/Amazon. |
| **ScraperAPI** | $69.99/month | 40% more expensive than ScrapingBee for similar features. |
| **Oxylabs** | $1.35/1K requests | Too expensive for $200/month budget. |
| **Product Fetcher** | API-based | Marketed for this exact use case but pricing unclear, less established. |

**Scraping strategy:**
- ScrapingBee Freelance: $49/month
- Budget 150 product scrapes/month (JS rendering = 5x multiplier = 750 credits)
- User provides links, scraping happens on-demand (not bulk scraping)
- Cache scraped data for 7 days to reduce API calls

**Legal note:** Using official APIs (Amazon Product Advertising API, AliExpress Affiliate API) would be preferable but requires affiliate approval and has limited data access. Scraping as fallback for broader catalog access.

**Confidence:** HIGH (multiple 2025 price comparisons verified)

### Image Processing & CDN

| Technology | Purpose | Pricing | Why |
|------------|---------|---------|-----|
| **Cloudinary** | Image CDN, transformation, optimization | Free tier: 25 credits/month (25GB bandwidth OR 25K transformations OR 25GB storage). Plus: $89/month | Free tier sufficient for MVP. Integrated storage + CDN + transformations. Better all-in-one than imgix (no storage). Automatic format optimization (WebP, AVIF). |

**Why Cloudinary:**
- All-in-one: storage + CDN + transformations (imgix requires separate storage)
- Free tier generous for MVP: 25GB bandwidth OR 25K transformations
- Auto-format optimization reduces bandwidth costs
- Next.js integration via `next-cloudinary` package

**When to upgrade:** If exceeding 25GB bandwidth/month, upgrade to Plus ($89) or switch to imgix (unlimited bandwidth with fair use policy).

**Confidence:** HIGH (official pricing verified)

### Hosting & Infrastructure

| Platform | Purpose | Pricing | Why |
|----------|---------|---------|-----|
| **Vercel Pro** | Next.js hosting, serverless functions, edge network | $20/month + overages ($2/M edge requests, $0.15/GB bandwidth) | Best Next.js DX, zero-config deployment, preview deployments, edge functions. Hobby plan prohibits commercial use. Pro required for Salla App Store. |
| **Railway** (alternative) | Full-stack hosting | $5/month (Hobby) + usage ($5 credit included) | Pay-per-use model. 40% cheaper than competitors. Serverless auto-sleep after 10min inactivity. Good if Vercel overages exceed budget. |

**Why Vercel Pro:**
- Optimal Next.js performance (Vercel built Next.js)
- Edge network for MENA region (important for Salla's Saudi Arabia market)
- Server Actions, ISR, dynamic rendering work seamlessly
- Preview deployments for testing

**When to use Railway instead:**
- If Vercel bandwidth costs exceed budget (>~50GB/month)
- Need long-running background jobs (Vercel has 10s function timeout on Hobby, 300s on Pro)
- More predictable usage-based billing

**Vercel Pro limits:**
- 1000 GB bandwidth included
- 1M Edge Middleware invocations
- 1M Serverless Function executions
- Fast Builds, Analytics, Image Optimization included

**Budget estimate:** Vercel Pro $20/month should be sufficient for first 100-500 users.

**Confidence:** HIGH (official pricing and limits verified)

### Authentication & Authorization

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Auth.js v5** | 5.x (beta/RC) | User authentication, session management | NextAuth.js successor. Single `auth()` function for Next.js App Router. Simplified config. Free, no vendor lock-in. Stable enough for production as of 2025. |
| **Salla OAuth** | v2 | Merchant authorization | Separate from user auth. Uses `@salla.sa/passport-strategy` for merchant store access. |

**Architecture:**
- Auth.js for app users (dropshippers signing up)
- Salla OAuth for merchant stores (connecting to Salla API)
- Both tokens stored in PostgreSQL via Prisma

**Why Auth.js v5 over alternatives:**
- Free (vs Clerk, Auth0)
- Next.js 15 App Router optimized
- Flexible (email/password, OAuth providers)
- No monthly costs (important for $200 budget)

**Alternatives considered:**
- Clerk: $25/month + $0.02/MAU. Too expensive for bootstrapped SaaS.
- Auth0: $35/month. Similar cost issue.
- Custom JWT: Reinventing the wheel, security risks for solo developer.

**Confidence:** HIGH (Auth.js v5 migration guide and official docs reviewed)

### Payment & Subscription Billing

| Service | Purpose | Pricing | Why |
|---------|---------|---------|-----|
| **Lemon Squeezy** | Subscription billing, payments, tax compliance | 5% + $0.50 per transaction (+1.5% international) | Merchant of Record: handles global tax compliance, VAT, sales tax. Acquired by Stripe (July 2024) but operates independently. Simplest for solo developer. No separate tax setup needed. |

**Why Lemon Squeezy:**
- Merchant of Record: handles all tax compliance (critical for MENA region sales)
- No separate Stripe setup + tax service (Stripe alone doesn't handle tax)
- $10K processed = $500 + transaction fees
- Simpler than Paddle for small SaaS
- Acquired by Stripe = stability

**Alternatives considered:**

| Service | Pricing | Why NOT chosen |
|---------|---------|----------------|
| **Stripe** | 2.9% + $0.30 | NOT Merchant of Record. Requires separate tax service (Taxjar, Avalara = +$19-99/month). Developer must handle VAT/tax compliance. |
| **Stripe (new MoR beta)** | ~3.5% + standard fees (estimated) | Private beta, pricing unclear. Wait until generally available. |
| **Paddle** | 5% + $0.50 | Same as Lemon Squeezy but targets enterprises. More complex for solo dev. |

**Subscription model:** Tiered pricing (e.g., $29/month Basic, $79/month Pro)
- First $1000 revenue = $50 in Lemon Squeezy fees
- Scales linearly with revenue

**Confidence:** HIGH (verified with recent 2025 comparison articles and official pricing)

### UI & Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **TailwindCSS** | 4.x | Utility-first CSS | Industry standard. Excellent Next.js integration. V4 introduces token-driven theming. Smaller bundle than v3. |
| **shadcn/ui** | Latest | Component library | Copy-paste components built on Radix UI. Accessibility built-in. Full customization. No version lock-in. Better than Material-UI for customization. |
| **Radix UI** | Latest | Headless UI primitives | Accessibility, keyboard navigation, screen reader support automatic. Used by shadcn/ui. |

**Why shadcn/ui over alternatives:**
- Copy-paste = full ownership, no dependency version issues
- Built on Radix = accessibility handled
- Tailwind styling = consistent with rest of app
- Free and open source

**Alternatives:**
- Material-UI (MUI): Heavy, opinionated design, harder to customize
- Chakra UI: Good but shadcn/ui has better Next.js 15 momentum in 2025
- Ant Design: Too enterprise-focused, not modern enough

**Confidence:** HIGH (shadcn/ui is the dominant React component approach in 2025)

### Form Handling & Validation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **React Hook Form** | 7.x | Form state management | Lightweight, performant. Uncontrolled components = less re-renders. Perfect for complex forms (product creation, store config). |
| **Zod** | 3.x | Schema validation | TypeScript-first validation. Works client + server. Type inference. Reusable schemas. Integrates with React Hook Form via `@hookform/resolvers`. |

**Pattern:**
```typescript
// Define schema once
const productSchema = z.object({
  title: z.string().min(10).max(200),
  price: z.number().positive(),
  // ...
});

// Use client-side (React Hook Form + Zod)
const form = useForm({
  resolver: zodResolver(productSchema)
});

// Reuse server-side (Next.js Server Action)
export async function createProduct(data: unknown) {
  const validated = productSchema.parse(data);
  // ...
}
```

**Benefits:**
- Type-safe forms throughout stack
- Single source of truth for validation
- Client + server validation with same rules
- Excellent DX with TypeScript inference

**Confidence:** HIGH (React Hook Form + Zod is the standard Next.js form approach in 2025)

### Developer Tools

| Tool | Purpose | Why |
|------|---------|-----|
| **ESLint** | Code linting | Next.js includes ESLint config. Catch bugs early. |
| **Prettier** | Code formatting | Consistent formatting across team (even team of 1 + AI). |
| **Prisma Studio** | Database GUI | Visual DB inspection during development. Better than pgAdmin for quick checks. |
| **Postman** | API testing | Salla docs recommend Postman for testing their API endpoints. |

---

## Cost Breakdown

### Monthly Service Costs (Estimated)

| Service | Tier | Monthly Cost | Notes |
|---------|------|--------------|-------|
| **Hosting (Vercel Pro)** | Pro | $20 | Required for commercial use. Includes 1TB bandwidth. |
| **Database (Neon)** | Free | $0 | 0.5GB storage, 100 CU-hours. Upgrade at ~10K users. |
| **AI - Text (OpenAI)** | Pay-as-you-go | $5-10 | 500 products/month @ GPT-4o mini rates. |
| **AI - Images (Claid.ai)** | API | $20-40 | 500 images/month (estimate, verify pricing). |
| **Scraping (ScrapingBee)** | Freelance | $49 | 150 products/month with JS rendering. |
| **Image CDN (Cloudinary)** | Free | $0 | 25GB bandwidth/month. Upgrade to Plus ($89) if exceeded. |
| **Auth (Auth.js)** | Free | $0 | Open source, no hosting costs. |
| **Payments (Lemon Squeezy)** | Per-transaction | Variable | 5% + $0.50 per transaction. Not upfront cost. |
| **Domain** | - | $15/year | Namecheap, Cloudflare Registrar. Negligible monthly. |

**Total fixed monthly costs:** $94-119/month
**Buffer for overages:** $81-106/month
**Within budget:** YES ($200/month target)

### Scaling Costs

| Usage Level | Monthly Cost Estimate |
|-------------|----------------------|
| **0-100 users** | $90-120 (current stack) |
| **100-500 users** | $120-180 (may need Cloudinary Plus at $89) |
| **500-1000 users** | $180-250 (may need to upgrade Neon, increase scraping budget) |
| **1000+ users** | Re-evaluate architecture (caching, CDN optimization, batch processing) |

**Cost optimization strategies:**
- Cache scraped product data (reduce ScrapingBee calls)
- Batch AI content generation (OpenAI Batch API = 50% savings)
- Prompt caching for repeated system prompts (save on input tokens)
- Image optimization to reduce Cloudinary bandwidth
- Rate limiting to prevent abuse

---

## Alternatives Considered

### What NOT to Use (and Why)

| Technology | Category | Why NOT |
|------------|----------|---------|
| **PHP/Laravel** | Backend | Salla provides PHP SDK, but Next.js + Node.js offers better DX for full-stack TypeScript. Solo developer benefits from single language. |
| **MongoDB** | Database | PostgreSQL better for SaaS with subscriptions, financial data. ACID compliance critical. MongoDB useful for flexible schemas, but Postgres JSON columns provide that when needed. |
| **Drizzle ORM** | ORM | Better performance than Prisma, but Prisma's DX and speed-to-market more important for solo developer. Switch to Drizzle if performance becomes bottleneck. |
| **Render** | Hosting | Fixed instance pricing. One case study showed $800/month on Vercel reduced to $40 on Render, but that's for established high-traffic apps. For MVP, Vercel's serverless model more cost-effective. |
| **Heroku** | Hosting | $7-25/month for basic dyno + $9-50/month for Postgres. Total $16-75/month. BUT: Worse DX than Vercel for Next.js, slower deployments. Not worth the savings. |
| **Claude Sonnet/Opus** | AI text generation | Higher quality than GPT-4o mini, but 5-10x more expensive ($3-15/M input vs $0.15). For product descriptions, GPT-4o mini quality sufficient. |
| **VanceAI** | Image enhancement | API discontinued September 2025. |
| **Paddle** | Payments | Same pricing as Lemon Squeezy (5% + $0.50) but targets enterprises. More complex setup. Lemon Squeezy simpler for solo dev. |
| **Clerk** | Auth | $25/month + $0.02/MAU. Great DX but too expensive for bootstrapped SaaS. Auth.js v5 free and sufficient. |
| **Custom JWT Auth** | Auth | Reinventing the wheel. Security risks. Token refresh, session management complex. Not worth it vs Auth.js. |

---

## Installation & Setup

### Core Dependencies

```bash
# Create Next.js 15 app with TypeScript, Tailwind, App Router
npx create-next-app@latest salla-store-builder --typescript --tailwind --app --use-npm

cd salla-store-builder

# Salla integration
npm install @salla.sa/passport-strategy axios

# Database & ORM
npm install @prisma/client
npm install -D prisma

# Auth
npm install next-auth@beta # Auth.js v5

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# UI Components
npx shadcn@latest init

# AI SDKs
npm install openai

# Image processing
npm install next-cloudinary

# Utilities
npm install date-fns # Date formatting
npm install clsx tailwind-merge # Utility classes
```

### Development Dependencies

```bash
npm install -D @types/node @types/react @types/react-dom
npm install -D eslint prettier eslint-config-prettier
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

---

## Architecture Decisions

### Why Full-Stack Next.js (not separate backend)?

**Decision:** Use Next.js App Router with Server Actions instead of separate Express backend.

**Rationale:**
- Single deployment (simpler for solo dev)
- Server Actions replace REST API routes for mutations
- API Routes still available for webhooks (Salla, payment webhooks)
- Type safety across client/server boundary
- Less infrastructure to manage

**Trade-off:** Harder to add mobile app later (would need to expose API routes). But for Salla App Store distribution, web app is primary target.

### Why Serverless vs Traditional Server?

**Decision:** Serverless (Vercel/Railway) over traditional VPS (DigitalOcean Droplet, Linode).

**Rationale:**
- Pay for actual usage (important for low-traffic MVP)
- Auto-scaling (if product succeeds)
- Zero DevOps (no server maintenance, security patches)
- Focus on product, not infrastructure

**When to reconsider:** If consistent traffic > 500 concurrent users, traditional server may be cheaper. But at that scale, revenue should support higher costs.

### Why OpenAI over Claude?

**Decision:** OpenAI GPT-4o mini for product descriptions.

**Rationale:**
- 60% cheaper than GPT-3.5 Turbo, 90% cheaper than Claude
- Sufficient quality for ecommerce descriptions
- Better for creative marketing copy and SEO
- Batch API for 50% savings on bulk processing

**When to use Claude:** If product descriptions require nuanced business context or regulatory compliance (e.g., health products). But for general dropshipping (consumer goods), OpenAI sufficient.

### Why Postgres over MongoDB?

**Decision:** PostgreSQL with Prisma.

**Rationale:**
- SaaS apps need ACID transactions (subscriptions, payments)
- Structured relationships (users → stores → products → images)
- Better for complex queries (reporting, analytics)
- Market trend: 55.6% vs 24% adoption, 12% pay premium

**When to use MongoDB:** If product catalog has highly variable schema (e.g., electronics vs clothing vs food = different attributes). But Postgres JSON columns provide flexibility where needed.

---

## Technology Versions (Verified)

| Package | Current Version | Verified Date |
|---------|----------------|---------------|
| Next.js | 15.1.x | 2026-01-21 |
| React | 19.x | 2026-01-21 |
| Node.js LTS | 20.11.x | 2026-01-21 |
| TypeScript | 5.6.x | 2026-01-21 |
| @salla.sa/passport-strategy | 1.0.9 | 2026-01-21 |
| Prisma | 6.1.x | 2026-01-21 |
| Auth.js (next-auth) | 5.0.0-beta.x | 2026-01-21 |
| TailwindCSS | 4.x | 2026-01-21 |
| shadcn/ui | Latest (no version, copy-paste) | 2026-01-21 |
| React Hook Form | 7.54.x | 2026-01-21 |
| Zod | 3.23.x | 2026-01-21 |
| OpenAI SDK | 4.x | 2026-01-21 |

---

## Confidence Assessment

| Category | Confidence | Reasoning |
|----------|------------|-----------|
| **Salla Integration** | HIGH | Verified with official Salla GitHub repos, docs, and Express starter kit. Node.js/Passport strategy confirmed. |
| **Next.js Framework** | HIGH | Official Next.js 15 docs reviewed. App Router, Server Actions, and React 19 compatibility verified. |
| **Database (Postgres/Neon)** | HIGH | Multiple 2025 comparison articles. Neon free tier limits verified (100 CU-hours, 0.5GB storage). |
| **AI Text (OpenAI)** | HIGH | Official OpenAI pricing page verified. GPT-4o mini: $0.15/$0.60 per million tokens confirmed. |
| **AI Images (Claid.ai)** | MEDIUM | WebSearch indicates Claid.ai specializes in ecommerce, but current API pricing not verified on official site. Needs confirmation. |
| **Scraping (ScrapingBee)** | HIGH | Multiple pricing comparison sites verified $49/month Freelance tier. Credit system and multipliers confirmed. |
| **Hosting (Vercel/Railway)** | HIGH | Official Vercel pricing verified ($20/month Pro). Railway usage-based pricing confirmed. |
| **Payments (Lemon Squeezy)** | HIGH | 5% + $0.50 pricing verified. Stripe acquisition (July 2024) confirmed. MoR model verified. |
| **Auth (Auth.js v5)** | MEDIUM | Auth.js v5 in beta/RC but stated as production-ready for 2025. Official migration guide reviewed. Some risk as not fully stable release. |
| **UI (shadcn/ui)** | HIGH | Dominant React component library in 2025. Tailwind v4 compatibility confirmed. Multiple recent guides verified. |
| **Forms (RHF + Zod)** | HIGH | Standard Next.js form pattern in 2025. Multiple recent tutorials and official docs confirmed. |

**Overall Stack Confidence:** HIGH (80%+)

**Low Confidence Items Requiring Validation:**
1. **Claid.ai pricing:** Need to verify current API pricing tiers via official website or sales contact
2. **Auth.js v5 stability:** While stated as production-ready, it's still in beta. Monitor for stable release or issues.

---

## Migration Path (If Scale Requires)

### From Neon Free → Neon Paid / Supabase

**When:** > 0.5GB storage OR > 100 CU-hours/month (roughly 10K users)

**Options:**
- Neon Scale: $19/month (10GB, 300 CU-hours)
- Supabase Pro: $25/month (8GB + $10 compute credit)
- Self-hosted Postgres on Railway/DigitalOcean: ~$15-25/month

**Migration effort:** Low (connection string change, schema compatible)

### From Vercel Pro → Railway / Self-Hosted

**When:** Bandwidth costs > $50/month (roughly 500GB+ bandwidth)

**Options:**
- Railway: Usage-based, typically 40% cheaper for consistent traffic
- Render: Fixed instance pricing, $40/month for production workload
- Self-hosted VPS (DigitalOcean, Hetzner): $12-24/month + DevOps time

**Migration effort:** Medium (environment variables, some config changes, but Next.js is portable)

### From GPT-4o mini → Claude OR Self-Hosted LLM

**When:** Quality issues OR API costs > $50/month

**Options:**
- Claude Sonnet 4: $3/$15 per million tokens (higher quality)
- Self-hosted Llama 3 on Modal/RunPod: ~$0.10-0.30/M tokens
- Fine-tuned GPT-4o mini for specific product categories

**Migration effort:** Low (OpenAI SDK → Anthropic SDK, similar API patterns)

---

## Sources

### Salla Integration
- [Salla OAuth Documentation](https://docs.salla.dev/421118m0)
- [Salla Get Started Guide](https://docs.salla.dev/421117m0)
- [Salla OAuth2 Merchant GitHub](https://github.com/SallaApp/oauth2-merchant)
- [Salla Passport Strategy GitHub](https://github.com/SallaApp/passport-strategy)
- [Salla Express Starter Kit GitHub](https://github.com/SallaApp/express-starter-kit)

### AI Services
- [OpenAI API Pricing](https://openai.com/api/pricing/)
- [Claid.ai Product Enhancement](https://claid.ai/product/enhancement/)
- [OpenAI vs Anthropic 2025 Developer's Guide](https://www.eesel.ai/blog/openai-api-vs-anthropic-api)
- [LLM API Pricing Comparison 2025](https://intuitionlabs.ai/articles/llm-api-pricing-comparison-2025)

### Scraping Services
- [ScrapingBee Pricing](https://www.scrapingbee.com/pricing/)
- [4 Best Amazon Scraping APIs 2025](https://www.scrapingdog.com/blog/best-amazon-scraping-apis/)
- [Web Scraping API Cost Guide 2025](https://scraphen.com/blog/how-much-does-web-scraping-cost/index.html)

### Database & Hosting
- [PostgreSQL vs MongoDB 2025 Comparison](https://www.sevensquaretech.com/mongodb-vs-postgresql/)
- [Neon vs Supabase Free Tier Comparison](https://www.freetiers.com/blog/supabase-vs-neon-comparison)
- [Vercel Pricing](https://vercel.com/pricing)
- [Railway vs Vercel Comparison](https://docs.railway.com/maturity/compare-to-vercel)

### Framework & Tools
- [Next.js 15 Release](https://nextjs.org/blog/next-15)
- [Next.js Best Practices 2025](https://medium.com/@GoutamSingha/next-js-best-practices-in-2025-build-faster-cleaner-scalable-apps-7efbad2c3820)
- [Prisma vs Drizzle ORM Comparison](https://www.prisma.io/docs/orm/more/comparisons/prisma-and-drizzle)
- [Auth.js v5 Migration Guide](https://authjs.dev/getting-started/migrating-to-v5)
- [shadcn/ui Documentation](https://ui.shadcn.com/docs/installation/next)

### Payment Processing
- [Stripe vs Paddle vs Lemon Squeezy Comparison](https://medium.com/@muhammadwaniai/stripe-vs-paddle-vs-lemon-squeezy-i-processed-10k-through-each-heres-what-actually-matters-27ef04e4cb43)
- [Lemon Squeezy Paddle Alternative](https://www.lemonsqueezy.com/paddle-alternative)

---

## Next Steps

1. **Verify Claid.ai pricing** - Contact sales or review API docs for accurate cost estimates
2. **Set up Neon Postgres** - Create free account, database, obtain connection string
3. **Configure Salla Developer Account** - Register as Salla Partner, create test app
4. **Prototype AI content generation** - Test GPT-4o mini quality for product descriptions
5. **Evaluate ScrapingBee** - Use 1000 free credits to test AliExpress/Amazon scraping
6. **Budget monitoring** - Set up billing alerts on all pay-as-you-go services (OpenAI, Vercel, etc.)

---

**End of Stack Research**

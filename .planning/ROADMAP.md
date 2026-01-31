# Roadmap: Salla Atlas

## Overview

Salla Atlas transforms from zero to production-ready AI store builder in six phases. We start with foundation (OAuth, job queue, database), build the core pipeline (scraping → AI content → store generation), add monetization, and polish for Salla App Store launch. Every phase delivers a verifiable capability that brings us closer to the core value: paste a product link, get a complete Salla store.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Infrastructure, OAuth, and job queue system
- [ ] **Phase 2: Product Scraping** - Extract product data from AliExpress and Amazon
- [ ] **Phase 3: AI Content & Images** - Generate descriptions, translations, and enhanced images
- [ ] **Phase 4: Store Generation** - Deploy themes and landing pages to Salla
- [ ] **Phase 5: Business & Billing** - Subscription system and merchant dashboard
- [ ] **Phase 6: Launch Readiness** - Onboarding, testing, and App Store submission

## Phase Details

### Phase 1: Foundation
**Goal**: Critical infrastructure working end-to-end with secure Salla integration
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-04, SALLA-01, SALLA-02, SALLA-04
**Success Criteria** (what must be TRUE):
  1. Merchant can install app via Salla App Store OAuth flow
  2. Access tokens refresh automatically without manual intervention
  3. Jobs queue reliably and process asynchronously
  4. Merchant data persists correctly across sessions
  5. Webhook events are received and processed
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Inngest setup with typed events and retry utility (2026-01-31)
- [x] 01-02-PLAN.md — Extended webhook handling with history and Inngest queueing (2026-01-31)

### Phase 2: Product Scraping
**Goal**: Reliable product data extraction with async processing and fallback strategies
**Depends on**: Phase 1
**Requirements**: SCRAPE-01, SCRAPE-02, SCRAPE-03, SCRAPE-04
**Success Criteria** (what must be TRUE):
  1. Merchant can paste AliExpress link and see product data preview (title, images, price)
  2. Merchant can paste Amazon link and see product data preview
  3. Scraping completes within 2-4 minutes without rate limit failures
  4. Failed scraping jobs retry automatically and succeed on subsequent attempts
**Plans**: 3 plans (gap closure)

Plans:
- [ ] 02-01-PLAN.md — Inngest async scraping with job status polling
- [ ] 02-02-PLAN.md — AI-from-image fallback when text scraping fails
- [ ] 02-03-PLAN.md — Cost tracking for subscription enforcement

### Phase 3: AI Content & Images
**Goal**: AI-generated content and enhanced images for products
**Depends on**: Phase 2
**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05, INFRA-03
**Success Criteria** (what must be TRUE):
  1. Product gets compelling description in English automatically generated
  2. Product gets Arabic translation of all content (description, title, meta)
  3. Product gets SEO-optimized meta titles and descriptions
  4. Product gets 4 enhanced images at studio quality
  5. AI cost per product stays under $1 and is tracked in real-time
**Plans**: TBD

Plans:
- [ ] 03-01: [TBD during plan-phase]

### Phase 4: Store Generation
**Goal**: Products deployed to Salla with optimized content
**Depends on**: Phase 3
**Requirements**: SALLA-03, SALLA-05, STORE-01, STORE-02
**Note**: Salla doesn't allow theme code injection via API (unlike Shopify). MVP uses merchant's existing theme. See FUTURE.md for v2 "Smart Theme" architecture.
**Success Criteria** (what must be TRUE):
  1. Product appears in merchant's Salla store via API import
  2. Product has AI-enhanced title, description, and images
  3. Arabic content displays correctly (merchant's theme handles RTL)
  4. English content displays correctly
  5. Product images uploaded successfully to Salla
**Plans**: TBD

Plans:
- [ ] 04-01: [TBD during plan-phase]

### Phase 5: Business & Billing
**Goal**: Monetization system and merchant dashboard operational
**Depends on**: Phase 4
**Requirements**: BIZ-01, BIZ-02
**Success Criteria** (what must be TRUE):
  1. Merchant can subscribe to monthly plan via Lemon Squeezy
  2. Merchant can view imported products and their status in dashboard
  3. Subscription status controls feature access (trial vs paid)
  4. Failed payments pause service and notify merchant
**Plans**: TBD

Plans:
- [ ] 05-01: [TBD during plan-phase]

### Phase 6: Launch Readiness
**Goal**: Production-ready app submitted to Salla App Store
**Depends on**: Phase 5
**Requirements**: BIZ-03
**Success Criteria** (what must be TRUE):
  1. New merchant completes onboarding wizard without confusion
  2. First store generation works end-to-end from onboarding
  3. Error messages guide merchants to resolution
  4. App listing meets Salla App Store publishing standards (Arabic translation, professional assets)
  5. End-to-end test passes for AliExpress → Salla store workflow
**Plans**: TBD

Plans:
- [ ] 06-01: [TBD during plan-phase]

---

## v2: Smart Theme Architecture (Post-Launch)

See **FUTURE.md** for detailed architecture. Salla doesn't allow code injection like Shopify - we must build "Chameleon Themes" that read AI config at runtime.

- [ ] **Phase 7: Smart Theme Foundation** - Build Twilight theme with CSS variable system
- [ ] **Phase 8: AI Design Generation** - Color palettes, fonts, layouts from product analysis
- [ ] **Phase 9: Theme Marketplace** - Multiple Smart Theme variants for merchants

---

## Progress

**Execution Order:**
- v1 (MVP): Phases 1 → 2 → 3 → 4 → 5 → 6
- v2 (Smart Themes): Phases 7 → 8 → 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete | 2026-01-31 |
| 2. Product Scraping | 0/3 | In progress | - |
| 3. AI Content & Images | 0/? | Not started | - |
| 4. Store Generation | 0/? | Not started | - |
| 5. Business & Billing | 0/? | Not started | - |
| 6. Launch Readiness | 0/? | Not started | - |
| **v2** | | | |
| 7. Smart Theme Foundation | 0/? | Future | - |
| 8. AI Design Generation | 0/? | Future | - |
| 9. Theme Marketplace | 0/? | Future | - |

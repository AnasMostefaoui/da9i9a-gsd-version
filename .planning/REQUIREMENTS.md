# Requirements: Salla Atlas

**Defined:** 2026-01-21
**Core Value:** Paste a product link, get a complete Salla store ready to sell

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Salla Integration

- [ ] **SALLA-01**: App installs via Salla App Store with OAuth 2.0 flow
- [ ] **SALLA-02**: Secure token storage with refresh token mutex (single-use tokens)
- [ ] **SALLA-03**: Create products in merchant store via Merchant API
- [ ] **SALLA-04**: Handle webhooks (app.installed, app.uninstalled, app.expired)
- [ ] **SALLA-05**: Deploy store theme via Twilight SDK

### Product Scraping

- [ ] **SCRAPE-01**: Extract product data from AliExpress links (title, images, price)
- [ ] **SCRAPE-02**: Extract product data from Amazon links (title, images, price)
- [ ] **SCRAPE-03**: Scraper abstraction layer for plug-and-play SaaS APIs
- [ ] **SCRAPE-04**: Queue-based async scraping (2-4 min processing time)

### AI Content Generation

- [ ] **AI-01**: Generate compelling product descriptions from scraped data
- [ ] **AI-02**: Generate Arabic translations of all content (MENA critical)
- [ ] **AI-03**: Generate SEO meta titles and descriptions
- [ ] **AI-04**: Enhance 4 product images to studio quality
- [ ] **AI-05**: Cost monitoring and per-request tracking (budget protection)

### Store Setup

- [ ] **STORE-01**: Generate dedicated landing page for each product
- [ ] **STORE-02**: RTL (right-to-left) layout support for Arabic
- [ ] **STORE-03**: LTR (left-to-right) layout support for English
- [ ] **STORE-04**: Mobile-first responsive design (70%+ MENA traffic is mobile)
- [ ] **STORE-05**: Conversion-optimized theme with Salla best practices

### Business & Billing

- [ ] **BIZ-01**: Subscription billing via Lemon Squeezy (monthly plans)
- [ ] **BIZ-02**: Merchant dashboard showing imported products and status
- [ ] **BIZ-03**: Beginner-friendly onboarding flow (guided setup wizard)

### Infrastructure

- [ ] **INFRA-01**: Background job system for async processing (Inngest)
- [ ] **INFRA-02**: PostgreSQL database for merchant and product data
- [ ] **INFRA-03**: Real-time AI cost monitoring dashboard
- [ ] **INFRA-04**: Error handling and retry logic for external APIs

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Scraping

- **SCRAPE-05**: Handle product variants (size, color, material)
- **SCRAPE-06**: Extract supplier info (shipping times, ratings, order volume)
- **SCRAPE-07**: Multi-supplier comparison for same product

### Conversion Features

- **CONV-01**: Bundler/upsell recommendations
- **CONV-02**: Cart upsell widgets
- **CONV-03**: A/B testing for landing pages
- **CONV-04**: Social proof widgets (fake reviews, urgency timers)

### Automation

- **AUTO-01**: Automated order fulfillment to suppliers
- **AUTO-02**: Inventory sync with supplier stock levels
- **AUTO-03**: Profit margin calculator and analytics
- **AUTO-04**: Price monitoring and auto-adjustment

### Scale

- **SCALE-01**: Usage limits/quotas by subscription tier
- **SCALE-02**: Multi-store management for power users
- **SCALE-03**: Team/collaborator access

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Mobile app | Web-first, Salla admin integration sufficient for v1 |
| Real-time chat support | Documentation and guides instead, solo developer constraint |
| Custom theme builder | Use configurable templates, reduce complexity |
| Order fulfillment | Focus on store setup first, fulfillment is v2 |
| Payment gateway integration | Salla handles payments, not our concern |
| Inventory management | Supplier-side concern for dropshipping |
| Social media auto-posting | Adds complexity, not core value |
| Ad campaign management | Out of scope, merchants use native ad platforms |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SALLA-01 | Phase 1 | Pending |
| SALLA-02 | Phase 1 | Pending |
| SALLA-04 | Phase 1 | Pending |
| INFRA-01 | Phase 1 | Pending |
| INFRA-02 | Phase 1 | Pending |
| INFRA-04 | Phase 1 | Pending |
| SCRAPE-01 | Phase 2 | Pending |
| SCRAPE-02 | Phase 2 | Pending |
| SCRAPE-03 | Phase 2 | Pending |
| SCRAPE-04 | Phase 2 | Pending |
| AI-01 | Phase 3 | Pending |
| AI-02 | Phase 3 | Pending |
| AI-03 | Phase 3 | Pending |
| AI-04 | Phase 3 | Pending |
| AI-05 | Phase 3 | Pending |
| INFRA-03 | Phase 3 | Pending |
| SALLA-03 | Phase 4 | Pending |
| SALLA-05 | Phase 4 | Pending |
| STORE-01 | Phase 4 | Pending |
| STORE-02 | Phase 4 | Pending |
| STORE-03 | Phase 4 | Pending |
| STORE-04 | Phase 4 | Pending |
| STORE-05 | Phase 4 | Pending |
| BIZ-01 | Phase 5 | Pending |
| BIZ-02 | Phase 5 | Pending |
| BIZ-03 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 26 (100% coverage)
- Unmapped: 0

---
*Requirements defined: 2026-01-21*
*Last updated: 2026-01-21 after stack decisions (removed BIZ-04, updated INFRA-01, SCRAPE-03)*

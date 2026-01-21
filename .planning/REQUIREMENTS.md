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
- [ ] **SCRAPE-03**: Handle rate limiting and proxy rotation for reliable scraping
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
- [ ] **BIZ-04**: User authentication and account management

### Infrastructure

- [ ] **INFRA-01**: Job queue system for async processing (BullMQ + Redis)
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
| SALLA-01 | TBD | Pending |
| SALLA-02 | TBD | Pending |
| SALLA-03 | TBD | Pending |
| SALLA-04 | TBD | Pending |
| SALLA-05 | TBD | Pending |
| SCRAPE-01 | TBD | Pending |
| SCRAPE-02 | TBD | Pending |
| SCRAPE-03 | TBD | Pending |
| SCRAPE-04 | TBD | Pending |
| AI-01 | TBD | Pending |
| AI-02 | TBD | Pending |
| AI-03 | TBD | Pending |
| AI-04 | TBD | Pending |
| AI-05 | TBD | Pending |
| STORE-01 | TBD | Pending |
| STORE-02 | TBD | Pending |
| STORE-03 | TBD | Pending |
| STORE-04 | TBD | Pending |
| STORE-05 | TBD | Pending |
| BIZ-01 | TBD | Pending |
| BIZ-02 | TBD | Pending |
| BIZ-03 | TBD | Pending |
| BIZ-04 | TBD | Pending |
| INFRA-01 | TBD | Pending |
| INFRA-02 | TBD | Pending |
| INFRA-03 | TBD | Pending |
| INFRA-04 | TBD | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 27

---
*Requirements defined: 2026-01-21*
*Last updated: 2026-01-21 after initial definition*

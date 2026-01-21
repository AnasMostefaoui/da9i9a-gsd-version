# Salla Atlas

## What This Is

An AI-powered store builder for Salla merchants. Merchants paste a product link from AliExpress or Amazon, and the app generates a complete Salla store — product listing, AI descriptions, landing page, theme setup, and AI-enhanced product images. Think HelloAtlas, but for the Salla ecosystem.

## Core Value

Paste a product link, get a complete store ready to sell. New dropshippers can launch in minutes instead of days.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Salla App Store integration (OAuth, merchant authorization)
- [ ] Product link parsing (AliExpress, Amazon)
- [ ] Product data extraction (title, images, price, variants)
- [ ] AI-generated product descriptions
- [ ] AI-enhanced product images (4 images per product)
- [ ] Landing page generation for products
- [ ] Store theme setup/configuration
- [ ] Product import to Salla store via API
- [ ] Subscription billing system
- [ ] Beginner-friendly onboarding flow

### Out of Scope

- Mobile app — web-first, Salla admin integration
- Real-time chat support — documentation and guides instead
- Multi-language AI content — English/Arabic focus for v1
- Custom theme builder — use configurable templates
- Order fulfillment automation — focus on store setup first

## Context

**Inspiration:** HelloAtlas (helloatlas.io) — successful AI store builder for Shopify dropshippers.

**Platform:** Salla is an eCommerce platform popular in the MENA region with 60,000+ merchants. It provides Merchant APIs, Apps API, and Shipping/Fulfillment API. Apps are distributed via the Salla App Store.

**Target users:** New dropshippers who need hand-holding. The UX must be dead simple — paste link, click button, get store.

**Market opportunity:** No confirmed direct competitors in the Salla ecosystem (needs validation).

## Constraints

- **Budget**: ~$200/month for SaaS services (scrapers, AI APIs, hosting)
- **Team**: Solo developer with AI agent assistance
- **Distribution**: Must comply with Salla App Store requirements
- **Tech approach**: Open to using external SaaS tools (scrapers, image processing) to accelerate development

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| AliExpress + Amazon as initial sources | Most common dropshipping sources, proven demand | — Pending |
| Subscription model | Recurring revenue, aligns with ongoing AI costs | — Pending |
| Salla App Store distribution | Access to 60k+ merchants, credibility | — Pending |

---
*Last updated: 2026-01-21 after initialization*

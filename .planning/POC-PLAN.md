# POC Plan: Salla Atlas

**Created:** 2026-01-22
**Target:** 2 weeks
**Quality:** Production-lite (could onboard early users)

## Purpose

Prove the concept end-to-end to attract funding and help for MVP development. This is NOT the MVP — it's a vertical slice to demonstrate value.

## POC vs MVP

| Aspect | POC (v0) | MVP (v1) |
|--------|----------|----------|
| **Purpose** | Prove concept, attract funding | Go to market |
| **Timeline** | 2 weeks | Full roadmap |
| **Scope** | Vertical slice | Complete product |
| **Quality** | Production-lite | Production-ready |

## POC User Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. INSTALL                                                 │
│     Merchant installs app from Salla App Store              │
│     → OAuth flow → lands in app                             │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. IMPORT                                                  │
│     Paste AliExpress or Amazon URL                          │
│     → ScraperAPI extracts product data                      │
│     → Show: title, description, price, images               │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. SELECT IMAGES                                           │
│     Choose from scraped images                              │
│     OR upload custom images                                 │
│     → Selected images queued for enhancement                │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. ENHANCE                                                 │
│     Click "Enhance" button                                  │
│     → Gemini improves title, description (EN + AR)          │
│     → Image enhancement (Claid.ai or Nano Banana)           │
│     → Show before/after comparison                          │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  5. PREVIEW                                                 │
│     Show express checkout preview                           │
│     → Product with enhanced content                         │
│     → One preset theme (no picker)                          │
│     → Mobile + desktop preview                              │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  6. PUSH TO SALLA                                           │
│     Click "Create Store" or "Push to Salla"                 │
│     → Create product via Salla Merchant API                 │
│     → Deploy theme (if applicable)                          │
│     → Show success + link to live store                     │
└─────────────────────────────────────────────────────────────┘
```

## What's IN POC

| Feature | Details |
|---------|---------|
| Salla OAuth | Install app, connect store, token management |
| URL scraping | ScraperAPI for both AliExpress + Amazon |
| Image selection | Choose from scraped OR upload custom |
| AI Enhancement | Gemini for text (EN + AR), image enhancement API |
| Preview | Express checkout with one preset theme |
| Push to Salla | Create product via Merchant API |
| Basic error handling | Show errors, allow retry |
| Arabic-first UI | RTL layout, Arabic default |

## What's OUT of POC (MVP only)

| Feature | Reason |
|---------|--------|
| Fallback scraper providers | Single provider is enough for demo |
| Theme picker | One good theme, picker adds complexity |
| Caching | Always fresh scrape, no cache logic |
| Subscription billing | POC is free, billing in MVP |
| Onboarding wizard | Simple flow, wizard in MVP |
| Bundles/upsells | HelloAtlas feature, not core value |
| Job queue visibility | Background processing hidden |
| Webhook handling | Minimal - just install/uninstall |

## POC Tech Stack

| Component | Choice | Notes |
|-----------|--------|-------|
| Framework | React Router 7 | Single codebase |
| Hosting | Railway | Built-in Postgres, simple |
| Scraping | ScraperAPI | Both platforms, one provider |
| AI Text | Gemini | Content generation + Arabic |
| AI Images | Claid.ai OR Nano Banana | Test both, pick one |
| Database | PostgreSQL (Railway) | Merchants, products, tokens |
| Background Jobs | Inngest | Async scraping + AI processing |

## POC Timeline (2 weeks)

### Week 1: Foundation + Scraping

| Day | Focus | Deliverable |
|-----|-------|-------------|
| 1-2 | Project setup | RR7 app, Railway deploy, Salla app registration |
| 3-4 | Salla OAuth | Install flow, token storage, basic UI shell |
| 5-6 | Scraping | ScraperAPI integration, URL input, data display |
| 7 | Buffer | Catch up, fix issues |

### Week 2: AI + Preview + Push

| Day | Focus | Deliverable |
|-----|-------|-------------|
| 8-9 | Image handling | Selection UI, upload, storage |
| 10-11 | AI Enhancement | Gemini integration, image API, "Enhance" button |
| 12 | Preview | Express checkout preview component |
| 13 | Push to Salla | Merchant API integration, create product |
| 14 | Polish + test | End-to-end testing, bug fixes |

## POC Success Criteria

- [ ] Can install app in Salla demo store
- [ ] Can paste AliExpress URL and see product data
- [ ] Can paste Amazon URL and see product data
- [ ] Can select images from scraped results
- [ ] Can upload custom images
- [ ] Can click "Enhance" and see improved content
- [ ] Can see express checkout preview
- [ ] Can push product to Salla store
- [ ] Product appears in Salla admin with all data
- [ ] Works on mobile (Arabic RTL)

## POC Budget Estimate

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| Railway | ~$5 | Hobby plan |
| ScraperAPI | Free tier | 1000 credits for testing |
| Gemini | Free tier | Generous free quota |
| Image API | ~$20-40 | Claid.ai or test credits |
| Domain | ~$10 | Optional for POC |
| **Total** | **~$35-55** | Well under $200 budget |

## After POC

**If POC succeeds:**
1. Demo to potential investors/partners
2. Collect feedback from early users
3. Secure funding/help
4. Execute full MVP roadmap (Phases 1-6)

**POC code feeds into MVP:**
- OAuth implementation → Phase 1
- Scraping integration → Phase 2
- AI enhancement → Phase 3
- Salla API integration → Phase 4

---

*POC Plan created: 2026-01-22*
*Target completion: 2 weeks from start*

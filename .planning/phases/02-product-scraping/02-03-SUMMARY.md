---
phase: 02-product-scraping
plan: 03
subsystem: api
tags: [cost-tracking, scraping, subscription-enforcement, pricing]

# Dependency graph
requires:
  - phase: 02-product-scraping
    provides: Scraping orchestrator with provider fallback chains
provides:
  - Cost estimation per scraping provider and platform
  - Cost metadata attached to every scraped product
  - Utilities for aggregating merchant usage
  - Schema documentation for cost storage in Product.metadata
affects: [05-subscription, billing, usage-limits]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Cost metadata attached in orchestrator after successful scrape
    - Provider costs defined as constants for easy updates

key-files:
  created:
    - app/services/scraping/cost-tracker.server.ts
  modified:
    - app/services/scraping/orchestrator.server.ts
    - app/services/scraping/types.ts
    - prisma/schema.prisma

key-decisions:
  - "Cost estimates based on provider pricing tiers (~$15-25 per 1000 requests)"
  - "Compound providers (apify+vision) sum component costs"
  - "Cost metadata stored in Product.metadata.scrapeCost JSON field"

patterns-established:
  - "createCostMetadata() helper for consistent metadata creation"
  - "Cost logging in orchestrator for observability"

# Metrics
duration: 2min
completed: 2026-01-31
---

# Phase 2 Plan 3: Cost Tracking Summary

**Per-provider cost estimation with metadata tracking for subscription tier enforcement in Phase 5**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-31T20:07:47Z
- **Completed:** 2026-01-31T20:09:53Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Created cost tracking service with per-provider/platform cost constants
- Integrated cost calculation into scraping orchestrator
- Added ScrapeCostMetadata interface to ScrapedProduct type
- Documented Product.metadata JSON structure for future reference

## Task Commits

Each task was committed atomically:

1. **Task 1: Create cost tracking service** - `67f1f94` (feat)
2. **Task 2: Integrate cost tracking into orchestrator** - `7d6f64e` (feat)
3. **Task 3: Document metadata schema for cost storage** - `bb06870` (docs)

## Files Created/Modified
- `app/services/scraping/cost-tracker.server.ts` - Cost estimation utilities with provider pricing constants
- `app/services/scraping/orchestrator.server.ts` - Attaches cost metadata after successful scrape
- `app/services/scraping/types.ts` - Added ScrapeCostMetadata interface and costMetadata field
- `prisma/schema.prisma` - Documented expected Product.metadata JSON structure

## Decisions Made
- Cost estimates based on approximate provider pricing tiers:
  - Apify AliExpress: $0.015/request
  - Apify Amazon: $0.020/request
  - Oxylabs AliExpress: $0.025/request
  - Oxylabs Amazon: $0.020/request
  - Vision fallback: $0.005/request
- Compound providers (e.g., "apify+vision") automatically sum component costs
- Cost metadata attached to ScrapedProduct for downstream storage in Product.metadata

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Cost tracking infrastructure ready for Phase 5 subscription enforcement
- Every scrape now produces cost metadata for usage aggregation
- Merchant usage can be summed from Product.metadata.scrapeCost for tier limits

---
*Phase: 02-product-scraping*
*Completed: 2026-01-31*

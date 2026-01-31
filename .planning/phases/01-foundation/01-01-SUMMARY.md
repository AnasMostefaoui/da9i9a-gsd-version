---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [inngest, background-jobs, retry, exponential-backoff]

# Dependency graph
requires: []
provides:
  - Typed Inngest client with event schemas
  - Inngest serve route at /api/inngest
  - Exponential backoff retry utility with presets
affects: [01-02, 02-product-scraping, webhook-processing, token-refresh]

# Tech tracking
tech-stack:
  added: [inngest@3.50.0, exponential-backoff@3.1.3]
  patterns: [typed-events, serve-handler, retry-presets]

key-files:
  created:
    - app/inngest/client.ts
    - app/inngest/types.ts
    - app/inngest/functions/index.ts
    - app/routes/api.inngest.ts
    - app/lib/retry.server.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Used inngest/remix adapter for React Router 7 compatibility"
  - "Defined three event types upfront: webhook.received, token.refresh-needed, product/scrape.requested"
  - "Created retry presets for three use cases: Salla API (5 attempts), scrapers (3 attempts, longer delays), AI APIs (3 attempts, quick retry)"

patterns-established:
  - "Pattern: Server-only files use .server.ts suffix"
  - "Pattern: Inngest functions exported from app/inngest/functions/index.ts registry"
  - "Pattern: Route handlers export both action and loader for full HTTP method support"

# Metrics
duration: 5min
completed: 2026-01-31
---

# Phase 01 Plan 01: Inngest Background Jobs Infrastructure Summary

**Inngest background job infrastructure with typed events and exponential backoff retry utility for Salla API, scrapers, and AI APIs**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-31T18:53:51Z
- **Completed:** 2026-01-31T18:59:39Z
- **Tasks:** 3/3
- **Files modified:** 7

## Accomplishments

- Inngest client initialized with typed event schemas for webhook processing, token refresh, and product scraping
- Serve route at /api/inngest ready to receive events from Inngest cloud
- Exponential backoff utility with presets for Salla API (5 attempts), scrapers (3 attempts), and AI APIs (quick retry)
- Full jitter implemented to prevent thundering herd problem

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and create Inngest client** - `8609a24` (chore)
2. **Task 2: Create Inngest serve route and function registry** - `adfabab` (feat)
3. **Task 3: Create exponential backoff retry utility** - `e207ab3` (feat)

## Files Created/Modified

- `app/inngest/types.ts` - Event type definitions for all Inngest events
- `app/inngest/client.ts` - Typed Inngest client instance
- `app/inngest/functions/index.ts` - Empty function registry (functions added in later plans)
- `app/routes/api.inngest.ts` - Inngest serve handler for React Router 7
- `app/lib/retry.server.ts` - Exponential backoff utility with presets
- `package.json` - Added inngest and exponential-backoff dependencies
- `package-lock.json` - Updated lockfile

## Decisions Made

1. **Used inngest/remix adapter** - React Router 7 is compatible with Remix adapters, avoiding custom implementation
2. **Defined event types upfront** - Created typed events for webhook.received, token.refresh-needed, and product/scrape.requested to ensure type safety across the app
3. **Three retry presets** - Different retry strategies for different external services:
   - Salla API: 5 attempts, 1s-30s delays (handles rate limiting)
   - Scrapers: 3 attempts, 5s-60s delays (handles slow responses)
   - AI APIs: 3 attempts, 500ms-10s delays (quick retry for transient failures)

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required

**External services require manual configuration.** See [01-USER-SETUP.md](./01-USER-SETUP.md) for:
- Environment variables to add (INNGEST_SIGNING_KEY, INNGEST_EVENT_KEY)
- Inngest dev server registration
- Verification commands

## Issues Encountered

None - all tasks completed successfully.

## Next Phase Readiness

- Inngest infrastructure ready for function implementations
- Plan 01-02 (OAuth Token Refresh with Mutex) can build on this foundation
- Background job processing ready for webhook handling and scraping

---
*Phase: 01-foundation*
*Completed: 2026-01-31*

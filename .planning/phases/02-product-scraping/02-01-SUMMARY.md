---
phase: 02-product-scraping
plan: 01
subsystem: api
tags: [inngest, async, scraping, polling, react-router]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Inngest client setup, Prisma schema with Product model
provides:
  - Async product scraping via Inngest job queue
  - Job status polling endpoint for real-time updates
  - Non-blocking import flow with progress UI
affects: [02-ai-enhancement, 03-push-to-salla]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inngest step.run() for automatic retry"
    - "Status polling with redirect on completion"
    - "Product status state machine: IMPORTING -> IMPORTED/FAILED"

key-files:
  created:
    - app/inngest/functions/scrape-product.ts
    - app/routes/api.scrape-status.$jobId.ts
    - app/routes/import.status.$jobId.tsx
  modified:
    - app/inngest/functions/index.ts
    - app/inngest/types.ts
    - app/routes/import.tsx

key-decisions:
  - "Store-then-queue: Create product with IMPORTING status before queueing Inngest job"
  - "Separate polling page for cleaner separation of concerns"
  - "Poll every 2 seconds for responsive UX without server overload"

patterns-established:
  - "Inngest async job pattern: Create record -> Queue job -> Poll status"
  - "Status endpoint returns minimal data for efficient polling"

# Metrics
duration: 7min
completed: 2026-01-31
---

# Phase 2 Plan 1: Async Scraping via Inngest Summary

**Implemented async product scraping with Inngest job queue, status polling endpoint, and non-blocking import flow**

## Performance

- **Duration:** 7 min
- **Started:** 2026-01-31T20:06:42Z
- **Completed:** 2026-01-31T20:14:16Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Created Inngest function `scrape-product` triggered by `product/scrape.requested` event
- Added status polling endpoint `/api/scrape-status/:jobId` with merchant authorization
- Converted import form to queue jobs instead of blocking (30-60s saved)
- Created polling status page with real-time progress indicator
- Auto-redirect to product page on completion, error display on failure

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Inngest scrape-product function** - `21b843b` (feat)
2. **Task 2: Create job status polling endpoint** - `468d76b` (feat)
3. **Task 3: Update import route for async flow** - `ff44f03` (feat)

## Files Created/Modified

- `app/inngest/functions/scrape-product.ts` - Async scraping job handler with step.run() retries
- `app/inngest/functions/index.ts` - Export scrapeProduct function
- `app/inngest/types.ts` - Added product/scrape.completed and product/scrape.failed events
- `app/routes/api.scrape-status.$jobId.ts` - Status polling resource route
- `app/routes/import.status.$jobId.tsx` - Polling UI with progress indicators
- `app/routes/import.tsx` - Queues Inngest job instead of blocking

## Decisions Made

- **Store-then-queue pattern:** Create product with IMPORTING status first, then send Inngest event. This ensures product exists before background job runs.
- **Separate polling page:** Created `import.status.$jobId.tsx` rather than adding polling logic to import.tsx. Cleaner separation of concerns.
- **2-second poll interval:** Balances responsive UX with server load.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- React Router 7 typegen didn't automatically generate types for new route file. Used generic `LoaderFunctionArgs` and `useLoaderData` pattern instead.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Async scraping infrastructure ready for AI enhancement in Phase 3
- Inngest dashboard will show job execution and retries
- Status polling ready for additional status states (ENHANCED, PUSHING, etc.)

---
*Phase: 02-product-scraping*
*Completed: 2026-01-31*

# Phase 01: User Setup Required

**Generated:** 2026-01-31
**Phase:** 01-foundation
**Status:** Incomplete

## Environment Variables

| Status | Variable | Source | Add to |
|--------|----------|--------|--------|
| [ ] | `INNGEST_SIGNING_KEY` | Inngest Dashboard -> Manage -> Signing Key (after npx inngest-cli dev registration) | `.env` |
| [ ] | `INNGEST_EVENT_KEY` | Inngest Dashboard -> Manage -> Event Key | `.env` |

## Service Setup: Inngest

**Why needed:** Background job processing and observability for webhook handling, token refresh, and scraping.

### Local Development Setup

1. **Start Inngest Dev Server:**
   ```bash
   npx inngest-cli@latest dev
   ```
   This opens the Inngest dev UI at http://127.0.0.1:8288

2. **Register your app:**
   - Start your app: `npm run dev`
   - The dev server will auto-discover your app at http://localhost:5173/api/inngest

3. **Get keys for production (optional for dev):**
   - Sign up at https://www.inngest.com
   - Create a new app in the dashboard
   - Navigate to Manage -> Signing Key
   - Copy the signing key and event key

### Environment Configuration

Add to your `.env` file:
```bash
# Inngest (optional for local dev, required for production)
INNGEST_SIGNING_KEY=signkey-...
INNGEST_EVENT_KEY=...
```

## Verification

After completing setup, verify the integration:

```bash
# Start dev server and Inngest
npm run dev &
npx inngest-cli@latest dev

# In another terminal, send a test event
curl -X POST http://localhost:8288/e/inngest-test \
  -H "Content-Type: application/json" \
  -d '{"name": "app/webhook.received", "data": {"event": "test", "merchantSallaId": 123, "payload": {}, "webhookHistoryId": "test-id"}}'
```

You should see the event appear in the Inngest dev UI.

---
**Once all items complete:** Mark status as "Complete"

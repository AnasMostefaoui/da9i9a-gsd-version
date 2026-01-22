# Phase 1: Foundation - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Critical infrastructure working end-to-end with secure Salla integration. This includes:
- Salla OAuth flow (install, token storage, refresh with mutex)
- PostgreSQL database for merchant data
- Inngest job queue system
- Webhook handling for app lifecycle events
- Error handling and retry logic

This phase delivers the plumbing. Product features (scraping, AI, store generation) come later.

</domain>

<critical_constraint>
## MVP Philosophy

**THIS MUST GUIDE ALL PLANNING AND IMPLEMENTATION:**

- **Ship fast, iterate later** — get to market ASAP
- **Target scale:** Solid for 1000-5000 paying users
- **Refactor trigger:** When recurring revenue justifies it
- **Budget:** $200/month total (excluding marketing)

**Practical implications:**
- Manual refresh is fine (no WebSocket complexity)
- Simple solutions over elegant ones
- Don't over-engineer infrastructure
- If a feature can wait until 1000 users, it waits

</critical_constraint>

<decisions>
## Implementation Decisions

### Post-install Experience
- **Language:** Arabic first, English as secondary option
- **Claude's discretion:** Landing page design, standalone vs embedded approach, visual style

### Error Communication
- OAuth failures → Error page with retry button
- Error message style → Technical/precise (not friendly/vague)
- Error tracking → External service (Sentry or similar)
- Background failures (token refresh) → Silent + log, handle on next user visit

### Job Status Visibility
- **Show detailed view** with:
  - Job type + status (e.g., "Product Import - Running")
  - Timestamps (created, started, completed)
  - Progress percentage for multi-step jobs
  - Error details if job failed
- **Actions:** Cancel running jobs, retry failed jobs
- **Updates:** Manual refresh (NOT real-time/WebSocket) — MVP approach

### Webhook Scope
- **Events to handle:** app.installed, app.uninstalled, app.expired, store.updated
- **On uninstall:** Merchant chooses between:
  - Delete data after 30 days
  - Keep data forever (restored on reinstall)
- **Failure handling:** Auto-retry 3x with backoff
- **History:** Store last 100 webhooks per merchant in database

### Claude's Discretion
- OAuth callback landing page layout
- Standalone app vs Salla embedded (research best practice)
- Visual style and branding
- Error tracking service selection (Sentry, LogRocket, etc.)
- Exact retry backoff timing for webhooks

</decisions>

<specifics>
## Specific Ideas

- User emphasized: "if refreshing does it, no one will mind refreshing for 2s if we are saving them a day worth of work"
- This is a dropshipping tool — speed to market matters more than polish
- Technical error messages preferred over friendly ones (users are setting up a business tool)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-01-22*

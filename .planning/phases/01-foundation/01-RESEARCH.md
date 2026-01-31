# Phase 1: Foundation - Research

**Researched:** 2026-01-31
**Domain:** Salla OAuth, Background Jobs (Inngest), Error Tracking, Webhook Handling
**Confidence:** HIGH

## Summary

This research focuses on what's MISSING or needs improvement in the existing Phase 1 codebase. The codebase already has working implementations of: OAuth flow, token refresh with PostgreSQL FOR UPDATE locking, webhook handlers for app.installed/app.uninstalled, session management, Prisma schema, and the SallaClient service.

The key gaps requiring implementation are:
1. **Inngest background job system** - Not set up at all (no inngest files found)
2. **Error tracking** - No Sentry or similar service configured
3. **Webhook improvements** - Missing app.expired handling, webhook history storage, and the store.updated event
4. **Job status visibility** - UI components for showing job status (manual refresh per MVP philosophy)

**Primary recommendation:** Set up Inngest with Remix handler pattern, add Sentry for error tracking, and extend webhook handling to cover all required events with history storage.

## Standard Stack

The established libraries/tools for this phase:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| inngest | 3.49.3 | Background job queue | Zero-infra, durable execution, built-in retries, official Remix support |
| @sentry/react | 10.33.0 | Error tracking | Industry standard, React 19 support, ErrorBoundary component |
| exponential-backoff | 3.x | Retry logic | Simple API, jitter support, TypeScript native |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| inngest-cli | 1.12.1 | Local dev server | Development and testing of Inngest functions |

### Already Installed (No Action Needed)
| Library | Version | Purpose |
|---------|---------|---------|
| @prisma/client | 6.9.0 | Database ORM - already configured |
| react-router | 7.12.0 | Framework - already configured |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inngest | BullMQ + Redis | More infrastructure to manage, higher operational cost |
| Sentry | LogRocket | Sentry better for errors, LogRocket better for session replay |
| exponential-backoff | Custom implementation | Library handles edge cases (jitter, max delay) correctly |

**Installation:**
```bash
npm install inngest @sentry/react exponential-backoff
npm install -D inngest-cli
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── inngest/
│   ├── client.ts           # Inngest client setup
│   ├── functions/
│   │   ├── index.ts        # Export all functions
│   │   ├── token-refresh.ts
│   │   └── webhook-process.ts
│   └── types.ts            # Event type definitions
├── routes/
│   └── api.inngest.ts      # Inngest serve handler
├── lib/
│   ├── sentry.client.ts    # Sentry browser init
│   └── retry.server.ts     # Exponential backoff utility
└── services/
    └── salla/              # Existing - no changes needed
```

### Pattern 1: Inngest Remix Handler
**What:** Serve Inngest functions via a single API route
**When to use:** Always - this is the standard pattern for Remix/React Router

```typescript
// app/routes/api.inngest.ts
// Source: https://www.inngest.com/docs/learn/serving-inngest-functions
import { serve } from "inngest/remix";
import { inngest } from "~/inngest/client";
import { functions } from "~/inngest/functions";

const handler = serve({
  client: inngest,
  functions,
});

export { handler as action, handler as loader };
```

### Pattern 2: Inngest Client with Typed Events
**What:** Type-safe event definitions for Inngest
**When to use:** Always - prevents typos and enables autocomplete

```typescript
// app/inngest/client.ts
// Source: https://www.inngest.com/docs/typescript
import { Inngest } from "inngest";

type Events = {
  "app/webhook.received": {
    data: {
      event: string;
      merchantSallaId: number;
      payload: unknown;
    };
  };
  "app/token.refresh-needed": {
    data: {
      merchantId: string;
    };
  };
};

export const inngest = new Inngest({
  id: "salla-da9i9a",
  schemas: new EventSchemas().fromRecord<Events>(),
});
```

### Pattern 3: Job Status via Inngest REST API
**What:** Query job status for custom UI display
**When to use:** For job status visibility feature (manual refresh per MVP)

```typescript
// Source: https://www.inngest.com/docs/examples/fetch-run-status-and-output
async function getJobStatus(eventId: string) {
  const response = await fetch(
    `https://api.inngest.com/v1/events/${eventId}/runs`,
    {
      headers: {
        Authorization: `Bearer ${process.env.INNGEST_SIGNING_KEY}`,
      },
    }
  );
  const json = await response.json();
  return json.data; // Contains status, output, timestamps
}
// Status values: "Completed", "Failed", "Cancelled", "Running"
```

### Pattern 4: Sentry Error Boundary for React 19
**What:** Automatic error capture with fallback UI
**When to use:** Wrap app root and critical sections

```typescript
// Source: https://docs.sentry.io/platforms/javascript/guides/react/
import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";

const root = createRoot(document.getElementById("app")!, {
  onUncaughtError: Sentry.reactErrorHandler(),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
});

// In components:
<Sentry.ErrorBoundary fallback={<ErrorPage />}>
  <App />
</Sentry.ErrorBoundary>
```

### Anti-Patterns to Avoid
- **Multiple refresh token uses:** Salla invalidates tokens on reuse - existing FOR UPDATE locking handles this correctly
- **Synchronous webhook processing:** Always queue to Inngest, respond 200 immediately
- **Storing tokens in localStorage:** Already using secure server-side sessions - keep it that way
- **Retrying without backoff:** Always use exponential backoff with jitter for external APIs

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Job queue | Redis + custom worker | Inngest | Handles retries, observability, scaling |
| Retry logic | Simple loop with setTimeout | exponential-backoff | Handles jitter, max delay, edge cases |
| Error tracking | console.error + custom logging | Sentry | Stack traces, user context, alerting |
| Job status polling | Custom database table | Inngest REST API | Already tracks all run states |

**Key insight:** Background job infrastructure seems simple until you need retries, observability, and durability. Inngest provides all of this with zero infrastructure overhead, which aligns with the MVP philosophy and $200/month budget.

## Common Pitfalls

### Pitfall 1: Refresh Token Reuse (CRITICAL)
**What goes wrong:** Using the same refresh token twice causes Salla to invalidate ALL tokens, requiring app reinstall
**Why it happens:** Race conditions when multiple requests try to refresh simultaneously
**How to avoid:** Already handled - existing `token-refresh.server.ts` uses PostgreSQL FOR UPDATE locking
**Warning signs:** 401 errors appearing in logs after periods of high traffic

### Pitfall 2: Webhook Signature Verification Bypass
**What goes wrong:** Accepting unverified webhooks allows spoofed events
**Why it happens:** Existing code allows unsigned webhooks in development mode
**How to avoid:** Remove the development bypass before production deploy, or use a more explicit flag
**Warning signs:** Unexplained merchant status changes

### Pitfall 3: Blocking Webhook Responses
**What goes wrong:** Processing webhook inline causes timeout, Salla retries 3x
**Why it happens:** Webhook processing takes >5 seconds (Salla retry interval)
**How to avoid:** Queue to Inngest immediately, respond 200
**Warning signs:** Duplicate webhook events in logs

### Pitfall 4: Missing app.subscription.expired Handling
**What goes wrong:** Paid merchants whose subscription expires continue using app
**Why it happens:** Only handling app.trial.expired, not app.subscription.expired
**How to avoid:** Handle both events with same "mark as EXPIRED" logic
**Warning signs:** None until customer complaints about unpaid merchants

### Pitfall 5: Inngest Signing Key Exposure
**What goes wrong:** API calls fail or malicious events get processed
**Why it happens:** INNGEST_SIGNING_KEY not set or accidentally exposed
**How to avoid:** Set in Railway environment variables, never commit to git
**Warning signs:** 401 errors from Inngest, or unexpected function invocations

## Code Examples

Verified patterns from official sources:

### Inngest Function with Retry Steps
```typescript
// Source: https://www.inngest.com/docs/guides/background-jobs
export const processWebhook = inngest.createFunction(
  { id: "process-webhook" },
  { event: "app/webhook.received" },
  async ({ event, step }) => {
    // Each step.run automatically retries on failure
    const merchant = await step.run("lookup-merchant", async () => {
      return db.merchant.findUnique({
        where: { sallaId: event.data.merchantSallaId },
      });
    });

    if (!merchant) {
      // Return early - merchant doesn't exist yet
      return { status: "skipped", reason: "merchant-not-found" };
    }

    await step.run("process-event", async () => {
      // Event-specific processing
    });

    return { status: "processed" };
  }
);
```

### Webhook Handler with Immediate Queue
```typescript
// Updated webhook handler pattern
export async function action({ request }: ActionFunctionArgs) {
  // Verify signature (keep existing logic)
  // ...

  // Parse payload
  const payload = JSON.parse(rawBody);

  // Store webhook in history (new requirement)
  await db.webhookHistory.create({
    data: {
      merchantSallaId: payload.merchant,
      event: payload.event,
      payload: payload,
      receivedAt: new Date(),
    },
  });

  // Queue for processing - don't block response
  await inngest.send({
    name: "app/webhook.received",
    data: {
      event: payload.event,
      merchantSallaId: payload.merchant,
      payload: payload.data,
    },
  });

  // Always return 200 immediately
  return Response.json({ success: true });
}
```

### Exponential Backoff for External APIs
```typescript
// Source: https://www.npmjs.com/package/exponential-backoff
import { backOff } from "exponential-backoff";

async function callSallaApiWithRetry<T>(
  apiCall: () => Promise<T>
): Promise<T> {
  return backOff(apiCall, {
    numOfAttempts: 5,
    startingDelay: 1000, // 1 second
    timeMultiple: 2,     // 1s, 2s, 4s, 8s, 16s
    maxDelay: 30000,     // Cap at 30 seconds
    jitter: "full",      // Prevent thundering herd
    retry: (error: Error) => {
      // Only retry on transient errors
      const message = error.message || "";
      return (
        message.includes("429") || // Rate limited
        message.includes("500") || // Server error
        message.includes("503") || // Unavailable
        message.includes("ECONNRESET")
      );
    },
  });
}
```

### Sentry Initialization for React Router
```typescript
// app/lib/sentry.client.ts
// Source: https://docs.sentry.io/platforms/javascript/guides/react/
import * as Sentry from "@sentry/react";

export function initSentry() {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    enabled: import.meta.env.PROD,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 0.1,  // 10% of transactions
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| BullMQ + Redis | Inngest (serverless) | 2023-2024 | Zero infrastructure, better DX |
| Custom error logging | Sentry with session replay | Ongoing | Faster debugging with visual context |
| Remix v1 | React Router v7 | 2024 | Different serve import path |
| Sentry v7 | Sentry v10 | 2024 | React 19 error hooks support |

**Deprecated/outdated:**
- Remix v1 Inngest example (archived April 2024): Pattern still works but import from "inngest/remix" directly
- Sentry v7 ErrorBoundary: Works but v10 has React 19 native error hooks

## Open Questions

Things that couldn't be fully resolved:

1. **Inngest Free Tier Limits**
   - What we know: Inngest has a free tier suitable for MVP
   - What's unclear: Exact limits on runs/month, step executions
   - Recommendation: Start with free tier, monitor usage, upgrade if needed

2. **Salla Webhook Retry Exact Timing**
   - What we know: Retries 3 times at ~5 minute intervals
   - What's unclear: Exact backoff timing, whether it's configurable
   - Recommendation: Always respond quickly, handle idempotently

3. **React Router v7 + Sentry Browser Tracing**
   - What we know: Sentry has reactRouterV7BrowserTracingIntegration
   - What's unclear: Full compatibility with React Router 7.12.0
   - Recommendation: Add integration, test in staging before production

## Sources

### Primary (HIGH confidence)
- [Inngest Background Jobs Guide](https://www.inngest.com/docs/guides/background-jobs) - Function creation, retry patterns
- [Inngest Serve Documentation](https://www.inngest.com/docs/learn/serving-inngest-functions) - Handler setup, supported frameworks
- [Inngest Run Status API](https://www.inngest.com/docs/examples/fetch-run-status-and-output) - Job status querying
- [Sentry React Documentation](https://docs.sentry.io/platforms/javascript/guides/react/) - Installation, React 19 hooks
- [Salla Authorization Docs](https://docs.salla.dev/doc-421118) - OAuth flow, refresh token behavior
- [Salla Webhooks Docs](https://docs.salla.dev/doc-421119) - Signature verification, retry behavior
- [Salla App Events](https://docs.salla.dev/421413m0) - All 14 app event types documented

### Secondary (MEDIUM confidence)
- [exponential-backoff npm](https://www.npmjs.com/package/exponential-backoff) - API documentation, configuration options
- [Inngest Remix GitHub Example](https://github.com/inngest/sdk-example-remix-vercel) - File structure reference (archived but pattern valid)

### Tertiary (LOW confidence)
- None - all critical findings verified with official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via official docs and npm
- Architecture: HIGH - Patterns from official Inngest and Sentry documentation
- Pitfalls: HIGH - Salla refresh token behavior explicitly documented, other pitfalls from official sources

**Research date:** 2026-01-31
**Valid until:** 2026-03-01 (30 days - stable libraries, minimal churn expected)

---

## Appendix: What Already Exists (No Research Needed)

The following are already implemented and working. Research confirmed they follow best practices:

| Component | File | Status |
|-----------|------|--------|
| OAuth flow | `app/routes/auth/salla.tsx` | Working - generates state for CSRF |
| OAuth callback | `app/routes/auth/salla.callback.tsx` | Working - exchanges code, stores tokens |
| Token refresh mutex | `app/lib/token-refresh.server.ts` | Correct - uses FOR UPDATE locking |
| Webhook signature | `app/routes/api.webhooks.salla.ts` | Working - HMAC-SHA256 verification |
| Session management | `app/lib/session.server.ts` | Working - httpOnly, secure cookies |
| Prisma schema | `prisma/schema.prisma` | Complete - Merchant, Product models |
| SallaClient | `app/services/salla/client.ts` | Working - API wrapper with refresh |

## Appendix: Salla Webhook Events Reference

All 14 app events that Salla can send (from official docs):

| Event | Trigger | Action Required |
|-------|---------|-----------------|
| `app.store.authorize` | Initial authorization | Handled by OAuth callback |
| `app.installed` | App installed | Mark merchant ACTIVE (exists) |
| `app.updated` | Developer updates app | Log only |
| `app.uninstalled` | App uninstalled | Mark merchant UNINSTALLED (exists) |
| `app.trial.started` | Trial begins | Log only |
| `app.trial.expired` | Trial ends | Mark merchant EXPIRED (NEW) |
| `app.trial.canceled` | Trial canceled | Mark merchant EXPIRED |
| `app.subscription.started` | Paid subscription starts | Mark merchant ACTIVE |
| `app.subscription.expired` | Paid subscription expires | Mark merchant EXPIRED (NEW) |
| `app.subscription.canceled` | Subscription canceled | Mark merchant EXPIRED |
| `app.subscription.renewed` | Subscription renewed | Mark merchant ACTIVE |
| `app.feedback.created` | Merchant submits review | Log for analytics |
| `app.settings.updated` | App settings changed | Refresh cached settings |
| `store.updated` | Store info changes | Update merchant record (NEW) |

**NEW = Required by phase but not yet implemented**

/**
 * Salla Webhooks Handler
 *
 * Handles webhook events from Salla by:
 * 1. Verifying signature
 * 2. Storing in WebhookHistory for audit
 * 3. Queueing to Inngest for async processing
 * 4. Returning 200 immediately (non-blocking)
 *
 * POST /api/webhooks/salla
 *
 * @see https://docs.salla.dev/doc-421119
 */

import type { ActionFunctionArgs } from "react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "~/lib/db.server";
import { inngest } from "~/inngest/client";

// Webhook event types (all events we care about)
type SallaWebhookEvent =
  | "app.installed"
  | "app.uninstalled"
  | "app.store.authorize"
  | "app.trial.expired"
  | "app.subscription.expired"
  | "store.updated";

interface SallaWebhookPayload {
  event: string; // Using string to accept any event
  merchant: number; // Salla merchant ID
  created_at: string;
  data: Record<string, unknown>;
}

/**
 * Verify webhook signature using HMAC-SHA256
 */
function verifySignature(payload: string, signature: string, secret: string): boolean {
  if (!signature || !secret) {
    return false;
  }

  const computedSignature = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  // Use timing-safe comparison to prevent timing attacks
  try {
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature)
    );
  } catch {
    // Buffers have different lengths
    return false;
  }
}

export async function action({ request }: ActionFunctionArgs) {
  // Only accept POST requests
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  // Get raw body for signature verification
  const rawBody = await request.text();

  // Verify signature
  const signature = request.headers.get("x-salla-signature");
  const webhookSecret = process.env.SALLA_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[Webhook] SALLA_WEBHOOK_SECRET not configured");
    // In development, allow unsigned webhooks for testing
    if (process.env.NODE_ENV === "production") {
      return Response.json({ error: "Webhook secret not configured" }, { status: 500 });
    }
  } else if (!verifySignature(rawBody, signature || "", webhookSecret)) {
    console.error("[Webhook] Invalid signature");
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Parse the payload
  let payload: SallaWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error("[Webhook] Invalid JSON payload");
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event, merchant: sallaId, data } = payload;

  console.log(`[Webhook] Received event: ${event} for merchant: ${sallaId}`);

  // Step 1: Store in webhook history FIRST (before any processing)
  const webhookHistory = await db.webhookHistory.create({
    data: {
      merchantSallaId: sallaId,
      event,
      payload: JSON.parse(JSON.stringify(payload)), // Ensure proper JSON serialization for Prisma
      status: "RECEIVED",
    },
  });

  console.log(`[Webhook] Stored in history: ${webhookHistory.id}`);

  // Step 2: Queue to Inngest for async processing
  // This returns immediately - processing happens in background
  try {
    await inngest.send({
      name: "app/webhook.received",
      data: {
        event,
        merchantSallaId: sallaId,
        payload: data,
        webhookHistoryId: webhookHistory.id,
      },
    });
    console.log(`[Webhook] Queued to Inngest: ${webhookHistory.id}`);
  } catch (error) {
    // Log but don't fail - we already stored in history
    console.error("[Webhook] Failed to queue to Inngest:", error);
    // Mark as failed in history since we couldn't queue it
    await db.webhookHistory.update({
      where: { id: webhookHistory.id },
      data: {
        status: "FAILED",
        error: error instanceof Error ? error.message : "Failed to queue to Inngest",
        processedAt: new Date(),
      },
    });
  }

  // Always return 200 immediately to acknowledge receipt
  // Salla will retry 3 times if it doesn't get a 200
  // Actual processing happens async in Inngest
  return Response.json({
    success: true,
    event,
    webhookHistoryId: webhookHistory.id,
  });
}

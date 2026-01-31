/**
 * Salla Webhooks Handler
 *
 * Handles webhook events from Salla:
 * - app.installed: Merchant installed the app
 * - app.uninstalled: Merchant uninstalled the app
 *
 * POST /api/webhooks/salla
 *
 * @see https://docs.salla.dev/doc-421119
 */

import type { ActionFunctionArgs } from "react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "~/lib/db.server";

// Webhook event types
type SallaWebhookEvent = "app.installed" | "app.uninstalled" | "app.store.authorize";

interface SallaWebhookPayload {
  event: SallaWebhookEvent;
  merchant: number; // Salla merchant ID
  created_at: string;
  data: {
    id: number;
    app_name: string;
    app_type?: string;
    installation_date?: string;
    uninstallation_date?: string;
    store_type?: string;
    [key: string]: unknown;
  };
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

  switch (event) {
    case "app.installed": {
      // Merchant installed the app
      // The OAuth flow should have already created the merchant record
      // This webhook confirms the installation
      await db.merchant.updateMany({
        where: { sallaId },
        data: {
          status: "ACTIVE",
          uninstalledAt: null,
        },
      });

      console.log(`[Webhook] Merchant ${sallaId} marked as ACTIVE`);
      break;
    }

    case "app.uninstalled": {
      // Merchant uninstalled the app
      // Mark as uninstalled but keep data for potential re-installation
      const uninstallDate = data.uninstallation_date
        ? new Date(data.uninstallation_date)
        : new Date();

      await db.merchant.updateMany({
        where: { sallaId },
        data: {
          status: "UNINSTALLED",
          uninstalledAt: uninstallDate,
        },
      });

      console.log(`[Webhook] Merchant ${sallaId} marked as UNINSTALLED`);

      // Note: Data retention policy (DELETE_AFTER_30_DAYS vs KEEP_FOREVER)
      // should be handled by a scheduled job, not here
      break;
    }

    case "app.store.authorize": {
      // This event fires when merchant first authorizes the app
      // The OAuth callback should handle token storage
      // This is informational only
      console.log(`[Webhook] Merchant ${sallaId} authorized app`);
      break;
    }

    default: {
      // Unknown event - log but don't fail
      console.log(`[Webhook] Unhandled event: ${event}`);
    }
  }

  // Always return 200 to acknowledge receipt
  // Salla will retry 3 times if it doesn't get a 200
  return Response.json({ success: true, event });
}

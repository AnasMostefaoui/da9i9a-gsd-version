/**
 * Webhook Processing Inngest Function
 *
 * Handles Salla webhook events asynchronously:
 * - app.installed: Mark merchant as ACTIVE
 * - app.uninstalled: Mark merchant as UNINSTALLED
 * - app.trial.expired: Mark merchant as EXPIRED
 * - app.subscription.expired: Mark merchant as EXPIRED
 * - store.updated: Update merchant store info
 *
 * Events are queued from the webhook handler for async processing
 * with automatic retries and error tracking.
 */

import { inngest } from "../client";
import { db } from "~/lib/db.server";

// Salla webhook payload structure
interface SallaWebhookData {
  id?: number;
  app_name?: string;
  app_type?: string;
  installation_date?: string;
  uninstallation_date?: string;
  store_type?: string;
  store?: {
    name?: string;
    domain?: string;
    email?: string;
  };
  [key: string]: unknown;
}

export const processWebhook = inngest.createFunction(
  {
    id: "process-salla-webhook",
    // Inngest retry configuration - 5 retries with exponential backoff
    retries: 5,
  },
  { event: "app/webhook.received" },
  async ({ event, step }) => {
    const { event: webhookEvent, merchantSallaId, payload, webhookHistoryId } =
      event.data;

    // Mark webhook as processing
    await step.run("mark-processing", async () => {
      await db.webhookHistory.update({
        where: { id: webhookHistoryId },
        data: { status: "PROCESSING" },
      });
    });

    try {
      // Process based on event type
      await step.run("process-event", async () => {
        const data = payload as SallaWebhookData;

        switch (webhookEvent) {
          case "app.installed": {
            // Merchant installed the app - mark as ACTIVE
            await db.merchant.updateMany({
              where: { sallaId: merchantSallaId },
              data: {
                status: "ACTIVE",
                uninstalledAt: null,
              },
            });
            console.log(
              `[Webhook] Merchant ${merchantSallaId} marked as ACTIVE`
            );
            break;
          }

          case "app.uninstalled": {
            // Merchant uninstalled the app
            const uninstallDate = data.uninstallation_date
              ? new Date(data.uninstallation_date)
              : new Date();

            await db.merchant.updateMany({
              where: { sallaId: merchantSallaId },
              data: {
                status: "UNINSTALLED",
                uninstalledAt: uninstallDate,
              },
            });
            console.log(
              `[Webhook] Merchant ${merchantSallaId} marked as UNINSTALLED`
            );
            break;
          }

          case "app.trial.expired": {
            // Trial period expired - mark as EXPIRED
            await db.merchant.updateMany({
              where: { sallaId: merchantSallaId },
              data: {
                status: "EXPIRED",
              },
            });
            console.log(
              `[Webhook] Merchant ${merchantSallaId} trial expired - marked as EXPIRED`
            );
            break;
          }

          case "app.subscription.expired": {
            // Subscription expired - mark as EXPIRED
            await db.merchant.updateMany({
              where: { sallaId: merchantSallaId },
              data: {
                status: "EXPIRED",
              },
            });
            console.log(
              `[Webhook] Merchant ${merchantSallaId} subscription expired - marked as EXPIRED`
            );
            break;
          }

          case "store.updated": {
            // Store information updated - update merchant record
            if (data.store) {
              const updateData: {
                storeName?: string;
                storeUrl?: string;
                email?: string;
              } = {};

              if (data.store.name) {
                updateData.storeName = data.store.name;
              }
              if (data.store.domain) {
                updateData.storeUrl = data.store.domain;
              }
              if (data.store.email) {
                updateData.email = data.store.email;
              }

              if (Object.keys(updateData).length > 0) {
                await db.merchant.updateMany({
                  where: { sallaId: merchantSallaId },
                  data: updateData,
                });
                console.log(
                  `[Webhook] Merchant ${merchantSallaId} store info updated`
                );
              }
            }
            break;
          }

          case "app.store.authorize": {
            // This event fires when merchant first authorizes the app
            // OAuth callback handles token storage - this is informational
            console.log(
              `[Webhook] Merchant ${merchantSallaId} authorized app`
            );
            break;
          }

          default: {
            // Unknown event - log but don't fail
            console.log(`[Webhook] Unhandled event: ${webhookEvent}`);
          }
        }
      });

      // Mark webhook as processed
      await step.run("mark-processed", async () => {
        await db.webhookHistory.update({
          where: { id: webhookHistoryId },
          data: {
            status: "PROCESSED",
            processedAt: new Date(),
          },
        });
      });

      return { success: true, event: webhookEvent };
    } catch (error) {
      // Mark webhook as failed with error message
      await step.run("mark-failed", async () => {
        await db.webhookHistory.update({
          where: { id: webhookHistoryId },
          data: {
            status: "FAILED",
            processedAt: new Date(),
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
      });

      // Re-throw to trigger Inngest retry
      throw error;
    }
  }
);

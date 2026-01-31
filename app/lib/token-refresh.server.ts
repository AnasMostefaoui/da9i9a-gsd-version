import { db } from "./db.server";
import { SallaClient } from "~/services/salla";
import type { Merchant } from "@prisma/client";

/**
 * Get a valid access token for a merchant, refreshing if needed.
 * Uses PostgreSQL FOR UPDATE to prevent race conditions with single-use refresh tokens.
 *
 * @param merchantId - The merchant's database ID
 * @returns Fresh access token
 * @throws Error if refresh fails
 */
export async function getValidAccessToken(merchantId: string): Promise<string> {
  return db.$transaction(async (tx) => {
    // Lock the merchant row - other concurrent requests will wait here
    const merchants = await tx.$queryRaw<Merchant[]>`
      SELECT * FROM merchants
      WHERE id = ${merchantId}
      FOR UPDATE
    `;

    const merchant = merchants[0];
    if (!merchant) {
      throw new Error("Merchant not found");
    }

    // Check if token is still valid (with 60s buffer)
    const bufferMs = 60 * 1000;
    const isExpired = new Date() >= new Date(merchant.tokenExpiresAt.getTime() - bufferMs);

    if (!isExpired) {
      // Token still valid, return it
      return merchant.accessToken;
    }

    // Token expired, refresh it
    console.log(`[TokenRefresh] Refreshing token for merchant ${merchantId}`);

    try {
      const newTokens = await SallaClient.refreshToken(
        process.env.SALLA_CLIENT_ID!,
        process.env.SALLA_CLIENT_SECRET!,
        merchant.refreshToken
      );

      // Update merchant with new tokens
      await tx.merchant.update({
        where: { id: merchantId },
        data: {
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token,
          tokenExpiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
        },
      });

      console.log(`[TokenRefresh] Token refreshed for merchant ${merchantId}`);
      return newTokens.access_token;

    } catch (error) {
      console.error(`[TokenRefresh] Failed for merchant ${merchantId}:`, error);

      // Mark merchant as expired if refresh fails
      await tx.merchant.update({
        where: { id: merchantId },
        data: { status: "EXPIRED" },
      });

      throw new Error("Token refresh failed. Merchant needs to re-authorize.");
    }
  }, {
    // Increase timeout for external API call
    timeout: 30000,
  });
}

/**
 * Get a SallaClient instance with a valid token.
 * Handles token refresh automatically with proper locking.
 */
export async function getSallaClient(merchantId: string): Promise<SallaClient> {
  const accessToken = await getValidAccessToken(merchantId);
  return new SallaClient(accessToken);
}

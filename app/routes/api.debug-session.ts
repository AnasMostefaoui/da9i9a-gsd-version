/**
 * Debug endpoint to check session status
 * Access: GET /api/debug-session
 *
 * Returns session info without sensitive data
 */

import type { LoaderFunctionArgs } from "react-router";
import { getMerchantId, getSession } from "~/lib/session.server";
import { db } from "~/lib/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const session = await getSession(request);
  const merchantId = await getMerchantId(request);

  let merchantStatus = null;
  if (merchantId) {
    const merchant = await db.merchant.findUnique({
      where: { id: merchantId },
      select: { status: true, storeName: true },
    });
    merchantStatus = merchant;
  }

  return Response.json({
    hasCookie: !!cookieHeader,
    cookieNames: cookieHeader?.split(";").map(c => c.trim().split("=")[0]) || [],
    hasSessionCookie: cookieHeader?.includes("__session") || false,
    sessionData: {
      hasMerchantId: !!session.get("merchantId"),
      merchantIdPrefix: merchantId ? merchantId.substring(0, 8) + "..." : null,
    },
    merchantStatus,
    timestamp: new Date().toISOString(),
  });
}

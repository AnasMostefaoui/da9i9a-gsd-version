/**
 * Job Status Polling Endpoint
 *
 * Resource route for polling scraping job status.
 * Used by the import status page to check progress.
 *
 * GET /api/scrape-status/:jobId
 *
 * Returns:
 * {
 *   "status": "IMPORTING" | "IMPORTED" | "ENHANCED" | "FAILED",
 *   "productId": "clx...",
 *   "error": null | "Error message"
 * }
 */

import type { LoaderFunctionArgs } from "react-router";
import { db } from "~/lib/db.server";
import { requireMerchant } from "~/lib/session.server";

interface ScrapeStatusResponse {
  status: "IMPORTING" | "IMPORTED" | "ENHANCED" | "FAILED";
  productId: string;
  error: string | null;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  // Require authentication
  const merchantId = await requireMerchant(request);

  const jobId = params.jobId;

  if (!jobId) {
    return Response.json({ error: "Job ID is required" }, { status: 400 });
  }

  // Find the product (job ID is product ID)
  const product = await db.product.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      merchantId: true,
      status: true,
      metadata: true,
    },
  });

  if (!product) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  // Security: Only allow merchant to check their own products
  if (product.merchantId !== merchantId) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Extract error from metadata if status is FAILED
  let error: string | null = null;
  if (product.status === "FAILED" && product.metadata) {
    const metadata = product.metadata as Record<string, unknown>;
    error = (metadata.scrapeError as string) || "Unknown error";
  }

  const response: ScrapeStatusResponse = {
    status: product.status as ScrapeStatusResponse["status"],
    productId: product.id,
    error,
  };

  return Response.json(response);
}

/**
 * AI Processing Status Polling Endpoint
 *
 * Resource route for polling AI task progress.
 * Used by the product page to show processing state.
 *
 * GET /api/ai-status/:productId
 *
 * Returns:
 * {
 *   "processing": boolean,
 *   "tasks": ["enhance", "translate", "landing-page"],
 *   "completedTasks": ["enhance"],
 *   "errors": ["task: error message"],
 *   "status": "IMPORTED" | "ENHANCED" | etc.
 * }
 */

import type { LoaderFunctionArgs } from "react-router";
import { db } from "~/lib/db.server";
import { requireMerchant } from "~/lib/session.server";

interface AIStatusResponse {
  processing: boolean;
  tasks: string[];
  completedTasks: string[];
  errors: string[];
  status: string;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const merchantId = await requireMerchant(request);
  const productId = params.productId;

  if (!productId) {
    return Response.json({ error: "Product ID is required" }, { status: 400 });
  }

  const product = await db.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      merchantId: true,
      status: true,
      metadata: true,
    },
  });

  if (!product) {
    return Response.json({ error: "Product not found" }, { status: 404 });
  }

  if (product.merchantId !== merchantId) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const metadata = (product.metadata as Record<string, unknown>) || {};

  // Check if AI processing is active
  const processing = metadata.aiProcessing === true;
  const tasks = (metadata.aiTasks as string[]) || [];
  const aiResults = (metadata.aiResults as Record<string, boolean>) || {};
  const errors = (metadata.aiErrors as string[]) || [];

  // Completed tasks are those with true in aiResults
  const completedTasks = Object.entries(aiResults)
    .filter(([, success]) => success)
    .map(([task]) => task);

  const response: AIStatusResponse = {
    processing,
    tasks,
    completedTasks,
    errors,
    status: product.status,
  };

  return Response.json(response);
}

/**
 * Landing Page API Endpoint
 * Returns landing page content for a Salla product
 *
 * GET /api/landing/:productId (Salla product ID)
 */

import type { LoaderFunctionArgs } from "react-router";
import { db } from "~/lib/db.server";
import { getPalette } from "~/lib/color-palettes";

export async function loader({ params }: LoaderFunctionArgs) {
  const sallaProductId = params.productId;

  if (!sallaProductId) {
    return Response.json({ error: "Product ID required" }, { status: 400 });
  }

  // Find product by Salla product ID
  const product = await db.product.findFirst({
    where: { sallaProductId: parseInt(sallaProductId, 10) },
    select: {
      id: true,
      sallaProductId: true,
      landingPageContent: true,
      contentLang: true,
      colorPalette: true,
      titleAr: true,
      titleEn: true,
      price: true,
      currency: true,
      images: true,
      selectedImages: true,
    },
  });

  if (!product) {
    return Response.json({ error: "Product not found" }, { status: 404 });
  }

  if (!product.landingPageContent) {
    return Response.json({ error: "No landing page generated" }, { status: 404 });
  }

  // Get selected images or first 5
  const images = product.selectedImages.length > 0
    ? product.selectedImages.map(i => product.images[i]).filter(Boolean)
    : product.images.slice(0, 5);

  // Get the color palette
  const palette = getPalette(product.colorPalette);

  return Response.json({
    success: true,
    data: {
      productId: product.sallaProductId,
      lang: product.contentLang,
      title: product.contentLang === "ar" ? product.titleAr : product.titleEn,
      price: product.price,
      currency: product.currency,
      images,
      content: product.landingPageContent,
      palette,
    },
  }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=60",
    },
  });
}

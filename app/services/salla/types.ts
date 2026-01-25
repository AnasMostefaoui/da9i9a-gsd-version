/**
 * Salla API Types
 * Based on Salla Merchant API
 */

export interface SallaTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: "Bearer";
}

export interface SallaMerchant {
  id: number;
  store_name: string;
  store_url: string;
  email: string;
  mobile: string;
  plan: string;
}

export interface SallaProduct {
  id?: number;

  // Required fields
  name: string;
  price: number;
  product_type: "product" | "service" | "group_products" | "codes" | "digital" | "food" | "booking" | "donating";

  // Common optional fields
  description?: string;
  status?: "sale" | "out" | "hidden" | "deleted";
  quantity?: number;
  unlimited_quantity?: boolean;
  sale_price?: number;
  cost_price?: number;
  sale_start?: string; // ISO date
  sale_end?: string; // ISO date
  categories?: number[];
  brand_id?: number;
  tags?: number[];

  // Product identifiers
  sku?: string; // Must be unique
  mpn?: string;
  gtin?: string; // 8, 12, 13, or 14 digits

  // Shipping (weight required when require_shipping=true)
  require_shipping?: boolean;
  weight?: number;
  weight_type?: "kg" | "g" | "lb" | "oz";

  // Display options
  hide_quantity?: boolean;
  enable_upload_image?: boolean;
  enable_note?: boolean;
  pinned?: boolean;
  active_advance?: boolean;
  subtitle?: string;
  promotion_title?: string;
  promotion_subtitle?: string;
  maximum_quantity_per_order?: number;
  channels?: ("app" | "web")[];

  // SEO fields (metadata_title max 70 chars)
  metadata_title?: string;
  metadata_description?: string;
  metadata_url?: string;

  // Tax
  with_tax?: boolean;
  tax_reason_code?: string;

  // Images
  images?: SallaProductImageCreate[];

  // Product-type specific
  calories?: string; // Food products only
  min_amount_donating?: number;
  max_amount_donating?: number;
}

export interface SallaProductImageCreate {
  photo?: string;      // base64 data URI (alternative to original)
  original?: string;   // Image URL (Salla fetches it)
  thumbnail?: string;  // Thumbnail URL
  alt?: string;        // Alt text
  default?: boolean;   // Is default image
  sort: number;        // Display order
}

export interface SallaWebhookEvent {
  event: string;
  merchant: number;
  created_at: string;
  data: Record<string, unknown>;
}

/**
 * Webhook event types we handle
 */
export type SallaWebhookEventType =
  | "app.installed"
  | "app.uninstalled"
  | "app.expired"
  | "store.updated";

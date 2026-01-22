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
  name: string;
  description: string;
  price: number;
  sale_price?: number;
  quantity: number;
  status: "sale" | "out" | "hidden";
  product_type: "product" | "service" | "digital" | "food" | "codes";
  images?: SallaProductImage[];
}

export interface SallaProductImage {
  id?: number;
  url: string;
  sort?: number;
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

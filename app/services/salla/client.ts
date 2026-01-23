import type { SallaTokens, SallaMerchant, SallaProduct } from "./types";

const SALLA_API_BASE = "https://api.salla.dev/admin/v2";

/**
 * Salla Merchant API Client
 */
export class SallaClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${SALLA_API_BASE}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Salla API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    return data.data as T;
  }

  /**
   * Get merchant/store information
   */
  async getMerchant(): Promise<SallaMerchant> {
    return this.request<SallaMerchant>("/store/info");
  }

  /**
   * Create a new product
   * Include images array with photo (base64) or original (URL)
   */
  async createProduct(product: Omit<SallaProduct, "id">): Promise<SallaProduct> {
    return this.request<SallaProduct>("/products", {
      method: "POST",
      body: JSON.stringify(product),
    });
  }

  /**
   * Update an existing product
   */
  async updateProduct(
    productId: number,
    product: Partial<SallaProduct>
  ): Promise<SallaProduct> {
    return this.request<SallaProduct>(`/products/${productId}`, {
      method: "PUT",
      body: JSON.stringify(product),
    });
  }

  /**
   * Upload product image from URL
   * Fetches the image and uploads it to Salla as base64
   */
  async uploadProductImage(
    productId: number,
    imageUrl: string,
    sort: number = 1
  ): Promise<void> {
    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageUrl}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(imageBuffer).toString("base64");
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

    // Upload to Salla as base64
    await this.request(`/products/${productId}/images`, {
      method: "POST",
      body: JSON.stringify({
        photo: `data:${contentType};base64,${base64}`,
        sort,
      }),
    });
  }

  /**
   * Upload multiple product images
   */
  async uploadProductImages(
    productId: number,
    imageUrls: string[]
  ): Promise<void> {
    for (let i = 0; i < imageUrls.length; i++) {
      await this.uploadProductImage(productId, imageUrls[i], i + 1);
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(
    clientId: string,
    clientSecret: string,
    refreshToken: string
  ): Promise<SallaTokens> {
    const response = await fetch("https://accounts.salla.sa/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    return response.json();
  }
}

// Type definitions for all Inngest events
export type Events = {
  "app/webhook.received": {
    data: {
      event: string;
      merchantSallaId: number;
      payload: unknown;
      webhookHistoryId: string;
    };
  };
  "app/token.refresh-needed": {
    data: {
      merchantId: string;
    };
  };
  // Product scraping events
  "product/scrape.requested": {
    data: {
      productId: string;
      sourceUrl: string;
      merchantId: string;
    };
  };
  "product/scrape.completed": {
    data: {
      productId: string;
      success: boolean;
      provider: string;
      duration: number;
    };
  };
  "product/scrape.failed": {
    data: {
      productId: string;
      error: string;
      duration: number;
    };
  };
};

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
  // Future events for scraping, AI processing
  "product/scrape.requested": {
    data: {
      productId: string;
      sourceUrl: string;
      merchantId: string;
    };
  };
};

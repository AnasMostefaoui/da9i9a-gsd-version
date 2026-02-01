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
  // AI enhancement events
  "product/enhance.requested": {
    data: {
      productId: string;
      merchantId: string;
      tasks: Array<"enhance" | "translate" | "landing-page">;
    };
  };
  "product/enhance.completed": {
    data: {
      productId: string;
      tasks: Array<"enhance" | "translate" | "landing-page">;
      duration: number;
    };
  };
  "product/enhance.failed": {
    data: {
      productId: string;
      error: string;
      task: "enhance" | "translate" | "landing-page";
    };
  };
};

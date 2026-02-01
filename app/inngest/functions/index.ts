// Export all Inngest functions
import { processWebhook } from "./webhook-process";
import { scrapeProduct } from "./scrape-product";
import { enhanceProduct } from "./enhance-product";

export const functions = [processWebhook, scrapeProduct, enhanceProduct];

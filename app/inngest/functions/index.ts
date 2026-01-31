// Export all Inngest functions
import { processWebhook } from "./webhook-process";
import { scrapeProduct } from "./scrape-product";

export const functions = [processWebhook, scrapeProduct];

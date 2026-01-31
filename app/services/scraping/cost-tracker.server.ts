/**
 * Cost Tracker for Scraping Operations
 * Tracks estimated costs per provider/platform for subscription enforcement
 *
 * Cost estimates are approximate and based on provider pricing tiers.
 * Actual costs may vary based on usage volume and negotiated rates.
 */

import type { Platform } from "./types";

/**
 * Estimated cost per request by provider and platform (in USD)
 * These are approximate costs for budgeting and tier enforcement
 */
export const PROVIDER_COSTS = {
  apify: {
    aliexpress: 0.015, // ~$15 per 1000 requests
    amazon: 0.02, // ~$20 per 1000 requests
  },
  oxylabs: {
    aliexpress: 0.025, // ~$25 per 1000 requests
    amazon: 0.02, // ~$20 per 1000 requests
  },
  vision: 0.005, // Gemini Vision fallback cost per request
} as const;

/**
 * Metadata tracked for each scrape operation
 */
export interface ScrapeCostMetadata {
  provider: string;
  platform: string;
  estimatedCostUsd: number;
  scrapedAt: string; // ISO timestamp
  duration: number; // milliseconds
}

/**
 * Estimate the cost of a scrape operation
 * Handles compound providers like "apify+vision" by summing costs
 *
 * @param provider Provider name (e.g., "apify", "oxylabs", "apify+vision")
 * @param platform Target platform (aliexpress, amazon)
 * @returns Estimated cost in USD
 */
export function estimateScrapeCost(provider: string, platform: Platform): number {
  let totalCost = 0;

  // Handle compound providers (e.g., "apify+vision", "oxylabs+vision")
  const providers = provider.toLowerCase().split("+");

  for (const p of providers) {
    const trimmedProvider = p.trim();

    if (trimmedProvider === "vision") {
      // Vision is a standalone cost component
      totalCost += PROVIDER_COSTS.vision;
    } else if (trimmedProvider in PROVIDER_COSTS) {
      // Main scraping provider with platform-specific costs
      const providerCosts = PROVIDER_COSTS[trimmedProvider as keyof typeof PROVIDER_COSTS];
      if (typeof providerCosts === "object" && platform in providerCosts) {
        totalCost += providerCosts[platform as keyof typeof providerCosts];
      }
    }
  }

  // If no cost was calculated, use a default estimate
  if (totalCost === 0) {
    console.warn(
      `[CostTracker] Unknown provider/platform combination: ${provider}/${platform}, using default cost`
    );
    totalCost = 0.02; // Conservative default estimate
  }

  return totalCost;
}

/**
 * Format cost for display to users
 * Shows "$X.XX" format or "< $0.01" for very small amounts
 *
 * @param costUsd Cost in USD
 * @returns Formatted string for display
 */
export function formatCostForDisplay(costUsd: number): string {
  if (costUsd < 0.01) {
    return "< $0.01";
  }
  return `$${costUsd.toFixed(2)}`;
}

/**
 * Calculate total cost from an array of cost metadata entries
 * Useful for aggregating merchant usage for subscription enforcement
 *
 * @param costs Array of cost metadata objects
 * @returns Total cost in USD
 */
export function sumScrapeCosts(costs: ScrapeCostMetadata[]): number {
  return costs.reduce((total, cost) => total + cost.estimatedCostUsd, 0);
}

/**
 * Create a cost metadata object for a scrape operation
 *
 * @param provider Provider name
 * @param platform Target platform
 * @param duration Scrape duration in milliseconds
 * @returns Complete cost metadata object
 */
export function createCostMetadata(
  provider: string,
  platform: Platform,
  duration: number
): ScrapeCostMetadata {
  return {
    provider,
    platform,
    estimatedCostUsd: estimateScrapeCost(provider, platform),
    scrapedAt: new Date().toISOString(),
    duration,
  };
}

/**
 * Exponential Backoff Retry Utility
 *
 * Provides retry logic with jitter for external API calls (Salla, scrapers, etc.)
 * Prevents thundering herd problem with full jitter.
 *
 * @see https://www.npmjs.com/package/exponential-backoff
 */
import { backOff, type BackoffOptions } from "exponential-backoff";

/**
 * Retry configuration presets for different use cases
 */
export const RetryPresets = {
  // For Salla API calls - moderate retry with rate limit awareness
  sallaApi: {
    numOfAttempts: 5,
    startingDelay: 1000,
    timeMultiple: 2,
    maxDelay: 30000,
    jitter: "full" as const,
  },
  // For scrapers - longer delays, more attempts
  scraper: {
    numOfAttempts: 3,
    startingDelay: 5000,
    timeMultiple: 2,
    maxDelay: 60000,
    jitter: "full" as const,
  },
  // For AI APIs - quick retry for transient failures
  aiApi: {
    numOfAttempts: 3,
    startingDelay: 500,
    timeMultiple: 2,
    maxDelay: 10000,
    jitter: "full" as const,
  },
};

/**
 * Error codes that indicate transient failures worth retrying
 */
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message || "";
  return (
    message.includes("429") || // Rate limited
    message.includes("500") || // Server error
    message.includes("502") || // Bad gateway
    message.includes("503") || // Service unavailable
    message.includes("504") || // Gateway timeout
    message.includes("ECONNRESET") ||
    message.includes("ETIMEDOUT") ||
    message.includes("ECONNREFUSED")
  );
}

/**
 * Call an async function with exponential backoff retry
 *
 * @param fn - The async function to call
 * @param options - Backoff options (use RetryPresets or custom)
 * @returns The result of the function
 * @throws The last error if all retries fail
 *
 * @example
 * const result = await callWithRetry(
 *   () => sallaClient.getProducts(),
 *   RetryPresets.sallaApi
 * );
 */
export async function callWithRetry<T>(
  fn: () => Promise<T>,
  options: Partial<BackoffOptions> = RetryPresets.sallaApi
): Promise<T> {
  return backOff(fn, {
    ...options,
    retry: (error: Error, attemptNumber: number) => {
      const shouldRetry = isRetryableError(error);
      if (shouldRetry) {
        console.log(`[Retry] Attempt ${attemptNumber} failed, retrying:`, error.message);
      }
      return shouldRetry;
    },
  });
}

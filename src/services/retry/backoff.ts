export type BackoffOptions = {
  maxAttempts?: number;
  baseMs?: number;
  maxMs?: number;
};

/**
 * Returns the delay in ms for a given retry attempt using exponential backoff.
 * attempt=0 → baseMs, attempt=1 → 2*baseMs, attempt=2 → 4*baseMs, capped at maxMs.
 */
export function delayMs(attempt: number, baseMs = 1000, maxMs = 16000): number {
  return Math.min(baseMs * Math.pow(2, attempt), maxMs);
}

/**
 * Calls fn(), retrying with exponential backoff on failure.
 * Throws the last error if all attempts are exhausted.
 */
export async function withRetry<T>(fn: () => Promise<T>, opts: BackoffOptions = {}): Promise<T> {
  const { maxAttempts = 3, baseMs = 1000, maxMs = 16000 } = opts;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts - 1) {
        await sleep(delayMs(attempt, baseMs, maxMs));
      }
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

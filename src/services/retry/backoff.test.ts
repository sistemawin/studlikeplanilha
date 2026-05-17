import { describe, it, expect, vi } from "vitest";
import { delayMs, withRetry } from "./backoff";

describe("delayMs", () => {
  it("returns baseMs on attempt 0", () => {
    expect(delayMs(0, 1000, 16000)).toBe(1000);
  });

  it("doubles on each subsequent attempt", () => {
    expect(delayMs(1, 1000, 16000)).toBe(2000);
    expect(delayMs(2, 1000, 16000)).toBe(4000);
    expect(delayMs(3, 1000, 16000)).toBe(8000);
  });

  it("caps at maxMs", () => {
    expect(delayMs(4, 1000, 16000)).toBe(16000);
    expect(delayMs(10, 1000, 16000)).toBe(16000);
  });

  it("respects custom baseMs", () => {
    expect(delayMs(0, 500, 8000)).toBe(500);
    expect(delayMs(1, 500, 8000)).toBe(1000);
  });

  it("respects custom maxMs cap", () => {
    expect(delayMs(10, 1000, 2000)).toBe(2000);
  });
});

describe("withRetry", () => {
  it("returns immediately on first success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await withRetry(fn, { maxAttempts: 3, baseMs: 1 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure and succeeds on third attempt", async () => {
    let calls = 0;
    const fn = vi.fn().mockImplementation(async () => {
      calls++;
      if (calls < 3) throw new Error("transient");
      return "recovered";
    });
    const result = await withRetry(fn, { maxAttempts: 3, baseMs: 1 });
    expect(result).toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws after exhausting maxAttempts", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("permanent failure"));
    await expect(withRetry(fn, { maxAttempts: 3, baseMs: 1 })).rejects.toThrow("permanent failure");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("does not retry more than maxAttempts times", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fail"));
    await expect(withRetry(fn, { maxAttempts: 1, baseMs: 1 })).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries exactly maxAttempts-1 times before throwing", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fail"));
    await expect(withRetry(fn, { maxAttempts: 4, baseMs: 1 })).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(4);
  });

  it("propagates the last error when all attempts fail", async () => {
    let calls = 0;
    const fn = vi.fn().mockImplementation(async () => {
      calls++;
      throw new Error(`error-${calls}`);
    });
    await expect(withRetry(fn, { maxAttempts: 3, baseMs: 1 })).rejects.toThrow("error-3");
  });

  it("uses default options when none provided", async () => {
    const fn = vi.fn().mockResolvedValue(42);
    const result = await withRetry(fn);
    expect(result).toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

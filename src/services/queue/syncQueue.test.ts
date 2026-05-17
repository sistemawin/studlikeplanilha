import { describe, it, expect, beforeEach, vi } from "vitest";
import { enqueuePendingSync, hasPendingSync, clearPendingSync } from "./syncQueue";

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
  });
});

describe("hasPendingSync", () => {
  it("returns false when nothing enqueued", () => {
    expect(hasPendingSync("user-1")).toBe(false);
  });

  it("returns false for a different userId even after enqueue", () => {
    enqueuePendingSync("user-1");
    expect(hasPendingSync("user-2")).toBe(false);
  });
});

describe("enqueuePendingSync", () => {
  it("makes hasPendingSync return true for that user", () => {
    enqueuePendingSync("user-1");
    expect(hasPendingSync("user-1")).toBe(true);
  });

  it("is idempotent — multiple calls for same user leave one pending", () => {
    enqueuePendingSync("user-1");
    enqueuePendingSync("user-1");
    expect(hasPendingSync("user-1")).toBe(true);
  });

  it("overwrites a pending entry for a different user (single slot)", () => {
    enqueuePendingSync("user-1");
    enqueuePendingSync("user-2");
    expect(hasPendingSync("user-1")).toBe(false);
    expect(hasPendingSync("user-2")).toBe(true);
  });
});

describe("clearPendingSync", () => {
  it("removes the pending marker", () => {
    enqueuePendingSync("user-1");
    clearPendingSync();
    expect(hasPendingSync("user-1")).toBe(false);
  });

  it("is safe to call when nothing is pending", () => {
    expect(() => clearPendingSync()).not.toThrow();
  });
});

describe("storage corruption resilience", () => {
  it("hasPendingSync returns false if stored data is corrupt JSON", () => {
    store.set("studlike_pending_sync_v1", "not-valid-json");
    expect(hasPendingSync("user-1")).toBe(false);
  });
});

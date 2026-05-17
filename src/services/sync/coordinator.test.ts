import { describe, it, expect, beforeEach, vi } from "vitest";
import { syncAppState } from "./coordinator";
import { loadPersisted } from "@/services/persistence/local";
import { hasPendingSync, clearPendingSync } from "@/services/queue/syncQueue";
import type { AppState } from "@/types";
import { defaultSchedule, defaultGoals } from "@/lib/seed";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/services/offline/detector", () => ({
  isOnline: vi.fn(() => true),
}));

vi.mock("@/services/supabase/sync", () => ({
  saveRemoteState: vi.fn(),
}));

import { isOnline } from "@/services/offline/detector";
import { saveRemoteState } from "@/services/supabase/sync";

const mockSupabase = {} as Parameters<typeof syncAppState>[0];

// ── localStorage stub ─────────────────────────────────────────────────────────

const store = new Map<string, string>();

beforeEach(() => {
  vi.clearAllMocks();
  store.clear();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
  });
  vi.mocked(isOnline).mockReturnValue(true);
  vi.mocked(saveRemoteState).mockResolvedValue(undefined);
  clearPendingSync();
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

const state: AppState = {
  subjects: [],
  topics: [],
  reviews: [],
  schedule: defaultSchedule,
  goals: defaultGoals(),
  exams: [],
  questionLogs: [],
  studySessions: [],
};

// Fast retry options to avoid real delays in tests
const fastRetry = { maxAttempts: 2, baseMs: 1 };

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("offline behavior", () => {
  it("persists locally even when offline", async () => {
    vi.mocked(isOnline).mockReturnValue(false);
    await syncAppState(mockSupabase, "u1", state, fastRetry);
    expect(loadPersisted("u1")).toEqual(state);
  });

  it("returns 'queued' when offline", async () => {
    vi.mocked(isOnline).mockReturnValue(false);
    const result = await syncAppState(mockSupabase, "u1", state, fastRetry);
    expect(result.status).toBe("queued");
  });

  it("marks a pending sync when offline", async () => {
    vi.mocked(isOnline).mockReturnValue(false);
    await syncAppState(mockSupabase, "u1", state, fastRetry);
    expect(hasPendingSync("u1")).toBe(true);
  });

  it("does not call saveRemoteState when offline", async () => {
    vi.mocked(isOnline).mockReturnValue(false);
    await syncAppState(mockSupabase, "u1", state, fastRetry);
    expect(saveRemoteState).not.toHaveBeenCalled();
  });
});

describe("online success", () => {
  it("returns 'synced' on success", async () => {
    const result = await syncAppState(mockSupabase, "u1", state, fastRetry);
    expect(result.status).toBe("synced");
  });

  it("calls saveRemoteState with correct args", async () => {
    await syncAppState(mockSupabase, "u1", state, fastRetry);
    expect(saveRemoteState).toHaveBeenCalledWith(mockSupabase, "u1", state);
  });

  it("persists locally before hitting the network", async () => {
    let persisted = false;
    vi.mocked(saveRemoteState).mockImplementation(async () => {
      persisted = loadPersisted("u1") !== null;
    });
    await syncAppState(mockSupabase, "u1", state, fastRetry);
    expect(persisted).toBe(true);
  });

  it("clears any pending sync marker on success", async () => {
    // Simulate a previous offline enqueue
    const { enqueuePendingSync } = await import("@/services/queue/syncQueue");
    enqueuePendingSync("u1");
    expect(hasPendingSync("u1")).toBe(true);

    await syncAppState(mockSupabase, "u1", state, fastRetry);
    expect(hasPendingSync("u1")).toBe(false);
  });
});

describe("online failure with retry", () => {
  it("retries on transient failure and returns 'synced' on recovery", async () => {
    let calls = 0;
    vi.mocked(saveRemoteState).mockImplementation(async () => {
      calls++;
      if (calls < 2) throw new Error("transient");
    });
    const result = await syncAppState(mockSupabase, "u1", state, fastRetry);
    expect(result.status).toBe("synced");
    expect(saveRemoteState).toHaveBeenCalledTimes(2);
  });

  it("returns 'error' after exhausting retry attempts", async () => {
    vi.mocked(saveRemoteState).mockRejectedValue(new Error("permanent"));
    const result = await syncAppState(mockSupabase, "u1", state, { maxAttempts: 2, baseMs: 1 });
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.error.message).toBe("permanent");
    }
  });

  it("marks pending sync after exhausted retries", async () => {
    vi.mocked(saveRemoteState).mockRejectedValue(new Error("fail"));
    await syncAppState(mockSupabase, "u1", state, { maxAttempts: 1, baseMs: 1 });
    expect(hasPendingSync("u1")).toBe(true);
  });

  it("still persists locally even when remote fails", async () => {
    vi.mocked(saveRemoteState).mockRejectedValue(new Error("fail"));
    await syncAppState(mockSupabase, "u1", state, { maxAttempts: 1, baseMs: 1 });
    expect(loadPersisted("u1")).toEqual(state);
  });
});

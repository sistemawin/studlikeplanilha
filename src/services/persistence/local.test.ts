import { describe, it, expect, beforeEach, vi } from "vitest";
import { persistLocally, loadPersisted, loadLastPersisted, clearPersisted } from "./local";
import type { AppState } from "@/types";
import { defaultSchedule, defaultGoals } from "@/lib/seed";

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
  });
});

const minimalState: AppState = {
  subjects: [],
  topics: [],
  reviews: [],
  schedule: defaultSchedule,
  goals: defaultGoals(),
  exams: [],
  questionLogs: [],
  studySessions: [],
};

const stateWithData: AppState = {
  ...minimalState,
  subjects: [{ id: "s1", nome: "Direito", peso: 3, cor: "bg-blue-500" }],
  topics: [{ id: "t1", materiaId: "s1", titulo: "Constitucional", status: "Teoria Lida", dificuldade: "Médio" }],
};

describe("loadPersisted", () => {
  it("returns null when nothing stored", () => {
    expect(loadPersisted("user-1")).toBeNull();
  });

  it("returns null for a different userId", () => {
    persistLocally("user-1", minimalState);
    expect(loadPersisted("user-2")).toBeNull();
  });

  it("returns null when stored data is corrupt JSON", () => {
    store.set("studlike_state_v1", "{{not-json");
    expect(loadPersisted("user-1")).toBeNull();
  });

  it("returns null when version mismatches", () => {
    const corrupted = JSON.stringify({ version: 0, userId: "user-1", state: minimalState });
    store.set("studlike_state_v1", corrupted);
    expect(loadPersisted("user-1")).toBeNull();
  });
});

describe("persistLocally + loadPersisted", () => {
  it("round-trips minimal state correctly", () => {
    persistLocally("user-1", minimalState);
    expect(loadPersisted("user-1")).toEqual(minimalState);
  });

  it("round-trips state with data correctly", () => {
    persistLocally("user-1", stateWithData);
    expect(loadPersisted("user-1")).toEqual(stateWithData);
  });

  it("overwrites previous state for same userId", () => {
    persistLocally("user-1", minimalState);
    persistLocally("user-1", stateWithData);
    expect(loadPersisted("user-1")).toEqual(stateWithData);
  });

  it("scopes state to userId — different users do not share storage", () => {
    persistLocally("user-1", minimalState);
    persistLocally("user-2", stateWithData);
    expect(loadPersisted("user-1")).toBeNull(); // overwritten by user-2
    expect(loadPersisted("user-2")).toEqual(stateWithData);
  });
});

describe("loadLastPersisted", () => {
  it("returns the latest stored state without requiring userId", () => {
    persistLocally("user-1", stateWithData);
    expect(loadLastPersisted()).toEqual({
      userId: "user-1",
      state: stateWithData,
      savedAt: expect.any(String),
    });
  });

  it("returns null when the latest stored data is invalid", () => {
    store.set("studlike_state_v1", JSON.stringify({ version: 0, userId: "user-1", state: stateWithData }));
    expect(loadLastPersisted()).toBeNull();
  });
});

describe("clearPersisted", () => {
  it("makes loadPersisted return null", () => {
    persistLocally("user-1", minimalState);
    clearPersisted();
    expect(loadPersisted("user-1")).toBeNull();
  });

  it("is safe to call when nothing is stored", () => {
    expect(() => clearPersisted()).not.toThrow();
  });
});

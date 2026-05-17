import { describe, expect, it } from "vitest";
import {
  secondsToHours,
  totalSecondsForDate,
  totalSecondsInRange,
  groupSessionsByDate,
  buildStudySession,
} from "./session";
import type { StudySession } from "@/types";

const makeSession = (data: string, durationSeconds: number, id = data): StudySession => ({
  id, tipo: "topico", data, endedAt: "", durationSeconds,
});

describe("secondsToHours", () => {
  it("converts 0 seconds to 0 hours", () => expect(secondsToHours(0)).toBe(0));
  it("converts 3600 seconds to 1 hour", () => expect(secondsToHours(3600)).toBe(1));
  it("rounds to 2 decimal places", () => expect(secondsToHours(5400)).toBe(1.5));
  it("handles partial hours", () => expect(secondsToHours(90)).toBe(0.03));
});

describe("totalSecondsForDate", () => {
  const sessions = [
    makeSession("2025-01-01", 3600, "a"),
    makeSession("2025-01-01", 1800, "b"),
    makeSession("2025-01-02", 900, "c"),
  ];

  it("sums seconds for a specific date", () => {
    expect(totalSecondsForDate(sessions, "2025-01-01")).toBe(5400);
  });
  it("returns 0 for date with no sessions", () => {
    expect(totalSecondsForDate(sessions, "2025-01-03")).toBe(0);
  });
});

describe("totalSecondsInRange", () => {
  const sessions = [
    makeSession("2025-01-01", 3600, "a"),
    makeSession("2025-01-03", 1800, "b"),
    makeSession("2025-01-07", 900, "c"),
  ];

  it("sums seconds within range (inclusive)", () => {
    expect(totalSecondsInRange(sessions, "2025-01-01", "2025-01-03")).toBe(5400);
  });
  it("returns 0 for range with no sessions", () => {
    expect(totalSecondsInRange(sessions, "2025-01-10", "2025-01-20")).toBe(0);
  });
});

describe("groupSessionsByDate", () => {
  const sessions = [
    makeSession("2025-01-01", 3600, "a"),
    makeSession("2025-01-01", 1800, "b"),
    makeSession("2025-01-02", 900, "c"),
  ];

  it("groups sessions by date key", () => {
    const groups = groupSessionsByDate(sessions);
    expect(Object.keys(groups)).toEqual(["2025-01-01", "2025-01-02"]);
    expect(groups["2025-01-01"]).toHaveLength(2);
    expect(groups["2025-01-02"]).toHaveLength(1);
  });

  it("returns empty object for no sessions", () => {
    expect(groupSessionsByDate([])).toEqual({});
  });
});

describe("buildStudySession", () => {
  it("creates a session with required fields", () => {
    const session = buildStudySession({
      tipo: "topico",
      durationSeconds: 3600,
      materiaId: "m1",
      materiaNome: "Direito Penal",
      topicoId: "t1",
      topicoTitulo: "Teoria do crime",
    });
    expect(session.tipo).toBe("topico");
    expect(session.durationSeconds).toBe(3600);
    expect(session.materiaId).toBe("m1");
    expect(session.topicoId).toBe("t1");
    expect(typeof session.id).toBe("string");
    expect(typeof session.data).toBe("string");
    expect(typeof session.endedAt).toBe("string");
  });

  it("creates a free session without subject/topic", () => {
    const session = buildStudySession({ tipo: "livre", durationSeconds: 1800 });
    expect(session.tipo).toBe("livre");
    expect(session.materiaId).toBeUndefined();
    expect(session.topicoId).toBeUndefined();
  });

  it("uses provided date when given", () => {
    const specificDate = new Date("2025-01-15T10:00:00");
    const session = buildStudySession({ tipo: "livre", durationSeconds: 0, date: specificDate });
    expect(session.data).toBe("2025-01-15");
  });
});

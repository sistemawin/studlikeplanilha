import { describe, expect, it } from "vitest";
import {
  goalProgress,
  studiedToday,
  isStreakAtRisk,
  daysUntilExam,
  buildHeatmap,
  recentSessions,
} from "./metrics";
import type { Goal, StudySession } from "@/types";

const makeGoal = (valorAtual: number, valorObjetivo: number): Goal => ({
  id: "g1", tipo: "horas", valorAtual, valorObjetivo,
});

const makeSession = (data: string, durationSeconds = 3600): StudySession => ({
  id: data, tipo: "topico", data, endedAt: "", durationSeconds,
});

const TODAY = "2025-06-01";

describe("goalProgress", () => {
  it("returns 0 when objective is 0", () => expect(goalProgress(makeGoal(5, 0))).toBe(0));
  it("returns 0 when nothing done", () => expect(goalProgress(makeGoal(0, 8))).toBe(0));
  it("returns 100 when met", () => expect(goalProgress(makeGoal(8, 8))).toBe(100));
  it("caps at 100 when exceeded", () => expect(goalProgress(makeGoal(10, 8))).toBe(100));
  it("calculates partial progress", () => expect(goalProgress(makeGoal(4, 8))).toBe(50));
});

describe("studiedToday", () => {
  it("returns false with no sessions", () => expect(studiedToday([], TODAY)).toBe(false));
  it("returns false when no session today", () => {
    expect(studiedToday([makeSession("2025-05-31")], TODAY)).toBe(false);
  });
  it("returns true when session exists today", () => {
    expect(studiedToday([makeSession(TODAY)], TODAY)).toBe(true);
  });
});

describe("isStreakAtRisk", () => {
  it("returns false with no sessions (streak 0)", () => {
    expect(isStreakAtRisk([], TODAY)).toBe(false);
  });

  it("returns false when already studied today", () => {
    const sessions = [makeSession(TODAY), makeSession("2025-05-31")];
    expect(isStreakAtRisk(sessions, TODAY)).toBe(false);
  });

  it("returns true when streak exists but not studied today", () => {
    // Streak of 2: studied yesterday and day before
    const sessions = [makeSession("2025-05-31"), makeSession("2025-05-30")];
    expect(isStreakAtRisk(sessions, TODAY)).toBe(true);
  });
});

describe("daysUntilExam", () => {
  it("returns null for past exams", () => {
    expect(daysUntilExam("2025-05-01", TODAY)).toBeNull();
  });
  it("returns null for today", () => {
    expect(daysUntilExam(TODAY, TODAY)).toBeNull();
  });
  it("returns correct days for future exam", () => {
    expect(daysUntilExam("2025-06-11", TODAY)).toBe(10);
  });
  it("returns 1 for tomorrow", () => {
    expect(daysUntilExam("2025-06-02", TODAY)).toBe(1);
  });
});

describe("buildHeatmap", () => {
  it("returns empty object for no sessions", () => {
    expect(buildHeatmap([])).toEqual({});
  });
  it("groups seconds by date", () => {
    const sessions = [makeSession("2025-01-01", 1800), makeSession("2025-01-01", 3600)];
    expect(buildHeatmap(sessions)).toEqual({ "2025-01-01": 5400 });
  });
  it("handles multiple dates", () => {
    const sessions = [makeSession("2025-01-01", 1800), makeSession("2025-01-02", 900)];
    expect(buildHeatmap(sessions)).toEqual({ "2025-01-01": 1800, "2025-01-02": 900 });
  });
});

describe("recentSessions", () => {
  const sessions = [
    makeSession("2025-05-25"),
    makeSession("2025-05-28"),
    makeSession("2025-06-01"),
    makeSession("2025-06-03"),
  ];

  it("returns sessions within last N days", () => {
    const result = recentSessions(sessions, 7, TODAY);
    expect(result.map((s) => s.data)).toEqual(["2025-05-28","2025-06-01"]);
  });

  it("returns empty when no sessions in range", () => {
    expect(recentSessions(sessions, 7, "2024-01-01")).toHaveLength(0);
  });
});

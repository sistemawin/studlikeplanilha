import { describe, expect, it } from "vitest";
import {
  buildInitialReviewSchedule,
  buildDifficultyReview,
  rescheduleDate,
  countOverdueReviews,
  countPendingToday,
  shouldScheduleReviews,
  SPACED_REPETITION_INTERVALS,
  DIFFICULTY_INTERVAL_DAYS,
} from "./scheduling";
import { addDays } from "@/lib/utils";

const TODAY = "2025-06-01";
const TOPIC_ID = "topic-1";

describe("buildInitialReviewSchedule", () => {
  it("creates 4 reviews (one per interval)", () => {
    const reviews = buildInitialReviewSchedule(TOPIC_ID, new Date(TODAY + "T12:00:00"));
    expect(reviews).toHaveLength(4);
  });

  it("assigns the correct spaced repetition intervals", () => {
    const base = new Date(TODAY + "T12:00:00");
    const reviews = buildInitialReviewSchedule(TOPIC_ID, base);
    const dates = reviews.map((r) => r.dataAgendada);
    SPACED_REPETITION_INTERVALS.forEach((days, i) => {
      expect(dates[i]).toBe(addDays(base, days));
    });
  });

  it("sets correct fields on each review", () => {
    const reviews = buildInitialReviewSchedule(TOPIC_ID);
    for (const r of reviews) {
      expect(r.topicoId).toBe(TOPIC_ID);
      expect(r.concluida).toBe(false);
      expect(typeof r.id).toBe("string");
    }
  });

  it("assigns tipo as string of the interval days", () => {
    const reviews = buildInitialReviewSchedule(TOPIC_ID);
    const tipos = reviews.map((r) => r.tipo);
    expect(tipos).toEqual(["1", "7", "21", "30"]);
  });

  it("generates unique IDs for each review", () => {
    const reviews = buildInitialReviewSchedule(TOPIC_ID);
    const ids = reviews.map((r) => r.id);
    expect(new Set(ids).size).toBe(4);
  });
});

describe("buildDifficultyReview", () => {
  it("creates a review with tipo 'dificuldade'", () => {
    const review = buildDifficultyReview(TOPIC_ID, "Difícil");
    expect(review.tipo).toBe("dificuldade");
    expect(review.concluida).toBe(false);
    expect(review.topicoId).toBe(TOPIC_ID);
  });

  it("uses correct interval for each difficulty", () => {
    const base = new Date(TODAY + "T12:00:00");
    for (const [difficulty, days] of Object.entries(DIFFICULTY_INTERVAL_DAYS)) {
      const review = buildDifficultyReview(TOPIC_ID, difficulty, base);
      expect(review.dataAgendada).toBe(addDays(base, days));
    }
  });

  it("falls back to 7 days for unknown difficulty", () => {
    const base = new Date(TODAY + "T12:00:00");
    const review = buildDifficultyReview(TOPIC_ID, "Desconhecida", base);
    expect(review.dataAgendada).toBe(addDays(base, 7));
  });
});

describe("rescheduleDate", () => {
  it("reschedules from current date when current is in the future", () => {
    const futureDate = addDays(new Date(TODAY + "T12:00:00"), 3);
    const result = rescheduleDate(futureDate, 2, TODAY);
    expect(result).toBe(addDays(new Date(futureDate + "T12:00:00"), 2));
  });

  it("reschedules from today when current date is in the past", () => {
    const pastDate = addDays(new Date(TODAY + "T12:00:00"), -5);
    const result = rescheduleDate(pastDate, 3, TODAY);
    expect(result).toBe(addDays(new Date(TODAY + "T12:00:00"), 3));
  });

  it("reschedules from today when current date is today", () => {
    const result = rescheduleDate(TODAY, 1, TODAY);
    expect(result).toBe(addDays(new Date(TODAY + "T12:00:00"), 1));
  });
});

describe("countOverdueReviews", () => {
  const reviews = [
    { id: "1", topicoId: TOPIC_ID, dataAgendada: "2025-05-25", concluida: false, tipo: "1" as const },
    { id: "2", topicoId: TOPIC_ID, dataAgendada: "2025-05-30", concluida: false, tipo: "7" as const },
    { id: "3", topicoId: TOPIC_ID, dataAgendada: "2025-06-01", concluida: false, tipo: "21" as const },
    { id: "4", topicoId: TOPIC_ID, dataAgendada: "2025-05-20", concluida: true, tipo: "30" as const },
  ];

  it("counts reviews scheduled before today (not done)", () => {
    expect(countOverdueReviews(reviews, TODAY)).toBe(2);
  });

  it("returns 0 when no overdue reviews", () => {
    expect(countOverdueReviews([], TODAY)).toBe(0);
  });

  it("does not count completed reviews", () => {
    expect(countOverdueReviews(reviews, "2025-05-19")).toBe(0); // all are after 05-19
  });
});

describe("countPendingToday", () => {
  const reviews = [
    { id: "1", topicoId: TOPIC_ID, dataAgendada: "2025-05-25", concluida: false, tipo: "1" as const },
    { id: "2", topicoId: TOPIC_ID, dataAgendada: "2025-06-01", concluida: false, tipo: "7" as const },
    { id: "3", topicoId: TOPIC_ID, dataAgendada: "2025-06-05", concluida: false, tipo: "21" as const },
    { id: "4", topicoId: TOPIC_ID, dataAgendada: "2025-05-01", concluida: true, tipo: "30" as const },
  ];

  it("counts reviews scheduled today or earlier (not done)", () => {
    expect(countPendingToday(reviews, TODAY)).toBe(2);
  });

  it("returns 0 when all done or future", () => {
    const allDone = reviews.map((r) => ({ ...r, concluida: true }));
    expect(countPendingToday(allDone, TODAY)).toBe(0);
  });
});

describe("shouldScheduleReviews", () => {
  it("returns true for Questões Feitas", () => {
    expect(shouldScheduleReviews("Questões Feitas")).toBe(true);
  });

  it("returns true for Revisado", () => {
    expect(shouldScheduleReviews("Revisado")).toBe(true);
  });

  it("returns false for Não Estudado", () => {
    expect(shouldScheduleReviews("Não Estudado")).toBe(false);
  });

  it("returns false for Teoria Lida", () => {
    expect(shouldScheduleReviews("Teoria Lida")).toBe(false);
  });
});

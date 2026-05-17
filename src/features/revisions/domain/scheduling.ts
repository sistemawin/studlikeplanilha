import type { Review, ReviewType, Topic } from "@/types";
import { addDays, isoDate } from "@/lib/utils";

// Intervals (in days) for the spaced repetition schedule.
// After a topic is studied, reviews are created at each of these intervals.
export const SPACED_REPETITION_INTERVALS = [1, 7, 21, 30] as const;
export type SpacedRepetitionInterval = (typeof SPACED_REPETITION_INTERVALS)[number];

// Days to schedule a review based on topic difficulty
export const DIFFICULTY_INTERVAL_DAYS: Record<string, number> = {
  "Fácil": 14,
  "Médio": 7,
  "Difícil": 3,
};

/**
 * Builds the set of Review records to create when a topic is first studied.
 * Pure function — no side effects, no React state.
 */
export function buildInitialReviewSchedule(
  topicId: string,
  studiedAt: Date = new Date(),
): Review[] {
  const baseIso = isoDate(studiedAt) + "T12:00:00";
  const base = new Date(baseIso);
  return SPACED_REPETITION_INTERVALS.map((days) => ({
    id: crypto.randomUUID(),
    topicoId: topicId,
    dataAgendada: addDays(base, days),
    concluida: false,
    tipo: String(days) as ReviewType,
  }));
}

/**
 * Builds a difficulty-based Review record for a topic.
 */
export function buildDifficultyReview(
  topicId: string,
  difficulty: string,
  baseDate: Date = new Date(),
): Review {
  const days = DIFFICULTY_INTERVAL_DAYS[difficulty] ?? 7;
  return {
    id: crypto.randomUUID(),
    topicoId: topicId,
    dataAgendada: addDays(baseDate, days),
    concluida: false,
    tipo: "dificuldade" as ReviewType,
  };
}

/**
 * Returns the rescheduled date for a review that was postponed.
 */
export function rescheduleDate(currentDateIso: string, days: number, todayIso: string): string {
  const base = currentDateIso >= todayIso ? currentDateIso : todayIso;
  return addDays(new Date(base + "T12:00:00"), days);
}

/**
 * Returns true if this topic should have reviews scheduled based on its status.
 */
export function shouldScheduleReviews(status: Topic["status"]): boolean {
  return status === "Questões Feitas" || status === "Revisado";
}

/**
 * Counts overdue reviews (scheduled before today).
 */
export function countOverdueReviews(reviews: Review[], todayIso: string): number {
  return reviews.filter((r) => !r.concluida && r.dataAgendada < todayIso).length;
}

/**
 * Counts pending reviews for today (scheduled today or earlier, not done).
 */
export function countPendingToday(reviews: Review[], todayIso: string): number {
  return reviews.filter((r) => !r.concluida && r.dataAgendada <= todayIso).length;
}

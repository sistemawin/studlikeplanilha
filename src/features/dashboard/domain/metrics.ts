import type { Goal, StudySession } from "@/types";
import { computeStreak, addDays } from "@/lib/utils";

/**
 * Returns the current goal progress as a percentage (0–100).
 */
export function goalProgress(goal: Goal): number {
  if (goal.valorObjetivo === 0) return 0;
  return Math.min(100, Math.round((goal.valorAtual / goal.valorObjetivo) * 100));
}

/**
 * Returns true if the user studied today (has at least one session today).
 */
export function studiedToday(sessions: StudySession[], todayIso: string): boolean {
  return sessions.some((s) => s.data === todayIso);
}

/**
 * Returns true if streak is at risk (has streak but hasn't studied today).
 */
export function isStreakAtRisk(sessions: StudySession[], todayIso: string): boolean {
  const streak = computeStreak(sessions, todayIso);
  return streak > 0 && !studiedToday(sessions, todayIso);
}

/**
 * Returns sessions from the last N days (inclusive).
 */
export function recentSessions(sessions: StudySession[], days: number, todayIso: string): StudySession[] {
  const fromIso = addDays(new Date(todayIso + "T12:00:00"), -(days - 1));
  return sessions.filter((s) => s.data >= fromIso && s.data <= todayIso);
}

/**
 * Returns a heatmap-ready map of date ISO → total seconds studied.
 */
export function buildHeatmap(sessions: StudySession[]): Record<string, number> {
  return sessions.reduce<Record<string, number>>((acc, s) => {
    acc[s.data] = (acc[s.data] ?? 0) + s.durationSeconds;
    return acc;
  }, {});
}

/**
 * Returns days remaining until an exam date.
 * Returns null if no exam or exam has passed.
 */
export function daysUntilExam(examDateIso: string, todayIso: string): number | null {
  const diff = Math.ceil(
    (new Date(examDateIso + "T12:00:00").getTime() - new Date(todayIso + "T12:00:00").getTime()) /
      (1000 * 60 * 60 * 24),
  );
  return diff > 0 ? diff : null;
}

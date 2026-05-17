import type { StudySession, StudySessionType } from "@/types";
import { isoDate } from "@/lib/utils";

export const SESSION_TYPE_LABELS: Record<StudySessionType, string> = {
  topico: "Tópico",
  revisao: "Revisão",
  livre: "Livre",
};

/**
 * Converts seconds to fractional hours (rounded to 2 decimal places).
 */
export function secondsToHours(seconds: number): number {
  return Math.round((seconds / 3600) * 100) / 100;
}

/**
 * Aggregates total study seconds for sessions matching a date filter.
 */
export function totalSecondsForDate(sessions: StudySession[], dateIso: string): number {
  return sessions.filter((s) => s.data === dateIso).reduce((sum, s) => sum + s.durationSeconds, 0);
}

/**
 * Aggregates total study seconds for sessions within a date range [fromIso, toIso].
 */
export function totalSecondsInRange(sessions: StudySession[], fromIso: string, toIso: string): number {
  return sessions
    .filter((s) => s.data >= fromIso && s.data <= toIso)
    .reduce((sum, s) => sum + s.durationSeconds, 0);
}

/**
 * Groups sessions by date. Returns a map from date ISO string to sessions.
 */
export function groupSessionsByDate(sessions: StudySession[]): Record<string, StudySession[]> {
  return sessions.reduce<Record<string, StudySession[]>>((acc, s) => {
    if (!acc[s.data]) acc[s.data] = [];
    acc[s.data].push(s);
    return acc;
  }, {});
}

/**
 * Builds a new StudySession object from raw inputs.
 */
export function buildStudySession(params: {
  tipo: StudySessionType;
  durationSeconds: number;
  materiaId?: string;
  materiaNome?: string;
  topicoId?: string;
  topicoTitulo?: string;
  reviewId?: string;
  date?: Date;
}): StudySession {
  return {
    id: crypto.randomUUID(),
    tipo: params.tipo,
    data: params.date ? isoDate(params.date) : isoDate(new Date()),
    endedAt: new Date().toISOString(),
    durationSeconds: params.durationSeconds,
    materiaId: params.materiaId,
    materiaNome: params.materiaNome,
    topicoId: params.topicoId,
    topicoTitulo: params.topicoTitulo,
    reviewId: params.reviewId,
  };
}

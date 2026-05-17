import type { PomodoroDuration } from "./types";

export const POMODORO_DURATIONS: PomodoroDuration[] = [25, 45, 60];

export const SESSION_TYPE_LABELS = {
  topico: "Tópico",
  revisao: "Revisão",
  livre: "Livre",
} as const;

export const TIMER_DEBOUNCE_MS = 1000;

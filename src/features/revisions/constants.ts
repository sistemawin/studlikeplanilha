import type { RescheduleOption } from "./types";

export const RESCHEDULE_OPTIONS: RescheduleOption[] = [1, 3, 7, 14];

export const REVIEW_TYPE_LABELS: Record<string, string> = {
  "1": "1 dia",
  "7": "7 dias",
  "21": "21 dias",
  "30": "30 dias",
  manual: "manual",
  dificuldade: "dificuldade",
};

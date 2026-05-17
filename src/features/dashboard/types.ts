import type { StudySession } from "@/types";

export type StreakInfo = {
  days: number;
  atRisk: boolean;
};

export type HeatmapData = Record<string, number>; // date ISO -> total seconds

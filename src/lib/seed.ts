import type { Goal, ScheduleConfig } from "@/types";

export const defaultSchedule: ScheduleConfig = {
  modo: "ciclos",
  horasDia: 0,
  semanal: {},
  ciclos: [],
  provas: [],
};

export function defaultGoals(): Goal[] {
  return [];
}

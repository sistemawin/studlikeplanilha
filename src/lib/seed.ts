import type { Goal, ScheduleConfig } from "@/types";

export const defaultSchedule: ScheduleConfig = {
  modo: "ciclos",
  horasDia: 4,
  semanal: {},
  ciclos: [],
};

export function defaultGoals(): Goal[] {
  return [
    { id: crypto.randomUUID(), tipo: "questões", valorObjetivo: 50, valorAtual: 0 },
    { id: crypto.randomUUID(), tipo: "horas", valorObjetivo: 4, valorAtual: 0 },
  ];
}

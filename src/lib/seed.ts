import type { Goal, ScheduleConfig } from "@/types";
import { isoDate } from "@/lib/utils";

export const defaultSchedule: ScheduleConfig = {
  modo: "ciclos",
  horasDia: 4,
  semanal: {},
  ciclos: [],
};

export function defaultGoals(): Goal[] {
  const today = isoDate(new Date());
  return [
    { id: crypto.randomUUID(), tipo: "questões", valorObjetivo: 50, valorAtual: 0, dataReferencia: today },
    { id: crypto.randomUUID(), tipo: "horas", valorObjetivo: 4, valorAtual: 0, dataReferencia: today },
  ];
}

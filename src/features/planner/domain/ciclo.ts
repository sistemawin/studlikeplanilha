import type { ScheduleConfig, Subject } from "@/types";

export const DAY_KEYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"] as const;
export type DayKey = (typeof DAY_KEYS)[number];

export const DAY_LABELS: Record<DayKey, string> = {
  dom: "Domingo",
  seg: "Segunda",
  ter: "Terça",
  qua: "Quarta",
  qui: "Quinta",
  sex: "Sexta",
  sab: "Sábado",
};

/**
 * Returns the current subject for a cyclic study plan given today's position.
 * Cycles through subjects in order, resetting when the list ends.
 */
export function currentCicloSubject(
  ciclos: string[],
  sessionCount: number,
): string | null {
  if (ciclos.length === 0) return null;
  return ciclos[sessionCount % ciclos.length];
}

/**
 * Automatically distributes subjects into a ciclo list based on their weight (peso).
 * Subjects with higher weight appear more frequently.
 * Returns the new ciclo array.
 */
export function autoDistributeCiclo(subjects: Subject[]): string[] {
  if (subjects.length === 0) return [];
  const totalWeight = subjects.reduce((sum, s) => sum + s.peso, 0);
  if (totalWeight === 0) return subjects.map((s) => s.id);

  const result: string[] = [];
  for (const subject of subjects) {
    const slots = Math.max(1, Math.round((subject.peso / totalWeight) * subjects.length * 2));
    for (let i = 0; i < slots; i++) result.push(subject.id);
  }
  return result;
}

/**
 * Returns the total weekly hours for a semanal schedule config.
 */
export function weeklyHoursFromSemanal(
  schedule: ScheduleConfig,
  subjectIds: string[],
): number {
  if (schedule.modo !== "semanal") return 0;
  return Object.values(schedule.semanal ?? {})
    .flat()
    .filter((id) => subjectIds.includes(id)).length * schedule.horasDia;
}

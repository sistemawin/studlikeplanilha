import { describe, expect, it } from "vitest";
import { autoDistributeCiclo, currentCicloSubject, weeklyHoursFromSemanal } from "./ciclo";
import type { Subject, ScheduleConfig } from "@/types";

const makeSubject = (id: string, peso: number): Subject => ({
  id, nome: id, peso, cor: "bg-blue-500",
});

describe("autoDistributeCiclo", () => {
  it("returns empty array for no subjects", () => {
    expect(autoDistributeCiclo([])).toEqual([]);
  });

  it("includes each subject at least once", () => {
    const subjects = [makeSubject("A", 2), makeSubject("B", 1)];
    const ciclo = autoDistributeCiclo(subjects);
    expect(ciclo).toContain("A");
    expect(ciclo).toContain("B");
  });

  it("gives more slots to higher-weight subjects", () => {
    const subjects = [makeSubject("A", 3), makeSubject("B", 1)];
    const ciclo = autoDistributeCiclo(subjects);
    const countA = ciclo.filter((id) => id === "A").length;
    const countB = ciclo.filter((id) => id === "B").length;
    expect(countA).toBeGreaterThan(countB);
  });

  it("handles all-zero weights gracefully", () => {
    const subjects = [makeSubject("A", 0), makeSubject("B", 0)];
    const ciclo = autoDistributeCiclo(subjects);
    expect(ciclo).toContain("A");
    expect(ciclo).toContain("B");
  });
});

describe("currentCicloSubject", () => {
  it("returns null for empty ciclo", () => {
    expect(currentCicloSubject([], 0)).toBeNull();
  });

  it("returns first item for session 0", () => {
    expect(currentCicloSubject(["A", "B", "C"], 0)).toBe("A");
  });

  it("cycles through subjects", () => {
    const ciclo = ["A", "B", "C"];
    expect(currentCicloSubject(ciclo, 3)).toBe("A");
    expect(currentCicloSubject(ciclo, 4)).toBe("B");
    expect(currentCicloSubject(ciclo, 5)).toBe("C");
  });
});

describe("weeklyHoursFromSemanal", () => {
  const schedule: ScheduleConfig = {
    modo: "semanal",
    horasDia: 3,
    semanal: {
      seg: ["A", "B"],
      ter: ["A"],
      qua: [],
    },
    ciclos: [],
    provas: [],
  };

  it("returns 0 for ciclos mode", () => {
    const ciclosSchedule: ScheduleConfig = { ...schedule, modo: "ciclos" };
    expect(weeklyHoursFromSemanal(ciclosSchedule, ["A", "B"])).toBe(0);
  });

  it("counts subject slots across all days", () => {
    // seg has A and B (2 slots), ter has A (1 slot) = 3 slots × 3h = 9h
    expect(weeklyHoursFromSemanal(schedule, ["A", "B"])).toBe(9);
  });

  it("ignores subjects not in the provided list", () => {
    // Only counting "A" = seg(1) + ter(1) = 2 × 3h = 6h
    expect(weeklyHoursFromSemanal(schedule, ["A"])).toBe(6);
  });
});

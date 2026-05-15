import { describe, expect, it } from "vitest";
import { serializeAppState, validateSchedule } from "./sync";
import { scheduleSeed } from "./seed";
import type { AppState } from "@/types";

describe("validateSchedule", () => {
  it("retorna fallback para valor null", () => {
    expect(validateSchedule(null, scheduleSeed)).toEqual(scheduleSeed);
  });

  it("retorna fallback para modo inválido", () => {
    const invalid = { modo: "outro", horasDia: 4, semanal: {}, ciclos: [] };
    expect(validateSchedule(invalid, scheduleSeed)).toEqual(scheduleSeed);
  });

  it("aceita modo 'semanal'", () => {
    const valid = { modo: "semanal", horasDia: 3, semanal: {}, ciclos: [] };
    const result = validateSchedule(valid, scheduleSeed);
    expect(result.modo).toBe("semanal");
    expect(result.horasDia).toBe(3);
  });

  it("aceita modo 'ciclos'", () => {
    const valid = { modo: "ciclos", horasDia: 6, semanal: {}, ciclos: ["a", "b"] };
    const result = validateSchedule(valid, scheduleSeed);
    expect(result.modo).toBe("ciclos");
    expect(result.ciclos).toEqual(["a", "b"]);
  });

  it("usa horasDia do fallback quando valor não é número", () => {
    const invalid = { modo: "semanal", horasDia: "abc", semanal: {}, ciclos: [] };
    const result = validateSchedule(invalid, scheduleSeed);
    expect(result.horasDia).toBe(scheduleSeed.horasDia);
  });

  it("retorna fallback para string primitiva", () => {
    expect(validateSchedule("semanal", scheduleSeed)).toEqual(scheduleSeed);
  });
});

describe("serializeAppState", () => {
  const baseState: AppState = {
    subjects: [],
    topics: [],
    reviews: [],
    schedule: scheduleSeed,
    goals: [],
    exams: [],
  };

  it("retorna string JSON", () => {
    const result = serializeAppState(baseState);
    expect(typeof result).toBe("string");
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("dois estados iguais produzem a mesma string", () => {
    const a = serializeAppState(baseState);
    const b = serializeAppState({ ...baseState });
    expect(a).toBe(b);
  });

  it("estados diferentes produzem strings diferentes", () => {
    const a = serializeAppState(baseState);
    const b = serializeAppState({ ...baseState, subjects: [{ id: "x", nome: "X", peso: 1, cor: "bg-blue-500" }] });
    expect(a).not.toBe(b);
  });
});

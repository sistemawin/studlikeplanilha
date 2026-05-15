import { describe, expect, it } from "vitest";
import { serializeAppState, validateSchedule } from "./sync";
import { defaultSchedule } from "./seed";
import type { AppState } from "@/types";

describe("validateSchedule", () => {
  it("retorna fallback para valor null", () => {
    expect(validateSchedule(null, defaultSchedule)).toEqual(defaultSchedule);
  });

  it("retorna fallback para modo inválido", () => {
    const invalid = { modo: "outro", horasDia: 4, semanal: {}, ciclos: [] };
    expect(validateSchedule(invalid, defaultSchedule)).toEqual(defaultSchedule);
  });

  it("aceita modo 'semanal'", () => {
    const valid = { modo: "semanal", horasDia: 3, semanal: {}, ciclos: [] };
    const result = validateSchedule(valid, defaultSchedule);
    expect(result.modo).toBe("semanal");
    expect(result.horasDia).toBe(3);
  });

  it("aceita modo 'ciclos'", () => {
    const valid = { modo: "ciclos", horasDia: 6, semanal: {}, ciclos: ["a", "b"] };
    const result = validateSchedule(valid, defaultSchedule);
    expect(result.modo).toBe("ciclos");
    expect(result.ciclos).toEqual(["a", "b"]);
  });

  it("usa horasDia do fallback quando valor não é número", () => {
    const invalid = { modo: "semanal", horasDia: "abc", semanal: {}, ciclos: [] };
    const result = validateSchedule(invalid, defaultSchedule);
    expect(result.horasDia).toBe(defaultSchedule.horasDia);
  });

  it("retorna fallback para string primitiva", () => {
    expect(validateSchedule("semanal", defaultSchedule)).toEqual(defaultSchedule);
  });
});

describe("serializeAppState", () => {
  const baseState: AppState = {
    subjects: [],
    topics: [],
    reviews: [],
    schedule: defaultSchedule,
    goals: [],
    exams: [],
    questionLogs: [],
    studySessions: [],
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

import { describe, expect, it } from "vitest";
import { addDays, corToAccent, formatTimer, isoDate, pct, topicScore } from "./utils";

describe("pct", () => {
  it("retorna 0 quando total é 0", () => {
    expect(pct(0, 0)).toBe(0);
    expect(pct(5, 0)).toBe(0);
  });

  it("calcula percentual corretamente", () => {
    expect(pct(1, 4)).toBe(25);
    expect(pct(3, 4)).toBe(75);
    expect(pct(10, 10)).toBe(100);
  });

  it("arredonda para inteiro", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });
});

describe("isoDate", () => {
  it("retorna data no formato YYYY-MM-DD", () => {
    const date = new Date("2026-05-15T12:00:00Z");
    expect(isoDate(date)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("addDays", () => {
  it("adiciona dias corretamente", () => {
    const base = new Date("2026-05-01T12:00:00");
    expect(addDays(base, 1)).toBe("2026-05-02");
    expect(addDays(base, 30)).toBe("2026-05-31");
    expect(addDays(base, 0)).toBe("2026-05-01");
  });

  it("ultrapassa a virada do mês", () => {
    const base = new Date("2026-01-31T12:00:00");
    expect(addDays(base, 1)).toBe("2026-02-01");
  });
});

describe("topicScore", () => {
  it("'Revisado' tem pontuação máxima", () => {
    expect(topicScore("Revisado", "Médio")).toBe(94);
  });

  it("'Não Estudado' tem pontuação mínima", () => {
    expect(topicScore("Não Estudado", "Médio")).toBe(8);
  });

  it("dificuldade Fácil adiciona bônus", () => {
    const facil = topicScore("Teoria Lida", "Fácil");
    const medio = topicScore("Teoria Lida", "Médio");
    expect(facil).toBeGreaterThan(medio);
  });

  it("dificuldade Difícil penaliza", () => {
    const dificil = topicScore("Teoria Lida", "Difícil");
    const medio = topicScore("Teoria Lida", "Médio");
    expect(dificil).toBeLessThan(medio);
  });

  it("resultado nunca sai do intervalo [0, 100]", () => {
    const statuses = ["Não Estudado", "Teoria Lida", "Questões Feitas", "Revisado"] as const;
    const difficulties = ["Fácil", "Médio", "Difícil"] as const;
    for (const status of statuses) {
      for (const diff of difficulties) {
        const score = topicScore(status, diff);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe("corToAccent", () => {
  it("retorna accent correto para cor conhecida", () => {
    const accent = corToAccent("bg-emerald-500");
    expect(accent.dot).toBe("bg-emerald-500");
    expect(accent.chart).toBe("#10b981");
  });

  it("retorna fallback slate para cor desconhecida", () => {
    const accent = corToAccent("bg-inexistente-999");
    expect(accent.dot).toBe("bg-slate-500");
    expect(accent.chart).toBe("#64748b");
  });

  it("string vazia retorna fallback", () => {
    const accent = corToAccent("");
    expect(accent.dot).toBe("bg-slate-500");
  });
});

describe("formatTimer", () => {
  it("formata segundos como MM:SS", () => {
    expect(formatTimer(0)).toBe("00:00");
    expect(formatTimer(61)).toBe("01:01");
    expect(formatTimer(3600)).toBe("60:00");
  });

  it("preenche zeros à esquerda", () => {
    expect(formatTimer(5)).toBe("00:05");
    expect(formatTimer(65)).toBe("01:05");
  });
});

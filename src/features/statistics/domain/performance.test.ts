import { describe, expect, it } from "vitest";
import {
  subjectScore,
  generalProgressScore,
  averageExamScore,
  totalQuestionsLogged,
  totalCorrectAnswers,
  questionHitRate,
  totalStudyHours,
} from "./performance";
import type { Exam, QuestionLog, StudySession, Topic } from "@/types";

const makeTopic = (status: Topic["status"], dificuldade: Topic["dificuldade"] = "Médio"): Topic => ({
  id: "t1", materiaId: "m1", titulo: "T", status, dificuldade, estudadoEm: undefined,
});

const makeLog = (quantidade: number, acertos: number | null = null): QuestionLog => ({
  id: "l1", materiaId: "m1", topicoId: "t1", quantidade, acertos, data: "2025-01-01",
});

const makeSession = (durationSeconds: number): StudySession => ({
  id: "s1", tipo: "topico", data: "2025-01-01", endedAt: "", durationSeconds,
});

const makeExam = (acertos: number, total: number): Exam => ({
  id: "e1", nome: "Simulado", acertos, total, data: "2025-01-01",
});

describe("subjectScore", () => {
  it("returns 0 for empty topics", () => expect(subjectScore([])).toBe(0));
  it("returns 0 for Não Estudado topics", () => {
    expect(subjectScore([makeTopic("Não Estudado")])).toBe(0);
  });
  it("returns 100 for Revisado + Fácil", () => {
    expect(subjectScore([makeTopic("Revisado", "Fácil")])).toBe(98); // 94 + 4
  });
  it("averages multiple topics", () => {
    const topics = [makeTopic("Revisado"), makeTopic("Não Estudado")];
    expect(subjectScore(topics)).toBe(47); // (94 + 0) / 2
  });
});

describe("generalProgressScore", () => {
  it("returns 0 for empty", () => expect(generalProgressScore([])).toBe(0));
  it("averages all topics", () => {
    const topics = [makeTopic("Revisado"), makeTopic("Teoria Lida"), makeTopic("Não Estudado")];
    expect(generalProgressScore(topics)).toBe(Math.round((94 + 42 + 0) / 3));
  });
});

describe("averageExamScore", () => {
  it("returns 0 for empty", () => expect(averageExamScore([])).toBe(0));
  it("returns 0 for exam with 0 total", () => expect(averageExamScore([makeExam(0, 0)])).toBe(0));
  it("calculates hit rate percentage", () => {
    expect(averageExamScore([makeExam(8, 10)])).toBe(80);
  });
  it("averages multiple exams", () => {
    expect(averageExamScore([makeExam(10, 10), makeExam(0, 10)])).toBe(50);
  });
});

describe("totalQuestionsLogged", () => {
  it("returns 0 for empty", () => expect(totalQuestionsLogged([])).toBe(0));
  it("sums all quantities", () => {
    expect(totalQuestionsLogged([makeLog(10), makeLog(5), makeLog(3)])).toBe(18);
  });
});

describe("totalCorrectAnswers", () => {
  it("returns 0 for null acertos", () => expect(totalCorrectAnswers([makeLog(10, null)])).toBe(0));
  it("sums acertos correctly", () => {
    expect(totalCorrectAnswers([makeLog(10, 8), makeLog(5, 3)])).toBe(11);
  });
});

describe("questionHitRate", () => {
  it("returns 0 for empty", () => expect(questionHitRate([])).toBe(0));
  it("returns 0 for zero total", () => expect(questionHitRate([makeLog(0, 0)])).toBe(0));
  it("calculates percentage", () => {
    expect(questionHitRate([makeLog(10, 7)])).toBe(70);
  });
});

describe("totalStudyHours", () => {
  it("returns 0 for empty", () => expect(totalStudyHours([])).toBe(0));
  it("converts seconds to hours", () => {
    expect(totalStudyHours([makeSession(3600)])).toBe(1);
  });
  it("rounds to 1 decimal", () => {
    expect(totalStudyHours([makeSession(5400)])).toBe(1.5);
  });
  it("sums multiple sessions", () => {
    expect(totalStudyHours([makeSession(3600), makeSession(1800)])).toBe(1.5);
  });
});

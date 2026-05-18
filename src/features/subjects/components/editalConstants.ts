import type { Difficulty, TopicStatus } from "@/types";

export const STATUS_COLORS: Record<TopicStatus, { bg: string; text: string }> = {
  "Não Estudado": { bg: "rgba(239,68,68,0.18)", text: "#fca5a5" },
  "Teoria Lida": { bg: "rgba(245,158,11,0.18)", text: "#fcd34d" },
  "Questões Feitas": { bg: "rgba(59,130,246,0.18)", text: "#93c5fd" },
  Revisado: { bg: "rgba(16,185,129,0.18)", text: "#6ee7b7" },
};

export const DIFFICULTY_COLORS: Record<Difficulty, { bg: string; text: string }> = {
  Fácil: { bg: "rgba(16,185,129,0.12)", text: "#6ee7b7" },
  Médio: { bg: "rgba(245,158,11,0.12)", text: "#fcd34d" },
  Difícil: { bg: "rgba(239,68,68,0.12)", text: "#fca5a5" },
};

export const STATUS_CYCLE: TopicStatus[] = ["Não Estudado", "Teoria Lida", "Questões Feitas", "Revisado"];
export const DIFFICULTY_CYCLE: Difficulty[] = ["Fácil", "Médio", "Difícil"];

export const STATUS_ORDER: Record<TopicStatus, number> = {
  "Não Estudado": 0,
  "Teoria Lida": 1,
  "Questões Feitas": 2,
  Revisado: 3,
};
export const DIFFICULTY_ORDER: Record<Difficulty, number> = { Fácil: 0, Médio: 1, Difícil: 2 };

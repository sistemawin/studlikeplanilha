import type { TopicStatus, Difficulty } from "@/types";

export const TOPIC_STATUSES: TopicStatus[] = [
  "Não Estudado",
  "Teoria Lida",
  "Questões Feitas",
  "Revisado",
];

export const DIFFICULTY_LEVELS: Difficulty[] = ["Fácil", "Médio", "Difícil"];

export const SUBJECT_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-orange-500",
] as const;

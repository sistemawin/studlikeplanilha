import type { Subject } from "@/types";

export type SubjectPerformance = {
  subject: Subject;
  score: number;
  topicCount: number;
};

export type QuestionStat = {
  materiaId: string;
  materiaNome: string;
  total: number;
  acertos: number;
  hitRate: number;
};

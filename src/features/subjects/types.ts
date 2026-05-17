import type { Subject, Topic, TopicStatus, Difficulty } from "@/types";

export type SubjectWithTopics = Subject & { topics: Topic[] };

export type TopicFormData = {
  titulo: string;
  materiaId: string;
  status: TopicStatus;
  dificuldade: Difficulty;
};

export type StatusFilter = "todos" | TopicStatus;
export type DifficultyFilter = "todas" | Difficulty;

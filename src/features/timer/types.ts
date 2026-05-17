import type { StudySessionType } from "@/types";

export type SessionData = {
  topicId?: string;
  reviewId?: string;
};

export type PomodoroDuration = 25 | 45 | 60;

export type TimerMode = "livre" | "pomodoro";

export type SessionTypeOption = "topico" | "revisao";

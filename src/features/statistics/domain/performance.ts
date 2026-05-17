import type { Exam, QuestionLog, StudySession, Subject, Topic } from "@/types";
import { topicScore, pct } from "@/lib/utils";

/**
 * Calculates a subject's performance score (0–100) based on topic statuses and difficulties.
 */
export function subjectScore(subjectTopics: Topic[]): number {
  if (subjectTopics.length === 0) return 0;
  const total = subjectTopics.reduce((sum, t) => sum + topicScore(t.status, t.dificuldade), 0);
  return Math.round(total / subjectTopics.length);
}

/**
 * Calculates overall study progress across all subjects (0–100).
 */
export function generalProgressScore(topics: Topic[]): number {
  if (topics.length === 0) return 0;
  const total = topics.reduce((sum, t) => sum + topicScore(t.status, t.dificuldade), 0);
  return Math.round(total / topics.length);
}

/**
 * Calculates the average exam hit rate (acertos/total) from all recorded exams, as 0–100.
 */
export function averageExamScore(exams: Exam[]): number {
  const valid = exams.filter((e) => e.total > 0);
  if (valid.length === 0) return 0;
  const avg = valid.reduce((sum, e) => sum + (e.acertos / e.total) * 100, 0) / valid.length;
  return Math.round(avg * 10) / 10;
}

/**
 * Returns the total number of questions logged across all logs.
 */
export function totalQuestionsLogged(logs: QuestionLog[]): number {
  return logs.reduce((sum, q) => sum + q.quantidade, 0);
}

/**
 * Returns the total number of correct answers across all logs.
 */
export function totalCorrectAnswers(logs: QuestionLog[]): number {
  return logs.reduce((sum, q) => sum + (q.acertos ?? 0), 0);
}

/**
 * Returns the overall question hit rate (0–100).
 */
export function questionHitRate(logs: QuestionLog[]): number {
  const total = totalQuestionsLogged(logs);
  const correct = totalCorrectAnswers(logs);
  return pct(correct, total);
}

/**
 * Calculates total study hours from session records.
 */
export function totalStudyHours(sessions: StudySession[]): number {
  const secs = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
  return Math.round((secs / 3600) * 10) / 10;
}

/**
 * Groups question logs by subject with aggregated stats.
 */
export function questionLogsBySubject(
  logs: QuestionLog[],
  subjects: Subject[],
): Array<{ subject: Subject; logs: QuestionLog[]; total: number; hitRate: number }> {
  return subjects.map((subject) => {
    const subjectLogs = logs.filter((l) => l.materiaId === subject.id);
    return {
      subject,
      logs: subjectLogs,
      total: totalQuestionsLogged(subjectLogs),
      hitRate: questionHitRate(subjectLogs),
    };
  });
}

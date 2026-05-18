"use client";

import type { Dispatch, SetStateAction } from "react";
import type { Difficulty, QuestionLog, Review, ReviewType, Subject, Topic, TopicStatus } from "@/types";
import { addDays } from "@/lib/utils";

type SetState<T> = Dispatch<SetStateAction<T>>;

type TopicActionsDeps = {
  topics: Topic[];
  subjects: Subject[];
  todayIso: string;
  setTopics: SetState<Topic[]>;
  setReviews: SetState<Review[]>;
  setQuestionLogs: SetState<QuestionLog[]>;
  setNotice: (msg: string) => void;
  preventReadOnlyAction: () => boolean;
};

export function useTopicActions({
  topics,
  subjects,
  todayIso,
  setTopics,
  setReviews,
  setQuestionLogs,
  setNotice,
  preventReadOnlyAction,
}: TopicActionsDeps) {
  function scheduleReviews(topic: Topic) {
    const base = new Date(`${todayIso}T12:00:00`);
    const dayOffsets = [1, 7, 21, 30];
    const diffOffsets = topic.dificuldade === "Difícil" ? [3, 10, 17] : topic.dificuldade === "Médio" ? [7, 21] : [14];

    const spaced = dayOffsets.map((days) => ({
      id: crypto.randomUUID(),
      topicoId: topic.id,
      dataAgendada: addDays(base, days),
      concluida: false,
      tipo: String(days) as ReviewType,
    }));
    const byDifficulty = diffOffsets.map((days) => ({
      id: crypto.randomUUID(),
      topicoId: topic.id,
      dataAgendada: addDays(base, days),
      concluida: false,
      tipo: "dificuldade" as ReviewType,
    }));

    setReviews((current) => [
      ...current.filter((r) => r.topicoId !== topic.id || r.concluida),
      ...spaced,
      ...byDifficulty,
    ]);
  }

  function updateTopicStatus(topicId: string, status: TopicStatus, options?: { silent?: boolean }) {
    if (preventReadOnlyAction()) return;
    const current = topics.find((t) => t.id === topicId);
    if (!current) return;
    const next = { ...current, status, estudadoEm: status === "Não Estudado" ? undefined : todayIso };
    setTopics((ts) => ts.map((t) => (t.id === topicId ? next : t)));
    if (status === "Questões Feitas" || status === "Revisado") scheduleReviews(next);
    if (!options?.silent) {
      setNotice(`Status de "${current.titulo}" atualizado para ${status}.`);
    }
  }

  function updateTopicDifficulty(topicId: string, difficulty: Difficulty) {
    if (preventReadOnlyAction()) return;
    const topic = topics.find((t) => t.id === topicId);
    setTopics((ts) => ts.map((t) => (t.id === topicId ? { ...t, dificuldade: difficulty } : t)));
    setNotice(`Dificuldade${topic ? ` de "${topic.titulo}"` : ""} atualizada para ${difficulty}.`);
  }

  function moveTopic(topicId: string, targetSubjectId: string) {
    if (preventReadOnlyAction()) return;
    const topic = topics.find((t) => t.id === topicId);
    const targetSubject = subjects.find((s) => s.id === targetSubjectId);
    if (!topic || !targetSubject) return;
    setTopics((ts) => ts.map((t) => (t.id === topicId ? { ...t, materiaId: targetSubjectId } : t)));
    setQuestionLogs((logs) => logs.map((log) => log.topicoId === topicId ? { ...log, materiaId: targetSubjectId } : log));
    setNotice(`"${topic.titulo}" movido para ${targetSubject.nome}.`);
  }

  function editTopicTitle(topicId: string, newTitle: string) {
    if (preventReadOnlyAction()) return;
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    const topic = topics.find((t) => t.id === topicId);
    if (!topic || topic.titulo === trimmed) return;
    setTopics((ts) => ts.map((t) => (t.id === topicId ? { ...t, titulo: trimmed } : t)));
    setNotice(`Tópico renomeado.`);
  }

  return {
    updateTopicStatus,
    updateTopicDifficulty,
    moveTopic,
    editTopicTitle,
  };
}

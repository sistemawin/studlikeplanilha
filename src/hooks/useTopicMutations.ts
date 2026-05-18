"use client";

import type { Dispatch, SetStateAction } from "react";
import type { ConfirmDialogState, Difficulty, QuestionLog, Review, Topic, TopicStatus } from "@/types";

type SetState<T> = Dispatch<SetStateAction<T>>;

type TopicMutationsDeps = {
  topics: Topic[];
  reviews: Review[];
  questionLogs: QuestionLog[];
  setTopics: SetState<Topic[]>;
  setReviews: SetState<Review[]>;
  setQuestionLogs: SetState<QuestionLog[]>;
  setNewTopicText: SetState<string>;
  setSelectedManualTopic: SetState<string>;
  setNotice: (msg: string) => void;
  setConfirmDialog: (d: ConfirmDialogState | null) => void;
  preventReadOnlyAction: () => boolean;
};

export function useTopicMutations({
  topics,
  reviews,
  questionLogs,
  setTopics,
  setReviews,
  setQuestionLogs,
  setNewTopicText,
  setSelectedManualTopic,
  setNotice,
  setConfirmDialog,
  preventReadOnlyAction,
}: TopicMutationsDeps) {
  function addTopicsFromText(text: string, subjectId: string) {
    if (preventReadOnlyAction()) return;
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setNotice("Cole pelo menos um tópico antes de adicionar.");
      return;
    }
    if (!subjectId) {
      setNotice("Selecione uma matéria antes de adicionar tópicos.");
      return;
    }
    setTopics((ts) => [
      ...ts,
      ...lines.map((line) => ({
        id: crypto.randomUUID(),
        materiaId: subjectId,
        titulo: line.replace(/^[-*0-9. ]+/, ""),
        status: "Não Estudado" as TopicStatus,
        dificuldade: "Médio" as Difficulty,
      })),
    ]);
    setNewTopicText("");
    setNotice(`${lines.length} tópico${lines.length > 1 ? "s" : ""} adicionado${lines.length > 1 ? "s" : ""}.`);
  }

  function confirmDeleteTopic(topicId: string, currentManualTopic: string) {
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return;
    const remainingTopics = topics.filter((t) => t.id !== topicId);
    setTopics(remainingTopics);
    setReviews((rs) => rs.filter((r) => r.topicoId !== topicId));
    setQuestionLogs((logs) => logs.filter((log) => log.topicoId !== topicId));
    if (currentManualTopic === topicId) setSelectedManualTopic(remainingTopics[0]?.id ?? "");
    setNotice(`Tópico "${topic.titulo}" removido.`);
  }

  function deleteTopic(topicId: string, currentManualTopic: string) {
    if (preventReadOnlyAction()) return;
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return;
    const reviewCount = reviews.filter((r) => r.topicoId === topicId).length;
    const questionLogCount = questionLogs.filter((log) => log.topicoId === topicId).length;
    const relatedEffects = [
      reviewCount > 0 ? `${reviewCount} revisão${reviewCount !== 1 ? "ões" : ""} vinculada${reviewCount !== 1 ? "s" : ""}` : "",
      questionLogCount > 0 ? `${questionLogCount} registro${questionLogCount !== 1 ? "s" : ""} de questões vinculado${questionLogCount !== 1 ? "s" : ""}` : "",
    ].filter(Boolean).join(" e ");
    setConfirmDialog({
      title: "Excluir tópico?",
      description: `Você vai excluir "${topic.titulo}".`,
      details: relatedEffects
        ? `${relatedEffects} serão removidos. Essa ação não pode ser desfeita.`
        : "Essa ação não pode ser desfeita.",
      confirmLabel: "Excluir tópico",
      onConfirm: () => confirmDeleteTopic(topicId, currentManualTopic),
    });
  }

  return { addTopicsFromText, deleteTopic };
}

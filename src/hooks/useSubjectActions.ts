"use client";

import type { Dispatch, SetStateAction } from "react";
import type {
  ConfirmDialogState,
  Difficulty,
  QuestionLog,
  Review,
  ScheduleConfig,
  Subject,
  Topic,
  TopicStatus,
} from "@/types";

type SetState<T> = Dispatch<SetStateAction<T>>;

type SubjectActionsDeps = {
  // State values (read)
  subjects: Subject[];
  topics: Topic[];
  reviews: Review[];
  questionLogs: QuestionLog[];
  selectedSubject: string;
  selectedManualTopic: string;
  // State setters
  setSubjects: SetState<Subject[]>;
  setTopics: SetState<Topic[]>;
  setReviews: SetState<Review[]>;
  setQuestionLogs: SetState<QuestionLog[]>;
  setSchedule: SetState<ScheduleConfig>;
  setSelectedSubject: SetState<string>;
  setSelectedManualTopic: SetState<string>;
  setSubjectModal: SetState<{ open: boolean; subject?: Subject }>;
  // Callbacks
  setNotice: (msg: string) => void;
  setConfirmDialog: (d: ConfirmDialogState | null) => void;
  preventReadOnlyAction: () => boolean;
};

export function useSubjectActions({
  subjects,
  topics,
  reviews,
  questionLogs,
  selectedSubject,
  selectedManualTopic,
  setSubjects,
  setTopics,
  setReviews,
  setQuestionLogs,
  setSchedule,
  setSelectedSubject,
  setSelectedManualTopic,
  setSubjectModal,
  setNotice,
  setConfirmDialog,
  preventReadOnlyAction,
}: SubjectActionsDeps) {
  function addSubject(data: { nome: string; peso: number; cor: string; topicos: string[] }) {
    if (preventReadOnlyAction()) return;
    const newSubject: Subject = { id: crypto.randomUUID(), nome: data.nome, peso: data.peso, cor: data.cor };
    setSubjects((ss) => [...ss, newSubject]);
    setSelectedSubject(newSubject.id);
    if (data.topicos.length > 0) {
      setTopics((ts) => [
        ...ts,
        ...data.topicos.map((titulo) => ({
          id: crypto.randomUUID(),
          materiaId: newSubject.id,
          titulo: titulo.replace(/^[-*0-9. ]+/, ""),
          status: "Não Estudado" as TopicStatus,
          dificuldade: "Médio" as Difficulty,
        })),
      ]);
    }
    setSubjectModal({ open: false });
    const topMsg = data.topicos.length > 0 ? ` com ${data.topicos.length} tópico${data.topicos.length !== 1 ? "s" : ""}` : "";
    setNotice(`Matéria "${data.nome}" criada${topMsg}.`);
  }

  function updateSubject(id: string, data: { nome: string; peso: number; cor: string; topicos: string[] }) {
    if (preventReadOnlyAction()) return;
    setSubjects((ss) => ss.map((s) => (s.id === id ? { ...s, ...data } : s)));
    setSubjectModal({ open: false });
    setNotice(`Matéria "${data.nome}" atualizada.`);
  }

  function confirmDeleteSubject(subjectId: string) {
    const subject = subjects.find((s) => s.id === subjectId);
    const topicsInSubject = topics.filter((t) => t.materiaId === subjectId);
    const topicIds = new Set(topicsInSubject.map((t) => t.id));
    const label = subject?.nome ?? "matéria";
    const remainingSubjects = subjects.filter((s) => s.id !== subjectId);
    const remainingTopics = topics.filter((t) => t.materiaId !== subjectId);

    setSubjects(remainingSubjects);
    setTopics(remainingTopics);
    setReviews((rs) => rs.filter((r) => !topicIds.has(r.topicoId)));
    setQuestionLogs((logs) => logs.filter((log) => log.materiaId !== subjectId));
    setSchedule((sc) => ({
      ...sc,
      ciclos: sc.ciclos.filter((id) => id !== subjectId),
      semanal: Object.fromEntries(
        Object.entries(sc.semanal).map(([day, ids]) => [day, ids.filter((id) => id !== subjectId)]),
      ),
    }));
    if (selectedSubject === subjectId) setSelectedSubject(remainingSubjects[0]?.id ?? "");
    if (topicIds.has(selectedManualTopic)) setSelectedManualTopic(remainingTopics[0]?.id ?? "");
    setNotice(`Matéria "${label}" excluída.`);
  }

  function deleteSubject(subjectId: string) {
    if (preventReadOnlyAction()) return;
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;
    const topicsInSubject = topics.filter((t) => t.materiaId === subjectId);
    const reviewCount = reviews.filter((r) => topicsInSubject.some((topic) => topic.id === r.topicoId)).length;
    const questionLogCount = questionLogs.filter((log) => log.materiaId === subjectId).length;
    setConfirmDialog({
      title: "Excluir matéria?",
      description: `Você vai excluir "${subject.nome}".`,
      details: [
        `${topicsInSubject.length} tópico${topicsInSubject.length !== 1 ? "s" : ""}`,
        `${reviewCount} revisão${reviewCount !== 1 ? "ões" : ""}`,
        `${questionLogCount} registro${questionLogCount !== 1 ? "s" : ""} de questões`,
        "serão removidos. Essa ação não pode ser desfeita.",
      ].join(" "),
      confirmLabel: "Excluir matéria",
      onConfirm: () => confirmDeleteSubject(subjectId),
    });
  }

  return {
    addSubject,
    updateSubject,
    deleteSubject,
  };
}

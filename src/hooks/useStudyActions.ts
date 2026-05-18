"use client";

import type { Dispatch, SetStateAction } from "react";
import type {
  ConfirmDialogState,
  Exam,
  Goal,
  QuestionLog,
  Review,
  ScheduleConfig,
  StudySession,
  Subject,
  Topic,
  TopicStatus,
} from "@/types";
import type { StudySessionType } from "@/types";
import { formatTimer } from "@/lib/utils";

type SetState<T> = Dispatch<SetStateAction<T>>;
type ExamDraft = { nome: string; acertos: number; total: number };

type StudyActionsDeps = {
  // State values (read)
  reviews: Review[];
  subjects: Subject[];
  topics: Topic[];
  exams: Exam[];
  questionLogs: QuestionLog[];
  studySessions: StudySession[];
  selectedManualTopic: string;
  manualDate: string;
  examDraft: ExamDraft;
  todayIso: string;
  // State setters
  setReviews: SetState<Review[]>;
  setGoals: SetState<Goal[]>;
  setExams: SetState<Exam[]>;
  setQuestionLogs: SetState<QuestionLog[]>;
  setStudySessions: SetState<StudySession[]>;
  setSchedule: SetState<ScheduleConfig>;
  setExamDraft: SetState<ExamDraft>;
  // Callbacks
  setNotice: (msg: string) => void;
  setConfirmDialog: (d: ConfirmDialogState | null) => void;
  preventReadOnlyAction: () => boolean;
  updateTopicStatus: (topicId: string, status: TopicStatus, options?: { silent?: boolean }) => void;
};

export function useStudyActions({
  reviews,
  subjects,
  topics,
  exams,
  questionLogs,
  studySessions,
  selectedManualTopic,
  manualDate,
  examDraft,
  todayIso,
  setReviews,
  setGoals,
  setExams,
  setQuestionLogs,
  setStudySessions,
  setSchedule,
  setExamDraft,
  setNotice,
  setConfirmDialog,
  preventReadOnlyAction,
  updateTopicStatus,
}: StudyActionsDeps) {
  // ── Reviews ───────────────────────────────────────────────────────────────

  function completeReview(reviewId: string) {
    if (preventReadOnlyAction()) return;
    setReviews((rs) => rs.map((r) => (r.id === reviewId ? { ...r, concluida: true } : r)));
    setNotice("Revisão concluída.");
  }

  function addManualReview() {
    if (preventReadOnlyAction()) return;
    if (!selectedManualTopic) {
      setNotice("Escolha um tópico para agendar a revisão.");
      return;
    }
    if (!manualDate) {
      setNotice("Escolha uma data para a revisão.");
      return;
    }
    setReviews((rs) => [
      ...rs,
      { id: crypto.randomUUID(), topicoId: selectedManualTopic, dataAgendada: manualDate, concluida: false, tipo: "manual" },
    ]);
    setNotice("Revisão manual agendada.");
  }

  function rescheduleReview(reviewId: string, days: number) {
    if (preventReadOnlyAction()) return;
    setReviews((rs) =>
      rs.map((r) => {
        if (r.id !== reviewId) return r;
        const baseIso = r.dataAgendada < todayIso ? todayIso : r.dataAgendada;
        const base = new Date(baseIso + "T12:00:00");
        const next = new Date(base);
        next.setDate(next.getDate() + days);
        return { ...r, dataAgendada: next.toISOString().slice(0, 10) };
      }),
    );
    setNotice(`Revisão adiada em ${days} dia${days !== 1 ? "s" : ""}.`);
  }

  function completeAllTodayReviews() {
    if (preventReadOnlyAction()) return;
    const pending = reviews.filter((r) => !r.concluida && r.dataAgendada <= todayIso);
    if (pending.length === 0) return;
    setConfirmDialog({
      title: "Concluir todas as revisões?",
      description: `Você vai marcar ${pending.length} revisão${pending.length !== 1 ? "ões" : ""} como concluída${pending.length !== 1 ? "s" : ""}.`,
      details: "Útil quando já estudou todos os tópicos do dia. Essa ação não pode ser desfeita.",
      confirmLabel: "Concluir todas",
      onConfirm: () => {
        const ids = new Set(pending.map((r) => r.id));
        setReviews((rs) => rs.map((r) => (ids.has(r.id) ? { ...r, concluida: true } : r)));
        setNotice(`${pending.length} revisão${pending.length !== 1 ? "ões" : ""} concluída${pending.length !== 1 ? "s" : ""}.`);
      },
    });
  }

  // ── Planner ───────────────────────────────────────────────────────────────

  function autoOrganizeCiclo() {
    if (preventReadOnlyAction()) return;
    const sorted = [...subjects].sort((a, b) => b.peso - a.peso);
    setSchedule((s) => ({ ...s, ciclos: sorted.map((sub) => sub.id) }));
    setNotice("Ciclo organizado por peso das matérias.");
  }

  function addExamDate(nome: string, data: string) {
    if (preventReadOnlyAction()) return;
    setSchedule((s) => ({
      ...s,
      provas: [...(s.provas ?? []), { id: crypto.randomUUID(), nome, data }],
    }));
    setNotice(`Prova "${nome}" adicionada.`);
  }

  function deleteExamDate(id: string) {
    if (preventReadOnlyAction()) return;
    setSchedule((s) => ({
      ...s,
      provas: (s.provas ?? []).filter((p) => p.id !== id),
    }));
    setNotice("Prova removida.");
  }

  function updateSemanal(day: string, ids: string[]) {
    if (preventReadOnlyAction()) return;
    setSchedule((sc) => ({ ...sc, semanal: { ...sc.semanal, [day]: ids } }));
    setNotice("Cronograma semanal atualizado.");
  }

  // ── Exams ─────────────────────────────────────────────────────────────────

  function addExam() {
    if (preventReadOnlyAction()) return;
    if (!examDraft.nome.trim()) { setNotice("Preencha o nome do simulado."); return; }
    if (examDraft.total <= 0) { setNotice("Total de questões deve ser maior que zero."); return; }
    if (examDraft.acertos > examDraft.total) {
      setNotice("Acertos não podem ser maiores que o total de questões.");
      return;
    }
    setExams((es) => [
      { id: crypto.randomUUID(), nome: examDraft.nome.trim(), acertos: examDraft.acertos, total: examDraft.total, data: todayIso },
      ...es,
    ]);
    setExamDraft({ nome: "", acertos: 0, total: 0 });
    setNotice("Simulado salvo.");
  }

  function deleteExam(examId: string) {
    if (preventReadOnlyAction()) return;
    const exam = exams.find((e) => e.id === examId);
    if (!exam) return;
    setConfirmDialog({
      title: "Excluir simulado?",
      description: `Você vai excluir "${exam.nome}".`,
      details: `${exam.acertos}/${exam.total} acertos registrados em ${exam.data}. Essa ação não pode ser desfeita.`,
      confirmLabel: "Excluir simulado",
      onConfirm: () => {
        setExams((es) => es.filter((e) => e.id !== examId));
        setNotice("Simulado removido.");
      },
    });
  }

  // ── Study sessions ────────────────────────────────────────────────────────

  function addManualSession(data: {
    tipo: StudySessionType;
    materiaId?: string;
    materiaNome?: string;
    topicoId?: string;
    topicoTitulo?: string;
    durationSeconds: number;
    data: string;
  }) {
    if (preventReadOnlyAction()) return;
    if (data.durationSeconds <= 0) { setNotice("Informe uma duração maior que zero."); return; }
    const sessionHours = Math.round((data.durationSeconds / 3600) * 100) / 100;
    setStudySessions((ss) => [
      {
        id: crypto.randomUUID(),
        tipo: data.tipo,
        data: data.data || todayIso,
        endedAt: new Date().toISOString(),
        durationSeconds: data.durationSeconds,
        materiaId: data.materiaId,
        materiaNome: data.materiaNome,
        topicoId: data.topicoId,
        topicoTitulo: data.topicoTitulo,
      },
      ...ss,
    ]);
    if (data.data === todayIso) {
      setGoals((gs) =>
        gs.map((g) =>
          g.tipo === "horas"
            ? { ...g, valorAtual: Math.round((g.valorAtual + sessionHours) * 100) / 100 }
            : g,
        ),
      );
    }
    setNotice(`Sessão de ${formatTimer(data.durationSeconds)} registrada.`);
  }

  function deleteStudySession(sessionId: string) {
    if (preventReadOnlyAction()) return;
    const target = studySessions.find((s) => s.id === sessionId);
    if (!target) return;
    setConfirmDialog({
      title: "Excluir sessão?",
      description: `Sessão de ${formatTimer(target.durationSeconds)} registrada em ${target.data}.`,
      details: target.data === todayIso
        ? "O tempo acumulado na meta diária de horas será ajustado. Essa ação não pode ser desfeita."
        : "Essa ação não pode ser desfeita.",
      confirmLabel: "Excluir sessão",
      onConfirm: () => {
        setStudySessions((ss) => ss.filter((s) => s.id !== sessionId));
        if (target.data === todayIso) {
          const sessionHours = Math.round((target.durationSeconds / 3600) * 100) / 100;
          setGoals((gs) =>
            gs.map((g) =>
              g.tipo === "horas"
                ? { ...g, valorAtual: Math.max(0, Math.round((g.valorAtual - sessionHours) * 100) / 100) }
                : g,
            ),
          );
        }
        setNotice("Sessão removida.");
      },
    });
  }

  // ── Question logs ─────────────────────────────────────────────────────────

  function addQuestionLog(data: { materiaId: string; topicoId: string; quantidade: number; acertos: number | null; data: string }) {
    if (preventReadOnlyAction()) return;
    const subject = subjects.find((s) => s.id === data.materiaId);
    const topic = topics.find((t) => t.id === data.topicoId && t.materiaId === data.materiaId);
    if (!subject || !topic) { setNotice("Escolha uma matéria e um tópico válidos."); return; }
    if (data.quantidade <= 0) { setNotice("Informe a quantidade de questões feitas."); return; }
    if (data.acertos !== null && (data.acertos < 0 || data.acertos > data.quantidade)) {
      setNotice("Acertos não podem ser maiores que a quantidade de questões.");
      return;
    }
    setQuestionLogs((logs) => [
      {
        id: crypto.randomUUID(),
        materiaId: data.materiaId,
        topicoId: data.topicoId,
        quantidade: data.quantidade,
        acertos: data.acertos,
        data: data.data,
      },
      ...logs,
    ]);
    if (data.data === todayIso) {
      setGoals((gs) => {
        const existing = gs.find((g) => g.tipo === "questões");
        if (!existing) {
          return [
            ...gs,
            { id: crypto.randomUUID(), tipo: "questões", valorObjetivo: data.quantidade, valorAtual: data.quantidade, dataReferencia: todayIso },
          ];
        }
        return gs.map((g) =>
          g.tipo === "questões"
            ? { ...g, valorAtual: g.valorAtual + data.quantidade, dataReferencia: todayIso }
            : g,
        );
      });
    }
    if (topic.status === "Não Estudado" || topic.status === "Teoria Lida") {
      updateTopicStatus(topic.id, "Questões Feitas", { silent: true });
    }
    setNotice(`${data.quantidade} questão${data.quantidade !== 1 ? "ões" : ""} registrada${data.quantidade !== 1 ? "s" : ""} em ${subject.nome}.`);
  }

  function deleteQuestionLog(logId: string) {
    if (preventReadOnlyAction()) return;
    const log = questionLogs.find((q) => q.id === logId);
    if (!log) return;
    const subject = subjects.find((item) => item.id === log.materiaId);
    const topic = topics.find((item) => item.id === log.topicoId);
    setConfirmDialog({
      title: "Excluir registro de questões?",
      description: `Você vai excluir ${log.quantidade} questão${log.quantidade !== 1 ? "ões" : ""} de "${topic?.titulo ?? "tópico removido"}".`,
      details: `${subject?.nome ?? "Matéria removida"} · ${log.data}${log.acertos !== null ? ` · ${log.acertos} acerto${log.acertos !== 1 ? "s" : ""}` : ""}. Se for de hoje, a meta diária será ajustada.`,
      confirmLabel: "Excluir registro",
      onConfirm: () => {
        setQuestionLogs((logs) => logs.filter((q) => q.id !== logId));
        if (log.data === todayIso) {
          setGoals((gs) =>
            gs.map((g) =>
              g.tipo === "questões"
                ? { ...g, valorAtual: Math.max(0, g.valorAtual - log.quantidade), dataReferencia: todayIso }
                : g,
            ),
          );
        }
        setNotice("Registro de questões removido.");
      },
    });
  }

  // ── Goals ─────────────────────────────────────────────────────────────────

  function updateGoalObjective(tipo: "questões" | "horas", value: number) {
    if (preventReadOnlyAction()) return;
    if (value <= 0) return;
    setGoals((gs) => {
      const existing = gs.find((g) => g.tipo === tipo);
      if (!existing) {
        return [
          ...gs,
          { id: crypto.randomUUID(), tipo, valorObjetivo: value, valorAtual: 0, dataReferencia: todayIso },
        ];
      }
      return gs.map((g) => (g.tipo === tipo ? { ...g, valorObjetivo: value } : g));
    });
    setNotice(`Meta de ${tipo} atualizada para ${value}.`);
  }

  return {
    completeReview,
    addManualReview,
    rescheduleReview,
    completeAllTodayReviews,
    autoOrganizeCiclo,
    addExamDate,
    deleteExamDate,
    updateSemanal,
    addExam,
    deleteExam,
    addManualSession,
    deleteStudySession,
    addQuestionLog,
    deleteQuestionLog,
    updateGoalObjective,
  };
}

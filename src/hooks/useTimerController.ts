"use client";

import type { Dispatch, SetStateAction } from "react";
import type { Goal, Review, StudySession, Subject, Topic } from "@/types";
import { useTimerStore } from "@/store/timer";
import { formatTimer } from "@/lib/utils";

type SetState<T> = Dispatch<SetStateAction<T>>;

type TimerControllerDeps = {
  reviews: Review[];
  topicById: Record<string, Topic>;
  subjectById: Record<string, Subject>;
  todayIso: string;
  setGoals: SetState<Goal[]>;
  setStudySessions: SetState<StudySession[]>;
  setTopics: SetState<Topic[]>;
  setNotice: (msg: string) => void;
  preventReadOnlyAction: () => boolean;
  completeReview: (reviewId: string) => void;
};

export function useTimerController({
  reviews,
  topicById,
  subjectById,
  todayIso,
  setGoals,
  setStudySessions,
  setTopics,
  setNotice,
  preventReadOnlyAction,
  completeReview,
}: TimerControllerDeps) {
  function openFocusTimer() {
    useTimerStore.getState().open();
    setNotice("Modo foco iniciado.");
  }

  function openFocusTimerWithSubject(subjectId: string) {
    useTimerStore.getState().open(subjectId, undefined);
    setNotice("Modo foco iniciado.");
  }

  function openFocusTimerWithTopic(topicId: string, subjectId: string) {
    useTimerStore.getState().open(subjectId, topicId);
    setNotice("Modo foco iniciado.");
  }

  function toggleTimer() {
    const ts = useTimerStore.getState();
    const next = !ts.running;
    ts.setRunning(next);
    setNotice(next ? "Cronômetro iniciado." : `Cronômetro pausado em ${formatTimer(ts.seconds)}.`);
  }

  function resetTimer() {
    useTimerStore.getState().reset();
    setNotice("Cronômetro reiniciado.");
  }

  function closeFocusTimer() {
    const { seconds } = useTimerStore.getState();
    setNotice(`Sessão em ${formatTimer(seconds)}.`);
    useTimerStore.getState().closeView();
  }

  function finishSession({ topicId, reviewId }: { topicId?: string; reviewId?: string }) {
    if (preventReadOnlyAction()) return;
    const { seconds } = useTimerStore.getState();
    useTimerStore.getState().finish();

    const sessionHours = Math.round((seconds / 3600) * 100) / 100;
    const timeStr = formatTimer(seconds);
    const topic = topicId ? topicById[topicId] : undefined;
    const review = reviewId ? reviews.find((r) => r.id === reviewId) : undefined;
    const reviewTopic = review ? topicById[review.topicoId] : undefined;
    const sessionTopic = topic ?? reviewTopic;
    const sessionSubject = sessionTopic ? subjectById[sessionTopic.materiaId] : undefined;

    if (seconds > 0) {
      setGoals((gs) =>
        gs.map((g) =>
          g.tipo === "horas"
            ? { ...g, valorAtual: Math.round((g.valorAtual + sessionHours) * 100) / 100 }
            : g,
        ),
      );
      setStudySessions((sessions) => [
        {
          id: crypto.randomUUID(),
          tipo: topicId ? "topico" : reviewId ? "revisao" : "livre",
          data: todayIso,
          endedAt: new Date().toISOString(),
          durationSeconds: seconds,
          materiaId: sessionSubject?.id,
          materiaNome: sessionSubject?.nome,
          topicoId: sessionTopic?.id,
          topicoTitulo: sessionTopic?.titulo,
          reviewId,
        },
        ...sessions,
      ]);
    }

    if (reviewId) {
      completeReview(reviewId);
    }

    if (topicId) {
      setTopics((ts) =>
        ts.map((t) =>
          t.id === topicId ? { ...t, estudadoEm: t.estudadoEm ?? todayIso } : t,
        ),
      );
      const label = topic?.titulo ?? "tópico";
      setNotice(`${timeStr} registrado — ${label}.`);
    } else if (reviewId) {
      setNotice(`${timeStr} registrado · revisão "${reviewTopic?.titulo ?? ""}" concluída.`);
    } else {
      setNotice(`Sessão de ${timeStr} registrada.`);
    }
  }

  return {
    openFocusTimer,
    openFocusTimerWithSubject,
    openFocusTimerWithTopic,
    toggleTimer,
    resetTimer,
    closeFocusTimer,
    finishSession,
  };
}

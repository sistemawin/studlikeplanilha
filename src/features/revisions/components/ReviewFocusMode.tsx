"use client";

import { CalendarClock, CheckCircle2, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Review, Subject, Topic } from "@/types";

const RESCHEDULE_OPTIONS = [1, 3, 7, 14];

const REVIEW_TYPE_LABEL: Record<string, string> = {
  "1": "1 dia",
  "7": "7 dias",
  "21": "21 dias",
  "30": "30 dias",
  manual: "manual",
  dificuldade: "dificuldade",
};

type Props = {
  reviews: Review[];
  topics: Record<string, Topic>;
  subjects: Record<string, Subject>;
  todayIso: string;
  onComplete: (reviewId: string) => void;
  onReschedule: (reviewId: string, days: number) => void;
  onClose: () => void;
};

export function ReviewFocusMode({ reviews, topics, subjects, todayIso, onComplete, onReschedule, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const [rescheduling, setRescheduling] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = prev; };
  }, []);

  const isFinished = index >= reviews.length;
  const current = reviews[index];
  const topic = current ? topics[current.topicoId] : undefined;
  const subject = topic ? subjects[topic.materiaId] : undefined;
  const overdueDays = current
    ? Math.floor((new Date(todayIso).getTime() - new Date(current.dataAgendada).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const progress = reviews.length > 0 ? (index / reviews.length) * 100 : 100;

  function handleComplete() {
    if (!current) return;
    onComplete(current.id);
    setCompletedCount((c) => c + 1);
    setRescheduling(false);
    setIndex((i) => i + 1);
  }

  function handleReschedule(days: number) {
    if (!current) return;
    onReschedule(current.id, days);
    setRescheduling(false);
    setIndex((i) => i + 1);
  }

  return (
    <section
      aria-label="Modo revisão ativa"
      className="fixed inset-0 z-[2147483647] flex h-dvh w-full flex-col bg-[radial-gradient(circle_at_top,#064e3b_0,#0f172a_44%,#020617_100%)] text-white"
    >
      {/* Progress bar */}
      <div className="h-1 w-full bg-white/10">
        <div
          className="h-1 bg-emerald-400 transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
            <CalendarClock className="h-5 w-5 text-emerald-300" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-300">Revisão ativa</p>
            <p className="text-sm font-semibold text-white/70">
              {isFinished ? "Concluído" : `${index + 1} de ${reviews.length}`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar revisão ativa"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 hover:bg-white/20"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
        {isFinished ? (
          <div className="flex flex-col items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 ring-2 ring-emerald-400">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">Tudo revisado!</p>
              <p className="mt-2 text-sm font-medium text-white/60">
                {completedCount} revisão{completedCount !== 1 ? "ões" : ""} concluída{completedCount !== 1 ? "s" : ""}
                {index - completedCount > 0 && ` · ${index - completedCount} adiada${index - completedCount !== 1 ? "s" : ""}`}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 flex h-12 items-center gap-2 rounded-xl bg-emerald-500 px-6 text-sm font-bold text-white shadow-xl hover:bg-emerald-400"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Fechar
            </button>
          </div>
        ) : (
          <>
            {/* Subject chip */}
            {subject && (
              <span className="mb-6 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white/70 ring-1 ring-white/15">
                {subject.nome}
              </span>
            )}

            {/* Topic */}
            <div className="w-full max-w-lg rounded-[2rem] border border-white/15 bg-white/10 px-8 py-10 shadow-2xl backdrop-blur">
              <p className="text-2xl font-black leading-snug text-white sm:text-3xl">
                {topic?.titulo ?? "Tópico removido"}
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <span className="rounded-xl bg-white/10 px-3 py-1 text-xs font-semibold text-white/60">
                  Revisão de {REVIEW_TYPE_LABEL[current.tipo] ?? current.tipo}
                </span>
                <span
                  className={`rounded-xl px-3 py-1 text-xs font-semibold ${
                    overdueDays > 0
                      ? "bg-red-500/20 text-red-300"
                      : "bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  {overdueDays > 0
                    ? `${overdueDays} dia${overdueDays !== 1 ? "s" : ""} de atraso`
                    : "Hoje"}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-10 w-full max-w-lg">
              {rescheduling ? (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/50">Adiar por quantos dias?</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {RESCHEDULE_OPTIONS.map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => handleReschedule(days)}
                        className="rounded-xl border border-amber-400/40 bg-amber-500/20 px-4 py-2.5 text-sm font-bold text-amber-200 hover:bg-amber-500/30"
                      >
                        +{days} dia{days !== 1 ? "s" : ""}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setRescheduling(false)}
                      className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white/60 hover:bg-white/20"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRescheduling(true)}
                    className="flex h-14 items-center justify-center gap-2 rounded-xl bg-white/10 text-sm font-bold text-white ring-1 ring-white/15 hover:bg-white/20"
                  >
                    <CalendarClock className="h-4 w-4" aria-hidden="true" />
                    Adiar
                  </button>
                  <button
                    type="button"
                    onClick={handleComplete}
                    className="flex h-14 items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-bold text-white shadow-xl hover:bg-emerald-400"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Concluir
                    <ChevronRight className="h-4 w-4 opacity-60" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

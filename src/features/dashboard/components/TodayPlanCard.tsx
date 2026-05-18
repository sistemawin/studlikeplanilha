"use client";

import { Timer } from "lucide-react";
import { motion } from "framer-motion";
import type { Subject, Topic } from "@/types";
import { corToAccent } from "@/lib/utils";

type Props = {
  todayPlan: Subject[];
  topics: Topic[];
  onOpenFocusTimer: () => void;
  onStudySubject: (subjectId: string) => void;
  onStudyTopic: (topicId: string, subjectId: string) => void;
};

export function TodayPlanCard({ todayPlan, topics, onOpenFocusTimer, onStudySubject, onStudyTopic }: Props) {
  const suggested = todayPlan.flatMap((subject) => {
    const accent = corToAccent(subject.cor);
    return topics
      .filter((t) => t.materiaId === subject.id && t.status === "Não Estudado")
      .slice(0, 2)
      .map((t) => ({ ...t, subjectNome: subject.nome, accent }));
  }).slice(0, 4);

  return (
    <div className="rounded-2xl border border-white bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.07)] ring-1 ring-slate-900/5 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1877F2]">Plano de hoje</p>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {todayPlan.length === 1
              ? "Matéria programada para hoje no seu cronograma."
              : `${todayPlan.length} matérias programadas para hoje no seu cronograma.`}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onOpenFocusTimer}
          className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[#1877F2] px-4 text-sm font-bold text-white shadow-md shadow-blue-600/20 hover:bg-[#1B74E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          <Timer className="h-4 w-4" aria-hidden="true" />
          Iniciar foco
        </motion.button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {todayPlan.map((subject) => {
          const accent = corToAccent(subject.cor);
          return (
            <button
              key={subject.id}
              type="button"
              onClick={() => onStudySubject(subject.id)}
              aria-label={`Estudar ${subject.nome}`}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition hover:opacity-80"
              style={{ backgroundColor: `${accent.chart}18`, color: accent.chart, border: `1px solid ${accent.chart}30` }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent.chart }} aria-hidden="true" />
              {subject.nome}
            </button>
          );
        })}
      </div>

      {suggested.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Próximos tópicos
          </p>
          <div className="space-y-1.5">
            {suggested.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => onStudyTopic(topic.id, topic.materiaId)}
                aria-label={`Estudar ${topic.titulo}`}
                className="flex min-w-0 w-full items-center gap-2 rounded-lg px-1 py-0.5 text-left transition hover:bg-slate-50"
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: topic.accent.chart }}
                  aria-hidden="true"
                />
                <p className="min-w-0 truncate text-sm font-medium text-slate-700">{topic.titulo}</p>
                <span className="shrink-0 text-xs font-medium text-slate-400">
                  {topic.subjectNome.replace("Direito ", "")}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

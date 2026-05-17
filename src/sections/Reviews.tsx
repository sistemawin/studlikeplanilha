import { CalendarClock, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { NavTarget, Review, Subject, Topic } from "@/types";

const DAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function upcomingDateLabel(dateStr: string, todayIso: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const t = new Date(todayIso + "T12:00:00");
  const diffDays = Math.round((d.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return `Amanhã · ${dateStr.slice(8)}/${dateStr.slice(5, 7)}`;
  if (diffDays === 2) return `Depois de amanhã · ${dateStr.slice(8)}/${dateStr.slice(5, 7)}`;
  return `${DAY_SHORT[d.getDay()]} · ${dateStr.slice(8)}/${dateStr.slice(5, 7)}`;
}

type Props = {
  reviews: Review[];
  topics: Record<string, Topic>;
  subjects: Record<string, Subject>;
  todayIso: string;
  activeSection: NavTarget;
  onComplete: (reviewId: string) => void;
  onReschedule: (reviewId: string, days: number) => void;
  onCompleteAll: () => void;
};

const RESCHEDULE_OPTIONS = [1, 3, 7, 14];

function daysOverdue(reviewDate: string, todayIso: string): number {
  const diff = new Date(todayIso).getTime() - new Date(reviewDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

const REVIEW_TYPE_LABEL: Record<string, string> = {
  "1": "1 dia",
  "7": "7 dias",
  "21": "21 dias",
  "30": "30 dias",
  manual: "manual",
  dificuldade: "dificuldade",
};

export function Reviews({ reviews, topics, subjects, todayIso, activeSection, onComplete, onReschedule, onCompleteAll }: Props) {
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  const pendingToday = reviews.filter((r) => !r.concluida && r.dataAgendada <= todayIso);
  const totalPending = reviews.filter((r) => !r.concluida).length;
  const totalCompleted = reviews.filter((r) => r.concluida).length;

  const todaySubjectIds = [...new Set(
    pendingToday.map((r) => topics[r.topicoId]?.materiaId).filter(Boolean) as string[],
  )];
  const todaySubjects = todaySubjectIds.map((id) => subjects[id]).filter(Boolean);
  const filteredToday = subjectFilter === "all"
    ? pendingToday
    : pendingToday.filter((r) => topics[r.topicoId]?.materiaId === subjectFilter);

  const upcomingReviews = reviews
    .filter((r) => !r.concluida && r.dataAgendada > todayIso)
    .sort((a, b) => a.dataAgendada.localeCompare(b.dataAgendada));

  const upcomingByDate: Record<string, Review[]> = {};
  for (const review of upcomingReviews) {
    if (!upcomingByDate[review.dataAgendada]) upcomingByDate[review.dataAgendada] = [];
    upcomingByDate[review.dataAgendada].push(review);
  }
  const upcomingDates = Object.keys(upcomingByDate).sort();
  const isVisible = activeSection === "revisoes";

  return (
    <div
      id="revisoes"
      className={`${
        isVisible ? "block" : "hidden"
      } scroll-mt-24 rounded-2xl border border-white bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/5 sm:p-5 xl:block`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-950">Para revisar hoje</h2>
        {pendingToday.length > 1 && (
          <button
            type="button"
            onClick={onCompleteAll}
            className="flex h-9 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Concluir todas ({pendingToday.length})
          </button>
        )}
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-amber-50 p-3 ring-1 ring-amber-100">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-amber-500">Hoje</p>
          <p className="mt-1 text-2xl font-black text-amber-700">{pendingToday.length}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Pendentes</p>
          <p className="mt-1 text-2xl font-black text-slate-700">{totalPending}</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-100">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-500">Concluídas</p>
          <p className="mt-1 text-2xl font-black text-emerald-700">{totalCompleted}</p>
        </div>
      </div>

      {todaySubjects.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSubjectFilter("all")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              subjectFilter === "all"
                ? "bg-[#1877F2] text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Todas ({pendingToday.length})
          </button>
          {todaySubjects.map((subject) => {
            const count = pendingToday.filter((r) => topics[r.topicoId]?.materiaId === subject.id).length;
            return (
              <button
                key={subject.id}
                type="button"
                onClick={() => setSubjectFilter(subject.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  subjectFilter === subject.id
                    ? "bg-[#1877F2] text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {subject.nome.replace("Direito ", "")} ({count})
              </button>
            );
          })}
        </div>
      )}

      <div className="space-y-3">
        {pendingToday.length === 0 ? (
          <div className="rounded-xl bg-emerald-50 px-4 py-5 text-center ring-1 ring-emerald-100">
            <p className="text-sm font-semibold text-emerald-700">Nenhuma revisão pendente para hoje.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredToday.map((review, index) => {
              const topic = topics[review.topicoId];
              if (!topic) return null;
              const overdueDays = daysOverdue(review.dataAgendada, todayIso);
              const late = overdueDays > 0;

              return (
                <motion.article
                  key={review.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.22, delay: index * 0.05 }}
                  className="relative overflow-hidden rounded-2xl border p-4 shadow-sm sm:p-5"
                  style={{
                    background: late
                      ? "linear-gradient(135deg, #fff7f7 0%, #ffffff 100%)"
                      : "linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)",
                    borderColor: late ? "#fecaca" : "#fde68a",
                  }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-bold leading-snug text-slate-950">{topic.titulo}</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-500">
                        {subjects[topic.materiaId]?.nome}
                        <span className="mx-1.5 text-slate-300">·</span>
                        revisão de {REVIEW_TYPE_LABEL[review.tipo] ?? review.tipo}
                      </p>
                    </div>
                    <span
                      className={`w-fit shrink-0 rounded-xl px-2.5 py-1.5 text-xs font-bold ${
                        late
                          ? "bg-red-50 text-red-700 ring-1 ring-red-100"
                          : "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
                      }`}
                    >
                      {late
                        ? `${overdueDays} dia${overdueDays !== 1 ? "s" : ""} atraso`
                        : "Hoje"}
                    </span>
                  </div>

                  <div className="mt-4">
                    {reschedulingId === review.id ? (
                      <div className="flex flex-wrap gap-2">
                        {RESCHEDULE_OPTIONS.map((days) => (
                          <button
                            key={days}
                            type="button"
                            onClick={() => {
                              onReschedule(review.id, days);
                              setReschedulingId(null);
                            }}
                            className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
                          >
                            +{days} dia{days !== 1 ? "s" : ""}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setReschedulingId(null)}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-400"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-[1fr_auto] gap-2">
                        <motion.button
                          onClick={() => onComplete(review.id)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.97 }}
                          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1877F2] text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-[#1B74E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                        >
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          Concluir revisão
                        </motion.button>
                        <button
                          type="button"
                          onClick={() => setReschedulingId(review.id)}
                          aria-label="Adiar revisão"
                          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                        >
                          <CalendarClock className="h-4 w-4" aria-hidden="true" />
                          Adiar
                        </button>
                      </div>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Upcoming reviews */}
      {upcomingDates.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowUpcoming((v) => !v)}
            className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            <span className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-[#1877F2]" aria-hidden="true" />
              Próximas revisões
              <span className="rounded-lg bg-[#1877F2]/10 px-2 py-0.5 text-xs font-bold text-[#1877F2]">
                {upcomingReviews.length}
              </span>
            </span>
            {showUpcoming
              ? <ChevronUp className="h-4 w-4 text-slate-400" aria-hidden="true" />
              : <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
            }
          </button>

          {showUpcoming && (
            <div className="mt-3 space-y-4">
              {upcomingDates.map((date) => (
                <div key={date}>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    {upcomingDateLabel(date, todayIso)}
                    <span className="ml-2 font-semibold normal-case tracking-normal text-slate-300">
                      · {upcomingByDate[date].length} revisão{upcomingByDate[date].length !== 1 ? "ões" : ""}
                    </span>
                  </p>
                  <div className="space-y-2">
                    {upcomingByDate[date].map((review) => {
                      const topic = topics[review.topicoId];
                      if (!topic) return null;
                      return (
                        <div
                          key={review.id}
                          className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-950">{topic.titulo}</p>
                            <p className="mt-0.5 text-xs font-medium text-slate-500">
                              {subjects[topic.materiaId]?.nome}
                              <span className="mx-1.5 text-slate-300">·</span>
                              {REVIEW_TYPE_LABEL[review.tipo] ?? review.tipo}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { BarChart3, ChevronRight, Flame, RotateCcw, Target, Timer, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import type { Goal, NavTarget, StudySession, Subject, Topic } from "@/types";
import { addDays, computeStreak, corToAccent, formatTimer, isoDate, pct } from "@/lib/utils";
import { SessionHistoryModal } from "@/components/SessionHistoryModal";

type Props = {
  topics: Topic[];
  subjects: Subject[];
  reviews: { pendingCount: number; overdueCount: number };
  questionGoal: Goal;
  avgExam: number;
  generalProgress: number;
  timerRunning: boolean;
  timerLabel: string;
  studySessions: StudySession[];
  notice: string;
  activeSection: NavTarget;
  onOpenFocusTimer: () => void;
  onNavigate: (target: NavTarget) => void;
  onDeleteSession: (id: string) => void;
};

export function Dashboard({
  topics,
  subjects,
  reviews,
  questionGoal,
  avgExam,
  generalProgress,
  timerRunning,
  timerLabel,
  studySessions,
  notice,
  activeSection,
  onOpenFocusTimer,
  onNavigate,
  onDeleteSession,
}: Props) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const completedTopics = topics.filter((t) => t.status === "Revisado").length;

  const subjectPerformance = subjects.map((subject) => {
    const subjectTopics = topics.filter((t) => t.materiaId === subject.id);
    const score =
      subjectTopics.length === 0
        ? 0
        : Math.round(
            subjectTopics.reduce(
              (sum, t) =>
                sum +
                (t.status === "Revisado"
                  ? 100
                  : t.status === "Questões Feitas"
                  ? 76
                  : t.status === "Teoria Lida"
                  ? 42
                  : 8),
              0,
            ) / subjectTopics.length,
          );
    return { subject, score, accent: corToAccent(subject.cor) };
  });

  const bestSubjects = [...subjectPerformance].sort((a, b) => b.score - a.score);
  const isVisible = activeSection === "dashboard";

  const questionsProgress = pct(questionGoal.valorAtual, questionGoal.valorObjetivo);
  const safeAvg = Number.isFinite(avgExam) ? avgExam : 0;
  const todayIso = isoDate(new Date());
  const weekStartIso = addDays(new Date(), -6);
  const todaySessions = studySessions.filter((session) => session.data === todayIso);
  const weekSessions = studySessions.filter((session) => session.data >= weekStartIso);
  const todaySeconds = todaySessions.reduce((sum, session) => sum + session.durationSeconds, 0);
  const weekSeconds = weekSessions.reduce((sum, session) => sum + session.durationSeconds, 0);
  const streak = computeStreak(studySessions, todayIso);
  const recentSessions = studySessions.slice(0, 5);

  const kpiCards = [
    {
      label: "Progresso geral",
      value: `${generalProgress}%`,
      icon: Target,
      accent: "#3b82f6",
      progress: generalProgress,
      subtitle:
        completedTopics > 0
          ? `${completedTopics} revisados de ${topics.length} tópicos`
          : `${topics.length} tópico${topics.length !== 1 ? "s" : ""} no edital`,
      onClick: () => onNavigate("edital"),
      ariaLabel: "Abrir edital verticalizado",
    },
    {
      label: "Para revisar hoje",
      value: String(reviews.pendingCount),
      icon: RotateCcw,
      accent: "#f59e0b",
      progress: reviews.pendingCount > 0 ? Math.min((reviews.overdueCount / Math.max(reviews.pendingCount, 1)) * 100, 100) : 0,
      subtitle:
        reviews.pendingCount === 0
          ? "Nenhuma revisão pendente"
          : reviews.overdueCount > 0
          ? `${reviews.overdueCount} atrasada${reviews.overdueCount !== 1 ? "s" : ""} — prioridade máxima`
          : "Todas agendadas para hoje",
      onClick: () => onNavigate("revisoes"),
      ariaLabel: "Abrir revisões de hoje",
    },
    {
      label: "Questões hoje",
      value: `${questionGoal.valorAtual}/${questionGoal.valorObjetivo}`,
      icon: Flame,
      accent: "#f43f5e",
      progress: questionsProgress,
      subtitle:
        questionsProgress >= 100
          ? "Meta do dia atingida!"
          : `${Math.max(questionGoal.valorObjetivo - questionGoal.valorAtual, 0)} restantes para a meta`,
      onClick: () => onNavigate("simulados"),
      ariaLabel: "Abrir registro de questões",
    },
    {
      label: "Média simulados",
      value: `${safeAvg}%`,
      icon: BarChart3,
      accent: "#10b981",
      progress: safeAvg,
      subtitle: safeAvg === 0 ? "Nenhum simulado registrado" : "acertos sobre total de questões",
      onClick: () => onNavigate("simulados"),
      ariaLabel: "Abrir desempenho em simulados",
    },
  ] as const;

  return (
    <>
      {/* KPI cards */}
      <section
        id="dashboard"
        className={`${isVisible ? "grid" : "hidden"} scroll-mt-24 grid-cols-2 gap-3 md:gap-4 xl:grid xl:grid-cols-2 2xl:grid-cols-4`}
      >
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.label}
              type="button"
              onClick={card.onClick}
              aria-label={card.ariaLabel}
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.96 }}
              className="relative overflow-hidden rounded-2xl border border-white bg-white p-4 text-left shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1877F2] sm:p-5"
              style={{
                background: `linear-gradient(135deg, #ffffff 0%, #ffffff 62%, ${card.accent}12 100%)`,
              }}
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-1"
                style={{ backgroundColor: card.accent }}
              />
              {/* Label + icon */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  {card.label}
                </span>
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${card.accent}14` }}
                >
                  <Icon className="h-4 w-4" style={{ color: card.accent }} aria-hidden="true" />
                </div>
              </div>

              {/* Value */}
              <p className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">{card.value}</p>

              {/* Progress bar */}
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-1.5 rounded-full transition-[width] duration-700 ease-out"
                  style={{ width: `${card.progress}%`, backgroundColor: card.accent }}
                />
              </div>

              {/* Subtitle */}
              <p className="mt-2 text-xs font-medium leading-5 text-slate-500">{card.subtitle}</p>
            </motion.button>
          );
        })}
      </section>

      {/* Mobile subject quick-access strip */}
      <section className={`${isVisible ? "block" : "hidden"} xl:hidden`}>
        <div className="w-full max-w-full overflow-hidden">
          <div className="flex max-w-full gap-3 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={onOpenFocusTimer}
              aria-label="Abrir modo foco"
              className="flex w-[150px] shrink-0 items-center gap-3 rounded-2xl bg-[#1877F2] p-3 text-left shadow-lg shadow-blue-600/20"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                <Timer className="h-5 w-5 text-white" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-xs font-semibold text-white/50">Foco</span>
                <span className="block text-sm font-bold text-white">
                  {timerRunning ? timerLabel : "Iniciar"}
                </span>
              </span>
            </button>

            {bestSubjects.slice(0, 3).map((item) => (
              <button
                key={item.subject.id}
                onClick={() => onNavigate("edital")}
                className="w-[126px] shrink-0 overflow-hidden rounded-2xl border border-white p-3 text-left shadow-lg shadow-slate-900/10"
                style={{
                  background: `linear-gradient(135deg, #ffffff 0%, ${item.accent.chart}18 100%)`,
                }}
              >
                <span
                  className="mb-3 block h-1.5 w-8 rounded-full"
                  style={{ backgroundColor: item.accent.chart }}
                />
                <span className="block truncate text-sm font-bold text-slate-950">
                  {item.subject.nome.replace("Direito ", "")}
                </span>
                <span className="mt-1 block text-xs font-medium text-slate-500">
                  {item.score}% pronto
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Notice bar */}
      <p
        role="status"
        aria-live="polite"
        className={`${isVisible ? "block" : "hidden"} rounded-2xl border border-blue-100 bg-white px-5 py-3.5 text-sm font-semibold text-slate-600 shadow-sm shadow-slate-900/5 xl:block`}
      >
        {notice}
      </p>

      {historyOpen && (
        <SessionHistoryModal
          sessions={studySessions}
          onDelete={onDeleteSession}
          onClose={() => setHistoryOpen(false)}
        />
      )}

      <section className={`${isVisible ? "block" : "hidden"} rounded-2xl border border-white bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.07)] ring-1 ring-slate-900/5 sm:p-5 xl:block`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Histórico
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-950">Sessões de estudo</h2>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:w-auto">
            <div className="rounded-xl bg-[#0F172A] px-4 py-3 text-white shadow-sm shadow-slate-900/15">
              <p className="text-xs font-semibold text-white/45">Hoje</p>
              <p className="mt-1 font-mono text-lg font-bold">{formatTimer(todaySeconds)}</p>
            </div>
            <div className="rounded-xl bg-blue-50 px-4 py-3 text-blue-900 ring-1 ring-blue-100">
              <p className="text-xs font-semibold text-blue-600/70">7 dias</p>
              <p className="mt-1 font-mono text-lg font-bold">{formatTimer(weekSeconds)}</p>
            </div>
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-amber-900 ring-1 ring-amber-100">
              <p className="flex items-center gap-1 text-xs font-semibold text-amber-600/70">
                <Zap className="h-3 w-3" aria-hidden="true" />
                Sequência
              </p>
              <p className="mt-1 font-mono text-lg font-bold">
                {streak}
                <span className="ml-1 text-xs font-semibold text-amber-700/60">
                  {streak === 1 ? "dia" : "dias"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {recentSessions.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm font-medium text-slate-500">
            Nenhuma sessão registrada ainda. Use o modo foco e toque em Registrar.
          </p>
        ) : (
          <>
            <div className="mt-4 space-y-2">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-[#F7F8FA] p-3 ring-1 ring-slate-100"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {session.topicoTitulo ?? (session.tipo === "revisao" ? "Revisão registrada" : "Sessão livre")}
                    </p>
                    <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                      {session.materiaNome ?? "Sem matéria"} · {session.data} · {session.tipo === "revisao" ? "revisão" : session.tipo === "topico" ? "tópico" : "livre"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-white px-2.5 py-1 font-mono text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                    {formatTimer(session.durationSeconds)}
                  </span>
                </div>
              ))}
            </div>
            {studySessions.length > 5 && (
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Ver histórico completo ({studySessions.length} sessões)
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </>
        )}
      </section>
    </>
  );
}

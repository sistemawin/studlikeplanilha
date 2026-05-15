import { BarChart3, Flame, RotateCcw, Target, Timer } from "lucide-react";
import { motion } from "framer-motion";
import type { Goal, NavTarget, Subject, Topic } from "@/types";
import { corToAccent, pct } from "@/lib/utils";

type Props = {
  topics: Topic[];
  subjects: Subject[];
  reviews: { pendingCount: number; overdueCount: number };
  questionGoal: Goal;
  avgExam: number;
  generalProgress: number;
  timerRunning: boolean;
  timerLabel: string;
  notice: string;
  activeSection: NavTarget;
  onOpenFocusTimer: () => void;
  onNavigate: (target: NavTarget) => void;
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
  notice,
  activeSection,
  onOpenFocusTimer,
  onNavigate,
}: Props) {
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
              className="relative overflow-hidden rounded-2xl p-4 text-left shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/50 sm:p-5"
              style={{
                background: `linear-gradient(135deg, #0f172a 0%, #172032 55%, ${card.accent}22 100%)`,
              }}
            >
              {/* Label + icon */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">
                  {card.label}
                </span>
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${card.accent}22` }}
                >
                  <Icon className="h-4 w-4" style={{ color: card.accent }} aria-hidden="true" />
                </div>
              </div>

              {/* Value */}
              <p className="mt-3 text-3xl font-black text-white sm:text-4xl">{card.value}</p>

              {/* Progress bar */}
              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-1 rounded-full transition-[width] duration-700 ease-out"
                  style={{ width: `${card.progress}%`, backgroundColor: card.accent }}
                />
              </div>

              {/* Subtitle */}
              <p className="mt-2 text-xs leading-5 text-white/40">{card.subtitle}</p>
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
              className="flex w-[150px] shrink-0 items-center gap-3 rounded-2xl bg-[#050505] p-3 text-left shadow-lg shadow-slate-900/20"
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
                className="w-[126px] shrink-0 overflow-hidden rounded-2xl p-3 text-left shadow-lg"
                style={{
                  background: `linear-gradient(135deg, #0f172a 0%, ${item.accent.chart}25 100%)`,
                }}
              >
                <span
                  className="mb-3 block h-1.5 w-8 rounded-full"
                  style={{ backgroundColor: item.accent.chart }}
                />
                <span className="block truncate text-sm font-bold text-white">
                  {item.subject.nome.replace("Direito ", "")}
                </span>
                <span className="mt-1 block text-xs font-medium text-white/40">
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
        className={`${isVisible ? "block" : "hidden"} rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-medium text-white/55 shadow-sm xl:block`}
      >
        {notice}
      </p>
    </>
  );
}

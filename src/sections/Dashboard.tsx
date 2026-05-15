import { BarChart3, Flame, RotateCcw, Target, Timer } from "lucide-react";
import type { Goal, NavTarget, Subject, Topic } from "@/types";
import { ProgressBar } from "@/components/ProgressBar";
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
              (sum, t) => sum + (t.status === "Revisado" ? 100 : t.status === "Questões Feitas" ? 76 : t.status === "Teoria Lida" ? 42 : 8),
              0,
            ) / subjectTopics.length,
          );
    return { subject, score, accent: corToAccent(subject.cor) };
  });

  const bestSubjects = [...subjectPerformance].sort((a, b) => b.score - a.score);

  const isVisible = activeSection === "dashboard";

  return (
    <>
      <section
        id="dashboard"
        className={`${isVisible ? "grid" : "hidden"} scroll-mt-24 grid-cols-2 gap-3 md:gap-4 xl:grid xl:grid-cols-2 2xl:grid-cols-4`}
      >
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Progresso geral</p>
            <Target className="h-5 w-5 text-blue-500" aria-hidden="true" />
          </div>
          <p className="mt-3 text-2xl font-semibold sm:text-3xl">{generalProgress}%</p>
          <ProgressBar value={generalProgress} tone="bg-blue-500" label="Progresso geral" />
          <p className="mt-2 text-xs text-slate-500">
            {completedTopics} revisados de {topics.length} tópicos
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm shadow-amber-900/5 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-amber-800">Para revisar hoje</p>
            <RotateCcw className="h-5 w-5 text-amber-500" aria-hidden="true" />
          </div>
          <p className="mt-3 text-2xl font-semibold sm:text-3xl">{reviews.pendingCount}</p>
          <p className="mt-2 text-xs text-amber-800/70">
            {reviews.overdueCount} atrasadas exigem prioridade máxima
          </p>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm shadow-rose-900/5 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-rose-800">Questões hoje</p>
            <Flame className="h-5 w-5 text-red-500" aria-hidden="true" />
          </div>
          <p className="mt-3 text-2xl font-semibold sm:text-3xl">
            {questionGoal.valorAtual}/{questionGoal.valorObjetivo}
          </p>
          <ProgressBar
            value={pct(questionGoal.valorAtual, questionGoal.valorObjetivo)}
            tone="bg-rose-500"
            label="Questões hoje"
          />
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm shadow-emerald-900/5 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-emerald-800">Média simulados</p>
            <BarChart3 className="h-5 w-5 text-sky-500" aria-hidden="true" />
          </div>
          <p className="mt-3 text-2xl font-semibold sm:text-3xl">{Number.isFinite(avgExam) ? avgExam : 0}%</p>
          <p className="mt-2 text-xs text-emerald-800/70">Fórmula: acertos / total obrigatório</p>
        </div>
      </section>

      {/* Mobile subject quick-access strip */}
      <section className={`${isVisible ? "block" : "hidden"} xl:hidden`}>
        <div className="w-full max-w-full overflow-hidden">
          <div className="flex max-w-full gap-3 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={onOpenFocusTimer}
              aria-label="Abrir modo foco"
              className="flex w-[150px] shrink-0 items-center gap-3 rounded-2xl bg-[#050505] p-3 text-left text-white shadow-lg shadow-slate-900/15"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/12">
                <Timer className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-xs font-semibold text-white/60">Foco</span>
                <span className="block text-sm font-semibold">{timerRunning ? timerLabel : "Iniciar"}</span>
              </span>
            </button>
            {bestSubjects.slice(0, 3).map((item) => (
              <button
                key={item.subject.id}
                onClick={() => onNavigate("edital")}
                className="w-[126px] shrink-0 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm shadow-slate-900/5"
              >
                <span className={`mb-3 block h-2 w-10 rounded-full ${item.accent.progress}`} />
                <span className="block truncate text-sm font-semibold text-slate-950">
                  {item.subject.nome.replace("Direito ", "")}
                </span>
                <span className="mt-1 block text-xs font-medium text-slate-500">{item.score}% pronto</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <p
        role="status"
        aria-live="polite"
        className={`${isVisible ? "block" : "hidden"} rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm font-medium text-blue-700 shadow-sm shadow-slate-900/5 xl:block`}
      >
        {notice}
      </p>
    </>
  );
}

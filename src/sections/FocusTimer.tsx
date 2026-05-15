import { CheckCircle2, Pause, Play, RotateCcw, Timer, X } from "lucide-react";
import type { Goal, Review } from "@/types";
import { formatTimer } from "@/lib/utils";

type Props = {
  timerRunning: boolean;
  timerSeconds: number;
  hourGoal: Goal;
  questionGoal: Goal;
  pendingTodayCount: number;
  onToggle: () => void;
  onReset: () => void;
  onClose: () => void;
};

export function FocusTimer({
  timerRunning,
  timerSeconds,
  hourGoal,
  questionGoal,
  pendingTodayCount,
  onToggle,
  onReset,
  onClose,
}: Props) {
  return (
    <section
      aria-label="Modo foco"
      className="fixed inset-0 z-50 flex min-h-dvh w-full max-w-full flex-col overflow-x-hidden bg-[radial-gradient(circle_at_top,#1d4ed8_0,#0f172a_44%,#020617_100%)] px-5 py-5 text-white md:px-10 md:py-8"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-blue-100 ring-1 ring-white/15">
            <Timer className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-blue-200">Modo foco</p>
            <h2 className="text-lg font-semibold md:text-2xl">Sessão de estudo</h2>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Fechar modo foco"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15 transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
        <p className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-100 ring-1 ring-white/15">
          {timerRunning ? "Estudando agora" : "Sessão pausada"}
        </p>
        <div className="mt-8 rounded-[2rem] border border-white/15 bg-white/10 px-8 py-8 shadow-2xl shadow-blue-950/40 backdrop-blur md:px-16 md:py-12">
          <time
            className="font-mono text-7xl font-semibold tracking-normal text-white md:text-9xl"
            dateTime={`PT${Math.floor(timerSeconds / 60)}M${timerSeconds % 60}S`}
          >
            {formatTimer(timerSeconds)}
          </time>
          <p className="mt-4 text-sm font-medium text-blue-100 md:text-base">
            Respire, mantenha o foco e avance uma tarefa por vez.
          </p>
        </div>

        <div className="mt-8 grid w-full max-w-xl gap-3 sm:grid-cols-3">
          <button
            onClick={onToggle}
            className="flex h-14 items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-blue-700 shadow-xl shadow-blue-950/20 transition hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            {timerRunning
              ? <><Pause className="h-5 w-5" aria-hidden="true" /> Pausar</>
              : <><Play className="h-5 w-5" aria-hidden="true" /> Continuar</>
            }
          </button>
          <button
            onClick={onReset}
            className="flex h-14 items-center justify-center gap-2 rounded-xl bg-white/10 text-sm font-bold text-white ring-1 ring-white/15 transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <RotateCcw className="h-5 w-5" aria-hidden="true" />
            Reiniciar
          </button>
          <button
            onClick={onClose}
            className="flex h-14 items-center justify-center gap-2 rounded-xl bg-blue-500 text-sm font-bold text-white shadow-xl shadow-blue-950/20 transition hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            Voltar
          </button>
        </div>
      </div>

      <div className="grid gap-3 border-t border-white/10 pt-4 text-sm text-blue-100 md:grid-cols-3">
        <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/10">
          <p className="font-bold text-white">Meta do dia</p>
          <p className="mt-1">{hourGoal.valorAtual}/{hourGoal.valorObjetivo}h registradas</p>
        </div>
        <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/10">
          <p className="font-bold text-white">Questões</p>
          <p className="mt-1">{questionGoal.valorAtual}/{questionGoal.valorObjetivo} hoje</p>
        </div>
        <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/10">
          <p className="font-bold text-white">Revisões</p>
          <p className="mt-1">{pendingTodayCount} pendentes agora</p>
        </div>
      </div>
    </section>
  );
}

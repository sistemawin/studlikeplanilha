import { CheckCircle2, Pause, Play, RotateCcw, Timer, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Goal, Review, Subject, Topic } from "@/types";
import { formatTimer } from "@/lib/utils";

const POMODORO_DURATIONS = [25, 45, 60] as const;
type PomodoroDuration = typeof POMODORO_DURATIONS[number];

type SessionData = {
  topicId?: string;
  reviewId?: string;
};

type Props = {
  timerRunning: boolean;
  timerSeconds: number;
  hourGoal: Goal;
  questionGoal: Goal;
  pendingTodayCount: number;
  subjects: Subject[];
  topics: Topic[];
  pendingReviews: Review[];
  topicById: Record<string, Topic>;
  onToggle: () => void;
  onReset: () => void;
  onClose: () => void;
  onFinishSession: (data: SessionData) => void;
};

export function FocusTimer({
  timerRunning,
  timerSeconds,
  hourGoal,
  questionGoal,
  pendingTodayCount,
  subjects,
  topics,
  pendingReviews,
  topicById,
  onToggle,
  onReset,
  onClose,
  onFinishSession,
}: Props) {
  const [sessionType, setSessionType] = useState<"topico" | "revisao">("topico");
  const [sessionSubjectId, setSessionSubjectId] = useState(subjects[0]?.id ?? "");
  const [sessionTopicId, setSessionTopicId] = useState(
    () => topics.filter((t) => t.materiaId === (subjects[0]?.id ?? ""))[0]?.id ?? "",
  );
  const [sessionReviewId, setSessionReviewId] = useState(pendingReviews[0]?.id ?? "");
  const [pomodoroMode, setPomodoroMode] = useState(false);
  const [pomodoroDuration, setPomodoroDuration] = useState<PomodoroDuration>(25);

  const pomodoroDurationSecs = pomodoroDuration * 60;
  const pomodoroRemaining = Math.max(0, pomodoroDurationSecs - timerSeconds);
  const pomodoroComplete = pomodoroMode && timerSeconds >= pomodoroDurationSecs;
  const pomodoroProgress = pomodoroMode ? Math.min(timerSeconds / pomodoroDurationSecs, 1) : 0;

  function handleSetPomodoroDuration(min: PomodoroDuration) {
    setPomodoroDuration(min);
    if (timerSeconds > 0) onReset();
  }

  useEffect(() => {
    if (pomodoroComplete && timerRunning) onToggle();
  }, [pomodoroComplete, timerRunning]);

  const sessionTopics = topics.filter((t) => t.materiaId === sessionSubjectId);

  function handleSubjectChange(subjectId: string) {
    setSessionSubjectId(subjectId);
    setSessionTopicId(topics.filter((t) => t.materiaId === subjectId)[0]?.id ?? "");
  }

  function handleFinish() {
    onFinishSession({
      topicId: sessionType === "topico" ? sessionTopicId : undefined,
      reviewId: sessionType === "revisao" ? sessionReviewId : undefined,
    });
  }

  return (
    <section
      aria-label="Modo foco"
      className="fixed inset-0 z-[2147483647] h-dvh w-full max-w-full overflow-hidden bg-[radial-gradient(circle_at_top,#1d4ed8_0,#0f172a_44%,#020617_100%)] text-white"
    >
      <div className="flex h-full min-h-0 touch-pan-y flex-col overflow-y-auto overscroll-contain px-5 py-5 [-webkit-overflow-scrolling:touch] md:px-10 md:py-8">
        <div className="flex shrink-0 items-center justify-between gap-3">
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
            aria-label="Fechar sem registrar"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15 transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

      <div className="flex min-h-[420px] shrink-0 flex-col items-center justify-center py-8 text-center sm:min-h-[460px] md:flex-1 md:py-10">
        {/* Mode toggle */}
        <div className="mb-4 flex w-full max-w-xs gap-1 rounded-xl bg-white/5 p-1">
          {([["livre", "Livre"], ["pomodoro", "Pomodoro · 25min"]] as const).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => { setPomodoroMode(mode === "pomodoro"); }}
              aria-pressed={pomodoroMode === (mode === "pomodoro")}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                pomodoroMode === (mode === "pomodoro")
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-blue-200 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {pomodoroMode && (
          <div className="mb-3 flex w-full max-w-xs gap-1 rounded-xl bg-white/5 p-1">
            {POMODORO_DURATIONS.map((min) => (
              <button
                key={min}
                type="button"
                onClick={() => handleSetPomodoroDuration(min)}
                aria-pressed={pomodoroDuration === min}
                className={`flex-1 rounded-lg py-1 text-xs font-semibold transition ${
                  pomodoroDuration === min
                    ? "bg-white/20 text-white shadow-sm"
                    : "text-blue-300 hover:text-white"
                }`}
              >
                {min}min
              </button>
            ))}
          </div>
        )}

        <p className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-100 ring-1 ring-white/15">
          {pomodoroComplete ? "Pomodoro concluído!" : timerRunning ? "Estudando agora" : "Sessão pausada"}
        </p>

        <div className="mt-8 rounded-[2rem] border border-white/15 bg-white/10 px-8 py-8 shadow-2xl shadow-blue-950/40 backdrop-blur md:px-16 md:py-12">
          <time
            className={`font-mono text-7xl font-semibold tracking-normal md:text-9xl ${pomodoroComplete ? "text-emerald-300" : "text-white"}`}
            dateTime={`PT${Math.floor(timerSeconds / 60)}M${timerSeconds % 60}S`}
          >
            {pomodoroMode ? formatTimer(pomodoroRemaining) : formatTimer(timerSeconds)}
          </time>
          {pomodoroMode && (
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className="h-1.5 rounded-full bg-white transition-[width] duration-1000"
                style={{ width: `${pomodoroProgress * 100}%` }}
              />
            </div>
          )}
          <p className="mt-4 text-sm font-medium text-blue-100 md:text-base">
            {pomodoroComplete
              ? "Sessão concluída! Registre e descanse 5 minutos."
              : "Respire, mantenha o foco e avance uma tarefa por vez."}
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
            onClick={handleFinish}
            className="flex h-14 items-center justify-center gap-2 rounded-xl bg-blue-500 text-sm font-bold text-white shadow-xl shadow-blue-950/20 transition hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            Registrar
          </button>
        </div>
      </div>

      {/* Session selector — same visual language as info cards below */}
      <div className="mb-3 shrink-0 rounded-xl bg-white/10 p-4 ring-1 ring-white/10">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
          O que está estudando?
        </p>

        {/* Type toggle */}
        <div className="mb-3 flex gap-1 rounded-xl bg-white/5 p-1">
          {(["topico", "revisao"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSessionType(type)}
              aria-pressed={sessionType === type}
              disabled={type === "revisao" && pendingReviews.length === 0}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition disabled:opacity-40 ${
                sessionType === type
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-blue-200 hover:text-white"
              }`}
            >
              {type === "topico"
                ? "Tópico"
                : `Revisão${pendingReviews.length > 0 ? ` (${pendingReviews.length})` : ""}`}
            </button>
          ))}
        </div>

        {sessionType === "topico" ? (
          subjects.length === 0 ? (
            <p className="text-xs text-blue-300">Crie matérias no Edital para registrar o tópico estudado.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="sr-only">Matéria</label>
                <select
                  value={sessionSubjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="h-9 w-full rounded-xl bg-white/10 px-3 text-sm text-white outline-none ring-1 ring-white/20 focus:ring-2 focus:ring-white/40"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id} className="text-slate-900">
                      {s.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="sr-only">Tópico</label>
                <select
                  value={sessionTopicId}
                  onChange={(e) => setSessionTopicId(e.target.value)}
                  disabled={sessionTopics.length === 0}
                  className="h-9 w-full rounded-xl bg-white/10 px-3 text-sm text-white outline-none ring-1 ring-white/20 focus:ring-2 focus:ring-white/40 disabled:opacity-40"
                >
                  {sessionTopics.length === 0 ? (
                    <option value="" className="text-slate-900">Sem tópicos</option>
                  ) : (
                    sessionTopics.map((t) => (
                      <option key={t.id} value={t.id} className="text-slate-900">
                        {t.titulo}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          )
        ) : (
          <div>
            <label className="sr-only">Revisão</label>
            <select
              value={sessionReviewId}
              onChange={(e) => setSessionReviewId(e.target.value)}
              disabled={pendingReviews.length === 0}
              className="h-9 w-full rounded-xl bg-white/10 px-3 text-sm text-white outline-none ring-1 ring-white/20 focus:ring-2 focus:ring-white/40 disabled:opacity-40"
            >
              {pendingReviews.length === 0 ? (
                <option value="" className="text-slate-900">Nenhuma revisão pendente</option>
              ) : (
                pendingReviews.map((r) => {
                  const topic = topicById[r.topicoId];
                  return (
                    <option key={r.id} value={r.id} className="text-slate-900">
                      {topic?.titulo ?? r.topicoId} · tipo {r.tipo}
                    </option>
                  );
                })
              )}
            </select>
          </div>
        )}
      </div>

      {/* Info strip */}
      <div className="grid shrink-0 gap-3 border-t border-white/10 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-sm text-blue-100 md:grid-cols-3">
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
      </div>
    </section>
  );
}

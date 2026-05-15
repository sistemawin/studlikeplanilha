import { Clock3 } from "lucide-react";
import type { NavTarget, PlanningMode, ScheduleConfig, Subject } from "@/types";
import { corToAccent } from "@/lib/utils";

const CALENDAR_DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

type Props = {
  schedule: ScheduleConfig;
  subjects: Subject[];
  subjectById: Record<string, Subject>;
  activeSection: NavTarget;
  onModeChange: (mode: PlanningMode) => void;
  onHorasChange: (horas: number) => void;
};

export function Schedule({
  schedule,
  subjects,
  subjectById,
  activeSection,
  onModeChange,
  onHorasChange,
}: Props) {
  const isVisible = activeSection === "cronograma" || activeSection === "simulados";

  return (
    <div
      id="cronograma"
      className={`${
        activeSection === "cronograma" ? "block" : "hidden"
      } scroll-mt-24 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 sm:p-5 lg:block`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Planejamento flexível</h2>
          <p className="text-sm text-slate-500">Escolha grade semanal ou ciclo rotativo.</p>
        </div>
        <div
          role="group"
          aria-label="Modo de planejamento"
          className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 sm:flex"
        >
          {(["semanal", "ciclos"] as PlanningMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              aria-pressed={schedule.modo === mode}
              className={`rounded-md px-3 py-2 text-sm font-semibold ${
                schedule.modo === mode ? "bg-slate-950 text-white shadow-sm" : "text-slate-600"
              }`}
            >
              {mode === "semanal" ? "Semanal" : "Ciclos"}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-4 block text-sm font-medium" htmlFor="horas-dia">
        Meta de horas por dia
      </label>
      <input
        id="horas-dia"
        type="number"
        min={1}
        max={24}
        value={schedule.horasDia}
        onChange={(e) => onHorasChange(Number(e.target.value))}
        className="mt-2 h-11 w-32 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:h-10"
      />

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {CALENDAR_DAYS.map((day, index) => {
          const ids =
            schedule.modo === "semanal"
              ? schedule.semanal[day]
              : [schedule.ciclos[index % schedule.ciclos.length]];

          return (
            <div key={day} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold">{day}</p>
                <span className="flex items-center gap-1 text-xs text-blue-700">
                  <Clock3 className="h-3 w-3" aria-hidden="true" />
                  {schedule.horasDia}h
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ids.map((id) => {
                  const subject = subjectById[id];
                  const accent = subject ? corToAccent(subject.cor) : corToAccent("");
                  return (
                    <span
                      key={`${day}-${id}`}
                      className={`rounded-lg px-2 py-1 text-xs font-medium ${accent.chip}`}
                    >
                      {subject?.nome ?? id}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

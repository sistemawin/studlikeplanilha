import { Clock3, Plus, X } from "lucide-react";
import { useState } from "react";
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
  onUpdateSemanal: (day: string, ids: string[]) => void;
};

export function Schedule({
  schedule,
  subjects,
  subjectById,
  activeSection,
  onModeChange,
  onHorasChange,
  onUpdateSemanal,
}: Props) {
  const [pickerDay, setPickerDay] = useState<string | null>(null);

  function removeFromDay(day: string, subjectId: string) {
    const current = schedule.semanal[day] ?? [];
    onUpdateSemanal(day, current.filter((id) => id !== subjectId));
  }

  function addToDay(day: string, subjectId: string) {
    const current = schedule.semanal[day] ?? [];
    if (!current.includes(subjectId)) {
      onUpdateSemanal(day, [...current, subjectId]);
    }
    setPickerDay(null);
  }

  return (
    <div
      id="cronograma"
      className={`${
        activeSection === "cronograma" ? "block" : "hidden"
      } scroll-mt-24 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 sm:p-5 xl:block`}
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
        min={0}
        max={24}
        value={schedule.horasDia}
        onChange={(e) => onHorasChange(Number(e.target.value))}
        className="mt-2 h-11 w-32 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:h-10"
      />

      {schedule.modo === "semanal" && subjects.length === 0 && (
        <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
          Crie matérias na aba Edital para montar a grade semanal.
        </p>
      )}

      <div className="mt-5 grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
        {CALENDAR_DAYS.map((day, index) => {
          if (schedule.modo === "ciclos") {
            const id = schedule.ciclos[index % Math.max(schedule.ciclos.length, 1)];
            const subject = subjectById[id];
            const accent = subject ? corToAccent(subject.cor) : corToAccent("");
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
                  {id && (
                    <span className={`rounded-lg px-2 py-1 text-xs font-medium ${accent.chip}`}>
                      {subject?.nome ?? id}
                    </span>
                  )}
                </div>
              </div>
            );
          }

          // Semanal mode — editable
          const ids = schedule.semanal[day] ?? [];
          const available = subjects.filter((s) => !ids.includes(s.id));

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
                      className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${accent.chip}`}
                    >
                      {subject?.nome ?? id}
                      <button
                        onClick={() => removeFromDay(day, id)}
                        aria-label={`Remover ${subject?.nome ?? id} de ${day}`}
                        className="ml-0.5 rounded-full hover:bg-black/10"
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </span>
                  );
                })}

                {/* Add subject picker */}
                {available.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setPickerDay(pickerDay === day ? null : day)}
                      aria-label={`Adicionar matéria em ${day}`}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-400 hover:border-slate-500 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                    >
                      <Plus className="h-3 w-3" aria-hidden="true" />
                    </button>
                    {pickerDay === day && (
                      <div className="absolute left-0 top-8 z-20 min-w-[180px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10">
                        {available.map((s) => {
                          const accent = corToAccent(s.cor);
                          return (
                            <button
                              key={s.id}
                              onClick={() => addToDay(day, s.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                            >
                              <span className={`h-2 w-2 rounded-full ${accent.dot}`} aria-hidden="true" />
                              {s.nome}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Click outside to close picker */}
      {pickerDay && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setPickerDay(null)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

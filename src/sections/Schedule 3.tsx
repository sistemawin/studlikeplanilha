import { Clock3, Plus, X } from "lucide-react";
import { motion } from "framer-motion";
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
    onUpdateSemanal(day, (schedule.semanal[day] ?? []).filter((id) => id !== subjectId));
  }

  function addToDay(day: string, subjectId: string) {
    const current = schedule.semanal[day] ?? [];
    if (!current.includes(subjectId)) onUpdateSemanal(day, [...current, subjectId]);
    setPickerDay(null);
  }

  return (
    <div
      id="cronograma"
      className={`${
        activeSection === "cronograma" ? "block" : "hidden"
      } scroll-mt-24 rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-lg sm:p-5 xl:block`}
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Planejamento flexível</h2>
          <p className="text-sm text-white/40">Escolha grade semanal ou ciclo rotativo.</p>
        </div>
        <div
          role="group"
          aria-label="Modo de planejamento"
          className="grid grid-cols-2 rounded-xl bg-white/5 p-1 sm:flex"
        >
          {(["semanal", "ciclos"] as PlanningMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              aria-pressed={schedule.modo === mode}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                schedule.modo === mode
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {mode === "semanal" ? "Semanal" : "Ciclos"}
            </button>
          ))}
        </div>
      </div>

      {/* Hours input */}
      <div className="mt-4 flex items-center gap-3">
        <label className="text-sm font-medium text-white/60" htmlFor="horas-dia">
          Meta de horas por dia
        </label>
        <input
          id="horas-dia"
          type="number"
          min={0}
          max={24}
          value={schedule.horasDia}
          onChange={(e) => onHorasChange(Number(e.target.value))}
          className="h-10 w-24 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
        />
      </div>

      {schedule.modo === "semanal" && subjects.length === 0 && (
        <p className="mt-4 rounded-xl bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-300 ring-1 ring-amber-500/20">
          Crie matérias na aba Edital para montar a grade semanal.
        </p>
      )}

      {/* Day cards */}
      <div className="mt-5 grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
        {CALENDAR_DAYS.map((day, index) => {
          if (schedule.modo === "ciclos") {
            const id = schedule.ciclos[index % Math.max(schedule.ciclos.length, 1)];
            const subject = subjectById[id];
            const accent = subject ? corToAccent(subject.cor) : corToAccent("");
            return (
              <motion.div
                key={day}
                whileHover={{ y: -1, transition: { duration: 0.12 } }}
                className="relative overflow-hidden rounded-xl p-4 shadow-md"
                style={{ background: "linear-gradient(135deg, #0d1117 0%, #131b27 100%)" }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-bold text-white">{day}</p>
                  <span className="flex items-center gap-1 text-xs font-semibold text-blue-400">
                    <Clock3 className="h-3 w-3" aria-hidden="true" />
                    {schedule.horasDia}h
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {id && (
                    <span
                      className="rounded-lg px-2.5 py-1 text-xs font-semibold text-white"
                      style={{
                        backgroundColor: `${accent.chart}30`,
                        border: `1px solid ${accent.chart}45`,
                      }}
                    >
                      {subject?.nome ?? id}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          }

          // Semanal — editable
          const ids = schedule.semanal[day] ?? [];
          const available = subjects.filter((s) => !ids.includes(s.id));

          return (
            <motion.div
              key={day}
              whileHover={{ y: -1, transition: { duration: 0.12 } }}
              className="relative overflow-hidden rounded-xl p-4 shadow-md"
              style={{ background: "linear-gradient(135deg, #0d1117 0%, #131b27 100%)" }}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="font-bold text-white">{day}</p>
                <span className="flex items-center gap-1 text-xs font-semibold text-blue-400">
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
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-white"
                      style={{
                        backgroundColor: `${accent.chart}30`,
                        border: `1px solid ${accent.chart}45`,
                      }}
                    >
                      {subject?.nome ?? id}
                      <button
                        onClick={() => removeFromDay(day, id)}
                        aria-label={`Remover ${subject?.nome ?? id} de ${day}`}
                        className="ml-0.5 rounded-full text-white/50 hover:text-white"
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </span>
                  );
                })}

                {available.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setPickerDay(pickerDay === day ? null : day)}
                      aria-label={`Adicionar matéria em ${day}`}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-white/20 text-white/30 hover:border-white/50 hover:text-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
                    >
                      <Plus className="h-3 w-3" aria-hidden="true" />
                    </button>
                    {pickerDay === day && (
                      <div className="absolute left-0 top-8 z-20 min-w-[180px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/20">
                        {available.map((s) => {
                          const accent = corToAccent(s.cor);
                          return (
                            <button
                              key={s.id}
                              onClick={() => addToDay(day, s.id)}
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
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
            </motion.div>
          );
        })}
      </div>

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

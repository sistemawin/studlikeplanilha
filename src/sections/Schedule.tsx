import { Clock3, Plus, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import type { NavTarget, PlanningMode, ScheduleConfig, Subject } from "@/types";
import { corToAccent, isoDate } from "@/lib/utils";

const CALENDAR_DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

type Props = {
  schedule: ScheduleConfig;
  subjects: Subject[];
  subjectById: Record<string, Subject>;
  activeSection: NavTarget;
  onModeChange: (mode: PlanningMode) => void;
  onHorasChange: (horas: number) => void;
  onUpdateSemanal: (day: string, ids: string[]) => void;
  onAddExamDate: (nome: string, data: string) => void;
  onDeleteExamDate: (id: string) => void;
};

export function Schedule({
  schedule,
  subjects,
  subjectById,
  activeSection,
  onModeChange,
  onHorasChange,
  onUpdateSemanal,
  onAddExamDate,
  onDeleteExamDate,
}: Props) {
  const [pickerDay, setPickerDay] = useState<string | null>(null);
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");

  const todayIso = isoDate(new Date());
  const sortedProvas = [...(schedule.provas ?? [])].sort((a, b) => a.data.localeCompare(b.data));

  function handleAddExamDate() {
    if (!examName.trim() || !examDate) return;
    onAddExamDate(examName.trim(), examDate);
    setExamName("");
    setExamDate("");
  }

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
      } scroll-mt-24 rounded-2xl border border-white bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/5 sm:p-5 xl:block`}
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Planejamento flexível</h2>
          <p className="text-sm font-medium text-slate-500">Escolha grade semanal ou ciclo rotativo.</p>
        </div>
        <div
          role="group"
          aria-label="Modo de planejamento"
          className="grid grid-cols-2 rounded-xl bg-[#F0F2F5] p-1 sm:flex"
        >
          {(["semanal", "ciclos"] as PlanningMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              aria-pressed={schedule.modo === mode}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                schedule.modo === mode
                  ? "bg-white text-[#1877F2] shadow-sm"
                  : "text-slate-500 hover:text-slate-950"
              }`}
            >
              {mode === "semanal" ? "Semanal" : "Ciclos"}
            </button>
          ))}
        </div>
      </div>

      {/* Hours input */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <label className="text-sm font-semibold text-slate-600" htmlFor="horas-dia">
          Meta de horas por dia
        </label>
        <input
          id="horas-dia"
          type="number"
          min={0}
          max={24}
          value={schedule.horasDia}
          onChange={(e) => onHorasChange(Number(e.target.value))}
          className="h-10 w-24 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {schedule.modo === "semanal" && subjects.length === 0 && (
        <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 ring-1 ring-amber-100">
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
                className="relative overflow-hidden rounded-xl border border-slate-100 bg-[#F7F8FA] p-4 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-bold text-slate-950">{day}</p>
                  <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-[#1877F2]">
                    <Clock3 className="h-3 w-3" aria-hidden="true" />
                    {schedule.horasDia}h
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {id && (
                    <span
                      className="rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800"
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
              className="relative overflow-hidden rounded-xl border border-slate-100 bg-[#F7F8FA] p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="font-bold text-slate-950">{day}</p>
                <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-[#1877F2]">
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
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800"
                      style={{
                        backgroundColor: `${accent.chart}30`,
                        border: `1px solid ${accent.chart}45`,
                      }}
                    >
                      {subject?.nome ?? id}
                      <button
                        onClick={() => removeFromDay(day, id)}
                        aria-label={`Remover ${subject?.nome ?? id} de ${day}`}
                        className="ml-0.5 flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-white hover:text-slate-950"
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
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white text-slate-500 hover:border-[#1877F2] hover:text-[#1877F2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
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

      {/* Exam dates */}
      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <p className="font-semibold text-slate-950">Próximas provas</p>
        <p className="mt-0.5 text-sm text-slate-500">A contagem regressiva aparece na tela inicial.</p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="exam-date-name">Nome da prova</label>
          <input
            id="exam-date-name"
            type="text"
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAddExamDate(); }}
            placeholder="Nome da prova ou concurso"
            className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-blue-100"
          />
          <label className="sr-only" htmlFor="exam-date-date">Data da prova</label>
          <input
            id="exam-date-date"
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            min={todayIso}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="button"
            onClick={handleAddExamDate}
            disabled={!examName.trim() || !examDate}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#1877F2] px-4 text-sm font-bold text-white hover:bg-[#1B74E4] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Adicionar
          </button>
        </div>

        {sortedProvas.length > 0 && (
          <div className="mt-3 space-y-2">
            {sortedProvas.map((prova) => {
              const daysUntil = Math.ceil(
                (new Date(prova.data + "T12:00:00").getTime() - new Date(todayIso + "T12:00:00").getTime()) /
                  (1000 * 60 * 60 * 24),
              );
              const isPast = daysUntil < 0;
              return (
                <div
                  key={prova.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-100"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">{prova.nome}</p>
                    <p className="text-xs font-medium text-slate-500">{prova.data}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                        isPast
                          ? "bg-slate-100 text-slate-500"
                          : daysUntil === 0
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                          : "bg-blue-50 text-[#1877F2] ring-1 ring-blue-100"
                      }`}
                    >
                      {isPast ? "Encerrada" : daysUntil === 0 ? "Hoje!" : daysUntil === 1 ? "Amanhã" : `${daysUntil} dias`}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteExamDate(prova.id)}
                      aria-label={`Remover prova ${prova.nome}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

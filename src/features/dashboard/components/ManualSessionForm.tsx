"use client";

import { useState } from "react";
import { Plus, Save, X } from "lucide-react";
import type { StudySessionType, Subject, Topic } from "@/types";
import { isoDate } from "@/lib/utils";

type OnAddManualSession = (data: {
  tipo: StudySessionType;
  materiaId?: string;
  materiaNome?: string;
  topicoId?: string;
  topicoTitulo?: string;
  durationSeconds: number;
  data: string;
}) => void;

type Props = {
  subjects: Subject[];
  topics: Topic[];
  onAddManualSession: OnAddManualSession;
};

export function ManualSessionForm({ subjects, topics, onAddManualSession }: Props) {
  const [manualOpen, setManualOpen] = useState(false);
  const [manualTipo, setManualTipo] = useState<StudySessionType>("topico");
  const [manualSubjectId, setManualSubjectId] = useState("");
  const [manualTopicId, setManualTopicId] = useState("");
  const [manualHours, setManualHours] = useState("0");
  const [manualMinutes, setManualMinutes] = useState("30");
  const [manualDate, setManualDate] = useState(() => isoDate(new Date()));

  function submitManualSession() {
    const h = Math.max(0, parseInt(manualHours) || 0);
    const m = Math.max(0, Math.min(59, parseInt(manualMinutes) || 0));
    const durationSeconds = h * 3600 + m * 60;
    if (durationSeconds <= 0) return;
    const subject = subjects.find((s) => s.id === manualSubjectId);
    const topic = topics.find((t) => t.id === manualTopicId && t.materiaId === manualSubjectId);
    onAddManualSession({
      tipo: manualTipo,
      materiaId: manualTipo !== "livre" ? subject?.id : undefined,
      materiaNome: manualTipo !== "livre" ? subject?.nome : undefined,
      topicoId: manualTipo === "topico" ? topic?.id : undefined,
      topicoTitulo: manualTipo === "topico" ? topic?.titulo : undefined,
      durationSeconds,
      data: manualDate || isoDate(new Date()),
    });
    setManualOpen(false);
    setManualHours("0");
    setManualMinutes("30");
    setManualDate(isoDate(new Date()));
  }

  if (!manualOpen) {
    return (
      <button
        type="button"
        onClick={() => setManualOpen(true)}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2.5 text-xs font-semibold text-slate-500 hover:border-[#1877F2] hover:text-[#1877F2]"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        Registrar sessão manualmente
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-950">Registrar sessão manualmente</p>
        <button
          type="button"
          onClick={() => setManualOpen(false)}
          aria-label="Fechar formulário"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex gap-2">
        {(["topico", "livre"] as StudySessionType[]).map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={manualTipo === t}
            onClick={() => setManualTipo(t)}
            className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
              manualTipo === t
                ? "bg-[#1877F2] text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t === "topico" ? "Tópico" : "Livre"}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {manualTipo !== "livre" && (
          <>
            <div>
              <label className="sr-only" htmlFor="manual-subject">Matéria</label>
              <select
                id="manual-subject"
                value={manualSubjectId}
                onChange={(e) => { setManualSubjectId(e.target.value); setManualTopicId(""); }}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Selecione a matéria</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
            {manualTipo === "topico" && (
              <div>
                <label className="sr-only" htmlFor="manual-topic">Tópico</label>
                <select
                  id="manual-topic"
                  value={manualTopicId}
                  onChange={(e) => setManualTopicId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Selecione o tópico</option>
                  {topics.filter((t) => t.materiaId === manualSubjectId).map((t) => (
                    <option key={t.id} value={t.id}>{t.titulo}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="sr-only" htmlFor="manual-hours">Horas</label>
            <input
              id="manual-hours"
              type="number"
              min={0}
              max={23}
              value={manualHours}
              onChange={(e) => setManualHours(e.target.value)}
              placeholder="0"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <span className="shrink-0 text-sm font-semibold text-slate-500">h</span>
          <div className="flex-1">
            <label className="sr-only" htmlFor="manual-minutes">Minutos</label>
            <input
              id="manual-minutes"
              type="number"
              min={0}
              max={59}
              value={manualMinutes}
              onChange={(e) => setManualMinutes(e.target.value)}
              placeholder="30"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <span className="shrink-0 text-sm font-semibold text-slate-500">min</span>
        </div>

        <div>
          <label className="sr-only" htmlFor="manual-date">Data</label>
          <input
            id="manual-date"
            type="date"
            value={manualDate}
            onChange={(e) => setManualDate(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={submitManualSession}
        className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#1877F2] text-sm font-bold text-white hover:bg-[#1B74E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
      >
        <Save className="h-4 w-4" aria-hidden="true" />
        Registrar sessão
      </button>
    </div>
  );
}

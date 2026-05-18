"use client";

import { useState } from "react";
import { Pencil, Save, X } from "lucide-react";
import type { Goal } from "@/types";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { pct } from "@/lib/utils";

export function GoalCard({
  goal,
  label,
  tone,
  onUpdateObjective,
}: {
  goal: Goal;
  label: string;
  tone: string;
  onUpdateObjective: (value: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(String(goal.valorObjetivo));

  function save() {
    const n = Number(draftValue);
    if (n > 0) onUpdateObjective(n);
    setEditing(false);
  }

  return (
    <div className={`min-w-0 w-full max-w-full overflow-hidden rounded-xl border p-4 ${tone}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="break-words text-sm font-medium">{label}</p>
        <button
          onClick={() => { setDraftValue(String(goal.valorObjetivo)); setEditing(true); }}
          aria-label={`Editar meta de ${label}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-white/60 hover:text-slate-800"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {editing ? (
        <div className="mt-2 flex items-center gap-2">
          <label className="sr-only" htmlFor={`goal-${goal.tipo}`}>
            Nova meta de {label}
          </label>
          <input
            id={`goal-${goal.tipo}`}
            type="number"
            min={1}
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
            className="h-9 w-24 rounded-lg border border-slate-300 bg-white px-2 text-sm outline-none focus:border-blue-500"
          />
          <button onClick={save} className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1877F2] text-white hover:bg-[#1B74E4]">
            <Save className="h-4 w-4" aria-hidden="true" />
          </button>
          <button onClick={() => setEditing(false)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <p className="mt-2 text-2xl font-semibold">
          {goal.valorAtual}
          <span className="text-base font-normal text-slate-500">
            /{goal.valorObjetivo}{goal.tipo === "horas" ? "h" : ""}
          </span>
        </p>
      )}

      {!editing && (
        <ProgressBar
          value={pct(goal.valorAtual, goal.valorObjetivo)}
          tone={`bg-${tone.includes("blue") ? "blue" : "emerald"}-500`}
          label={label}
        />
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpenCheck, Check, Layers, ListChecks } from "lucide-react";
import type { ReadyEdital } from "@/lib/readyEditals";
import { CATEGORIA_ICON, CATEGORIA_SOFT_ICON, NIVEL_CLASS } from "./editalCategoryConfig";

type Props = {
  edital: ReadyEdital;
  onImport: (edital: ReadyEdital) => void | Promise<void>;
  index?: number;
};

export function EditalCard({ edital, onImport, index = 0 }: Props) {
  const [done, setDone] = useState(false);

  const totalTopics = edital.subjects.reduce((sum, s) => sum + s.topicos.length, 0);
  const cat = edital.categoria ?? "geral";
  const Icon = CATEGORIA_ICON[cat];
  const softIcon = CATEGORIA_SOFT_ICON[cat];

  async function handleImport() {
    if (done) return;
    try {
      await onImport(edital);
      setDone(true);
      window.setTimeout(() => setDone(false), 3000);
    } catch {
      // Error feedback is handled by the parent action.
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06, ease: "easeOut" }}
      className="group flex min-h-44 flex-col rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_10px_26px_rgba(15,23,42,0.045)] ring-1 ring-slate-900/[0.035] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,23,42,0.065)]"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 ${softIcon}`}>
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        {edital.badges && edital.badges[0] && (
          <span className="rounded-full bg-slate-50 px-2 py-1 text-[9px] font-bold leading-none text-slate-500 ring-1 ring-slate-100">
            {edital.badges[0]}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-bold leading-5 text-slate-950">
            {edital.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-[11px] font-medium leading-4 text-slate-500">
            {edital.banca} · {edital.ano}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold text-slate-500">
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3 shrink-0 text-slate-400" aria-hidden="true" />
            {edital.subjects.length} mat.
          </span>
          <span className="flex items-center gap-1">
            <ListChecks className="h-3 w-3 shrink-0 text-slate-400" aria-hidden="true" />
            {totalTopics} tóp.
          </span>
          {edital.nivel && (
            <span className={`rounded-full px-1.5 py-px text-[9px] font-bold ${NIVEL_CLASS[edital.nivel]}`}>
              {edital.nivel}
            </span>
          )}
        </div>

        {/* Import button */}
        <button
          type="button"
          onClick={handleImport}
          className={`mt-auto flex h-8 w-full items-center justify-center gap-1.5 rounded-xl text-[11px] font-bold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${
            done
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
              : "bg-[#1877F2] text-white shadow-sm shadow-blue-600/10 hover:bg-[#1B74E4] active:scale-[0.98]"
          }`}
        >
          {done ? (
            <>
              <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
              Adicionado
            </>
          ) : (
            <>
              <BookOpenCheck className="h-3 w-3 shrink-0" aria-hidden="true" />
              Adicionar
            </>
          )}
        </button>
      </div>
    </motion.article>
  );
}

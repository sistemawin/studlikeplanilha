"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpenCheck, Check, Layers, ListChecks } from "lucide-react";
import type { ReadyEdital } from "@/lib/readyEditals";
import { CATEGORIA_ICON, CATEGORIA_SOFT_ICON, NIVEL_CLASS } from "./editalCategoryConfig";

type Props = {
  edital: ReadyEdital;
  onImport: (edital: ReadyEdital) => void;
  index?: number;
};

export function EditalFeaturedCard({ edital, onImport, index = 0 }: Props) {
  const [done, setDone] = useState(false);

  const totalTopics = edital.subjects.reduce((sum, s) => sum + s.topicos.length, 0);
  const cat = edital.categoria ?? "geral";
  const Icon = CATEGORIA_ICON[cat];
  const softIcon = CATEGORIA_SOFT_ICON[cat];

  function handleImport() {
    if (done) return;
    onImport(edital);
    setDone(true);
    window.setTimeout(() => setDone(false), 3000);
  }

  return (
    <motion.article
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08, ease: "easeOut" }}
      className="relative flex w-[17rem] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/[0.04] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.08)]"
    >
      <span className="h-1 w-full bg-[#1877F2]" aria-hidden="true" />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ring-1 ${softIcon}`}>
            <Icon className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          {edital.badges && edital.badges[0] && (
            <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold leading-none text-[#1877F2] ring-1 ring-blue-100">
              {edital.badges[0]}
            </span>
          )}
        </div>

        <div className="min-w-0 space-y-1">
          <h3 className="line-clamp-2 text-base font-bold leading-5 text-slate-950">
            {edital.title}
          </h3>
          <p className="line-clamp-1 text-xs font-medium leading-4 text-slate-500">
            {edital.banca} · {edital.ano}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-2 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-100">
          <span className="flex items-center justify-center gap-1">
            <Layers className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
            {edital.subjects.length} mat.
          </span>
          <span className="flex items-center justify-center gap-1">
            <ListChecks className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
            {totalTopics} tóp.
          </span>
          {edital.nivel && (
            <span className={`flex items-center justify-center rounded-full px-2 py-1 text-[10px] font-bold ${NIVEL_CLASS[edital.nivel]}`}>
              {edital.nivel}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleImport}
          className={`mt-auto flex h-9 w-full items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${
            done
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
              : "bg-[#1877F2] text-white shadow-sm shadow-blue-600/15 hover:bg-[#1B74E4] active:scale-[0.98]"
          }`}
        >
          {done ? (
            <>
              <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Adicionado
            </>
          ) : (
            <>
              <BookOpenCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Adicionar ao plano
            </>
          )}
        </button>
      </div>
    </motion.article>
  );
}

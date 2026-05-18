"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpenCheck, Check, Layers, ListChecks } from "lucide-react";
import type { ReadyEdital } from "@/lib/readyEditals";
import { CATEGORIA_ICON, CATEGORIA_BG, NIVEL_CLASS } from "./editalCategoryConfig";

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
  const bg = CATEGORIA_BG[cat];

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
      className="w-48 shrink-0 snap-start flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-900/[0.07] shadow-md shadow-slate-900/8 hover:shadow-lg hover:ring-slate-900/12 transition-all duration-200"
    >
      {/* Colored header with category icon */}
      <div className={`relative flex h-[72px] shrink-0 items-center justify-center ${bg}`}>
        <Icon className="h-9 w-9 text-white/90" aria-hidden="true" />
        {/* First badge pill */}
        {edital.badges && edital.badges[0] && (
          <span className="absolute bottom-2 left-2.5 rounded-full bg-black/25 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
            {edital.badges[0]}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2.5 p-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-[13px] font-extrabold leading-tight tracking-tight text-slate-950">
            {edital.title}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-slate-400">
            {edital.banca} · {edital.ano}
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-400">
          <span className="flex items-center gap-0.5">
            <Layers className="h-3 w-3 shrink-0" aria-hidden="true" />
            {edital.subjects.length}
          </span>
          <span className="flex items-center gap-0.5">
            <ListChecks className="h-3 w-3 shrink-0" aria-hidden="true" />
            {totalTopics}
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
              : "bg-[#1877F2] text-white shadow-sm shadow-blue-600/20 hover:bg-[#1B74E4] active:scale-[0.98]"
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
              + Adicionar
            </>
          )}
        </button>
      </div>
    </motion.article>
  );
}

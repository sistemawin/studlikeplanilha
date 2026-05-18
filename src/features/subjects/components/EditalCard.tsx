"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpenCheck, Check, Clock, Layers, ListChecks } from "lucide-react";
import type { ReadyEdital } from "@/lib/readyEditals";
import { CATEGORIA_ICON, CATEGORIA_BG, NIVEL_CLASS } from "./editalCategoryConfig";

type Props = {
  edital: ReadyEdital;
  onImport: (edital: ReadyEdital) => void;
  index?: number;
};

export function EditalCard({ edital, onImport, index = 0 }: Props) {
  const [done, setDone] = useState(false);

  const isAvailable = edital.disponivel !== false;
  const totalTopics = edital.subjects.reduce((sum, s) => sum + s.topicos.length, 0);
  const cat = edital.categoria ?? "geral";
  const Icon = CATEGORIA_ICON[cat];
  const bg = CATEGORIA_BG[cat];

  // ── "Em breve" mini card ──────────────────────────────────────────────────
  if (!isAvailable) {
    return (
      <motion.article
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.22, delay: index * 0.05 }}
        className="flex flex-col overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-100"
        aria-label={`${edital.title} — em breve`}
      >
        {/* Muted category icon area */}
        <div className={`flex h-10 items-center justify-center ${bg} opacity-20`}>
          <Icon className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        <div className="flex flex-col items-center gap-1 px-2 py-2.5 text-center">
          <p className="line-clamp-2 text-[11px] font-extrabold leading-tight text-slate-400">
            {edital.title}
          </p>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-400">
            <Clock className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
            Em breve
          </span>
        </div>
      </motion.article>
    );
  }

  // ── Regular compact card ──────────────────────────────────────────────────
  function handleImport() {
    if (done) return;
    onImport(edital);
    setDone(true);
    window.setTimeout(() => setDone(false), 3000);
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06, ease: "easeOut" }}
      className="group flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-slate-900/[0.07] shadow-sm shadow-slate-900/5 hover:shadow-md hover:ring-slate-900/10 transition-all duration-200"
    >
      {/* Category header with icon */}
      <div className={`relative flex h-14 shrink-0 items-center justify-center ${bg}`}>
        <Icon className="h-7 w-7 text-white/90" aria-hidden="true" />
        {edital.badges && edital.badges[0] && (
          <span className="absolute bottom-1.5 left-2 rounded-full bg-black/20 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-white">
            {edital.badges[0]}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-2.5">
        {/* Title + banca */}
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-xs font-extrabold leading-tight tracking-tight text-slate-950">
            {edital.title}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-[10px] font-medium text-slate-400">
            {edital.banca} · {edital.ano}
          </p>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-semibold text-slate-400">
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
          className={`mt-auto flex h-7 w-full items-center justify-center gap-1 rounded-lg text-[10px] font-bold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${
            done
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
              : "bg-[#1877F2] text-white hover:bg-[#1B74E4] active:scale-[0.98]"
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
              + Adicionar
            </>
          )}
        </button>
      </div>
    </motion.article>
  );
}

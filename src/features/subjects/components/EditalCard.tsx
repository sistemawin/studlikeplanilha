"use client";

import { motion } from "framer-motion";
import { BookOpenCheck, Layers, ListChecks } from "lucide-react";
import type { ReadyEdital } from "@/lib/readyEditals";
import { CATEGORIA_ICON, CATEGORIA_SOFT_ICON, NIVEL_CLASS } from "./editalCategoryConfig";

type Props = {
  edital: ReadyEdital;
  onImport: (edital: ReadyEdital) => void | Promise<void>;
  index?: number;
  featured?: boolean;
};

export function EditalCard({ edital, onImport, index = 0, featured = false }: Props) {
  const totalTopics = edital.subjects.reduce((sum, s) => sum + s.topicos.length, 0);
  const cat = edital.categoria ?? "geral";
  const Icon = CATEGORIA_ICON[cat];
  const softIcon = CATEGORIA_SOFT_ICON[cat];

  function handleImport() {
    void onImport(edital);
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: featured ? 0 : 12, x: featured ? 20 : 0 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: featured ? 0.3 : 0.25, delay: index * (featured ? 0.08 : 0.06), ease: "easeOut" }}
      className={`group relative flex min-h-52 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/[0.04] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.08)] ${
        featured ? "w-[17rem] shrink-0 snap-start" : "w-full"
      }`}
    >
      <span className="h-1 w-full bg-[#1877F2]" aria-hidden="true" />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ring-1 ${softIcon}`}>
            <Icon className="h-4 w-4" aria-hidden="true" />
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
          className="mt-auto flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#1877F2] text-xs font-bold text-white shadow-sm shadow-blue-600/15 transition-all duration-200 hover:bg-[#1B74E4] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          <BookOpenCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Adicionar ao plano
        </button>
      </div>
    </motion.article>
  );
}

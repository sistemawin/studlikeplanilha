"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpenCheck, Check, Layers, ListChecks, Zap } from "lucide-react";
import type { ReadyEdital, EditalCategoria, EditalBadge, EditalNivel } from "@/lib/readyEditals";

// ── Color maps ────────────────────────────────────────────────────────────────

const CATEGORIA_ACCENT: Record<EditalCategoria, string> = {
  policia:  "from-blue-600 to-blue-400",
  tribunal: "from-purple-600 to-violet-400",
  fiscal:   "from-emerald-600 to-teal-400",
  bancario: "from-amber-500 to-yellow-400",
  militar:  "from-slate-700 to-slate-500",
  enem:     "from-rose-500 to-pink-400",
  oab:      "from-violet-600 to-purple-400",
  geral:    "from-slate-400 to-slate-300",
};

const BADGE_CLASS: Record<EditalBadge, string> = {
  "Novo":          "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  "Mais estudado": "bg-orange-50 text-orange-700 ring-1 ring-orange-100",
  "Polícia":       "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  "Tribunal":      "bg-purple-50 text-purple-700 ring-1 ring-purple-100",
  "Bancário":      "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  "ENEM":          "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
  "OAB":           "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
  "Militar":       "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  "Fiscal":        "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
};

const NIVEL_CLASS: Record<EditalNivel, string> = {
  "Básico":        "bg-emerald-50 text-emerald-700",
  "Intermediário": "bg-amber-50 text-amber-700",
  "Avançado":      "bg-rose-50 text-rose-700",
};

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  edital: ReadyEdital;
  onImport: (edital: ReadyEdital) => void;
  index?: number;
};

export function EditalCard({ edital, onImport, index = 0 }: Props) {
  const [done, setDone] = useState(false);

  const totalTopics = edital.subjects.reduce((sum, s) => sum + s.topicos.length, 0);
  const accent = edital.categoria ? CATEGORIA_ACCENT[edital.categoria] : CATEGORIA_ACCENT.geral;

  function handleImport() {
    if (done) return;
    onImport(edital);
    setDone(true);
    window.setTimeout(() => setDone(false), 3000);
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.07, ease: "easeOut" }}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-900/[0.07] shadow-sm shadow-slate-900/5 hover:shadow-md hover:shadow-slate-900/8 hover:ring-slate-900/10 transition-shadow duration-200"
    >
      {/* Categoria accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${accent} shrink-0`} aria-hidden="true" />

      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Badges */}
        {edital.badges && edital.badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {edital.badges.map((badge) => (
              <span
                key={badge}
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${BADGE_CLASS[badge]}`}
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        {/* Title + cargo */}
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-base font-extrabold leading-snug tracking-tight text-slate-950">
            {edital.title}
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-500">{edital.cargo}</p>
        </div>

        {/* Banca + ano */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span className="min-w-0 truncate">{edital.banca}</span>
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
            {edital.ano}
          </span>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 font-semibold text-slate-500">
            <Layers className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            {edital.subjects.length} matéria{edital.subjects.length !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-500">
            <ListChecks className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            {totalTopics} tópico{totalTopics !== 1 ? "s" : ""}
          </span>
          {edital.nivel && (
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${NIVEL_CLASS[edital.nivel]}`}
            >
              <Zap className="h-3 w-3" aria-hidden="true" />
              {edital.nivel}
            </span>
          )}
        </div>

        {/* Import button */}
        <button
          type="button"
          onClick={handleImport}
          className={`mt-auto flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${
            done
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
              : "bg-[#1877F2] text-white shadow-sm shadow-blue-600/20 hover:bg-[#1B74E4] active:scale-[0.98]"
          }`}
        >
          {done ? (
            <>
              <Check className="h-4 w-4" aria-hidden="true" />
              Adicionado ao plano
            </>
          ) : (
            <>
              <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
              Adicionar ao meu plano
            </>
          )}
        </button>
      </div>
    </motion.article>
  );
}

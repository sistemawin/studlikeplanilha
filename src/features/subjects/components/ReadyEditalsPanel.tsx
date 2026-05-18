"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Sparkles, X } from "lucide-react";
import type { ReadyEdital, EditalCategoria } from "@/lib/readyEditals";
import { readyEditals } from "@/lib/readyEditals";
import { EditalCard } from "./EditalCard";
import { EditalFeaturedCard } from "./EditalFeaturedCard";
import { CATEGORIA_SECTION } from "./editalCategoryConfig";

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  onImportReadyEdital: (edital: ReadyEdital) => void;
};

type FilterValue = "todos" | EditalCategoria;

// ── Filter pills ──────────────────────────────────────────────────────────────

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "todos",    label: "Todos"    },
  { value: "policia",  label: "Polícia"  },
  { value: "tribunal", label: "Tribunal" },
  { value: "fiscal",   label: "Fiscal"   },
  { value: "bancario", label: "Bancário" },
  { value: "militar",  label: "Militar"  },
  { value: "enem",     label: "ENEM"     },
  { value: "oab",      label: "OAB"      },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <p
      className={`mb-3 text-[11px] font-bold uppercase tracking-[0.14em] ${
        muted ? "text-slate-300" : "text-slate-500"
      }`}
    >
      {label}
    </p>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ReadyEditalsPanel({ onImportReadyEdital }: Props) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterValue>("todos");

  const isFiltering = search.trim() !== "" || activeFilter !== "todos";

  const available = useMemo(
    () => readyEditals.filter((e) => e.disponivel !== false),
    []
  );

  const comingSoon = useMemo(
    () => readyEditals.filter((e) => e.disponivel === false),
    []
  );

  const featured = useMemo(
    () => available.filter((e) => e.destaque),
    [available]
  );

  const rest = useMemo(
    () => available.filter((e) => !e.destaque),
    [available]
  );

  // Group non-featured by category for category sections
  const byCategory = useMemo(() => {
    const groups: Partial<Record<EditalCategoria, ReadyEdital[]>> = {};
    for (const edital of rest) {
      const cat = edital.categoria ?? "geral";
      if (!groups[cat]) groups[cat] = [];
      groups[cat]!.push(edital);
    }
    return groups;
  }, [rest]);

  // Search + filter over available items only (em breve are not searchable)
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return available.filter((e) => {
      const matchesSearch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.cargo.toLowerCase().includes(q) ||
        e.banca.toLowerCase().includes(q);
      const matchesFilter =
        activeFilter === "todos" || e.categoria === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [search, activeFilter, available]);

  function clearFilters() {
    setSearch("");
    setActiveFilter("todos");
  }

  return (
    <section className="mb-4 overflow-hidden rounded-2xl border border-white bg-white shadow-[0_18px_45px_rgba(15,23,42,0.07)] ring-1 ring-slate-900/5">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#1877F2] text-white shadow-lg shadow-blue-600/20">
            <Sparkles className="h-4.5 w-4.5 h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1877F2]">Catálogo</p>
            <h2 className="mt-0.5 text-base font-extrabold tracking-tight text-slate-950">
              Explorar editais
            </h2>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Buscar concurso, banca ou cargo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-[#F7F8FA] pl-9 pr-9 text-sm text-slate-950 placeholder:text-slate-400 focus:border-[#1877F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Limpar busca"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setActiveFilter(f.value)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${
                activeFilter === f.value
                  ? "bg-[#1877F2] text-white shadow-sm shadow-blue-600/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="space-y-7 p-5 sm:p-6">

        {/* ── Filtered results ─────────────────────────────────────────── */}
        {isFiltering && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <SectionHeader label={`${filtered.length} resultado${filtered.length !== 1 ? "s" : ""}`} />
              <button
                type="button"
                onClick={clearFilters}
                className="text-[11px] font-semibold text-[#1877F2] hover:underline"
              >
                Limpar
              </button>
            </div>
            <AnimatePresence mode="popLayout">
              {filtered.length > 0 ? (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                  {filtered.map((edital, i) => (
                    <EditalCard
                      key={edital.id}
                      edital={edital}
                      onImport={onImportReadyEdital}
                      index={i}
                    />
                  ))}
                </div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-3 py-10 text-center"
                >
                  <span className="text-3xl" aria-hidden="true">🔍</span>
                  <p className="font-extrabold tracking-tight text-slate-950">Nenhum edital encontrado</p>
                  <p className="text-sm text-slate-500">Tente outro termo ou categoria.</p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-1 rounded-xl bg-[#1877F2] px-4 py-2 text-xs font-bold text-white hover:bg-[#1B74E4]"
                  >
                    Ver todos
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Normal catalog view ───────────────────────────────────────── */}
        {!isFiltering && (
          <>
            {/* 🔥 Em Alta — horizontal carousel */}
            {featured.length > 0 && (
              <div>
                <SectionHeader label="🔥 Em alta" />
                {/* Negative margin trick: extends carousel edge-to-edge on mobile */}
                <div className="-mx-5 sm:-mx-6 overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <div className="flex gap-3 px-5 sm:px-6 pb-1">
                    {featured.map((edital, i) => (
                      <EditalFeaturedCard
                        key={edital.id}
                        edital={edital}
                        onImport={onImportReadyEdital}
                        index={i}
                      />
                    ))}
                    {/* Trailing space so last card doesn't hug the edge */}
                    <div className="w-1 shrink-0" aria-hidden="true" />
                  </div>
                </div>
              </div>
            )}

            {/* Category sections (non-featured available items) */}
            {Object.entries(byCategory).map(([cat, editais]) => {
              const config = CATEGORIA_SECTION[cat as EditalCategoria];
              if (!editais || editais.length === 0) return null;
              return (
                <div key={cat}>
                  <SectionHeader label={`${config.emoji} ${config.label}`} />
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                    {editais.map((edital, i) => (
                      <EditalCard
                        key={edital.id}
                        edital={edital}
                        onImport={onImportReadyEdital}
                        index={i}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* 🔜 Em breve — mini compact grid */}
            {comingSoon.length > 0 && (
              <div>
                <SectionHeader label="🔜 Em breve" muted />
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                  {comingSoon.map((edital, i) => (
                    <EditalCard
                      key={edital.id}
                      edital={edital}
                      onImport={onImportReadyEdital}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

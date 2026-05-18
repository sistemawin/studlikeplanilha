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

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="mb-3 text-[10px] font-bold uppercase leading-4 tracking-[0.08em] text-slate-500">
      {label}
    </p>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ReadyEditalsPanel({ onImportReadyEdital }: Props) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterValue>("todos");

  const isFiltering = search.trim() !== "" || activeFilter !== "todos";

  const featured = useMemo(
    () => readyEditals.filter((e) => e.destaque),
    []
  );

  const rest = useMemo(
    () => readyEditals.filter((e) => !e.destaque),
    []
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

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return readyEditals.filter((e) => {
      const matchesSearch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.cargo.toLowerCase().includes(q) ||
        e.banca.toLowerCase().includes(q);
      const matchesFilter =
        activeFilter === "todos" || e.categoria === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [search, activeFilter]);

  function clearFilters() {
    setSearch("");
    setActiveFilter("todos");
  }

  return (
    <section className="mb-4 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.055)] ring-1 ring-slate-900/[0.035]">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-100 bg-white p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#1877F2] ring-1 ring-blue-100">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase leading-4 tracking-[0.08em] text-[#1877F2]">Catálogo</p>
            <h2 className="mt-0.5 text-base font-bold leading-5 text-slate-950">
              Explorar editais
            </h2>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Buscar concurso, banca ou cargo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-8 text-[13px] font-medium text-slate-950 placeholder:text-slate-400 focus:border-[#1877F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
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
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setActiveFilter(f.value)}
              className={`h-8 shrink-0 rounded-full px-3 text-[11px] font-bold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${
                activeFilter === f.value
                  ? "bg-[#1877F2] text-white shadow-sm shadow-blue-600/20"
                  : "bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="space-y-6 p-4 sm:p-5">

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
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
                  className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 py-10 text-center"
                >
                  <Search className="h-5 w-5 text-slate-300" aria-hidden="true" />
                  <p className="font-bold text-slate-950">Nenhum edital encontrado</p>
                  <p className="text-sm font-medium text-slate-500">Tente outro termo ou categoria.</p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-1 h-9 rounded-xl bg-[#1877F2] px-4 text-xs font-bold text-white hover:bg-[#1B74E4]"
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
            {/* Em Alta — horizontal carousel */}
            {featured.length > 0 && (
              <div>
                <SectionHeader label="Em alta" />
                <div className="-mx-4 overflow-x-auto snap-x snap-mandatory px-4 sm:-mx-5 sm:px-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <div className="flex gap-3 pb-1">
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

            {/* Category sections (non-featured items) */}
            {Object.entries(byCategory).map(([cat, editais]) => {
              const config = CATEGORIA_SECTION[cat as EditalCategoria];
              if (!editais || editais.length === 0) return null;
              return (
                <div key={cat}>
                  <SectionHeader label={`${config.emoji} ${config.label}`} />
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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

          </>
        )}
      </div>
    </section>
  );
}

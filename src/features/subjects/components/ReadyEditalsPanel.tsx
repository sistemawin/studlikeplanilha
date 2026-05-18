"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Sparkles, SlidersHorizontal, X } from "lucide-react";
import type { ReadyEdital, EditalCategoria } from "@/lib/readyEditals";
import { readyEditals } from "@/lib/readyEditals";
import { EditalCard } from "./EditalCard";

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  onImportReadyEdital: (edital: ReadyEdital) => void;
};

type FilterValue = "todos" | EditalCategoria;

// ── Constants ─────────────────────────────────────────────────────────────────

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "todos",    label: "Todos"     },
  { value: "policia",  label: "Polícia"   },
  { value: "tribunal", label: "Tribunal"  },
  { value: "fiscal",   label: "Fiscal"    },
  { value: "bancario", label: "Bancário"  },
  { value: "militar",  label: "Militar"   },
  { value: "enem",     label: "ENEM"      },
  { value: "oab",      label: "OAB"       },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function ReadyEditalsPanel({ onImportReadyEdital }: Props) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterValue>("todos");

  const isFiltering = search.trim() !== "" || activeFilter !== "todos";

  // Only disponivel:true (or undefined) items are searchable and importable.
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
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1877F2] text-white shadow-lg shadow-blue-600/20">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#1877F2]">
              Catálogo
            </p>
            <h2 className="mt-0.5 text-lg font-extrabold tracking-tight text-slate-950">
              Explorar editais
            </h2>
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Adicione concursos prontos ao seu plano de estudos. Seus dados atuais não são apagados.
        </p>

        {/* Search */}
        <div className="relative mt-4">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Buscar concurso, banca ou cargo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-[#F7F8FA] pl-10 pr-10 text-sm text-slate-950 placeholder:text-slate-400 focus:border-[#1877F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Limpar busca"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setActiveFilter(f.value)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${
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
      <div className="space-y-8 p-5 sm:p-6">

        {/* Filtered results */}
        {isFiltering && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-[#1877F2] hover:underline"
              >
                Limpar filtros
              </button>
            </div>
            <AnimatePresence mode="popLayout">
              {filtered.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                  className="flex flex-col items-center gap-3 py-12 text-center"
                >
                  <span className="text-4xl" aria-hidden="true">🔍</span>
                  <p className="font-extrabold tracking-tight text-slate-950">
                    Nenhum edital encontrado
                  </p>
                  <p className="text-sm text-slate-500">
                    Tente outro termo, banca ou categoria.
                  </p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-1 rounded-xl bg-[#1877F2] px-5 py-2 text-sm font-bold text-white hover:bg-[#1B74E4]"
                  >
                    Ver todos os editais
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Normal view: featured + rest */}
        {!isFiltering && (
          <>
            {/* 🔥 Em Alta */}
            {featured.length > 0 && (
              <div>
                <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  🔥 Mais adicionados
                </p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {featured.map((edital, i) => (
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

            {/* Catálogo completo (non-featured) */}
            {rest.length > 0 && (
              <div>
                <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  <SlidersHorizontal className="h-3 w-3" aria-hidden="true" />
                  Catálogo completo
                </p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {rest.map((edital, i) => (
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

            {/* Em breve */}
            {comingSoon.length > 0 && (
              <div>
                <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-300">
                  🔜 Em breve
                </p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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

"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Subject, Topic, TopicStatus } from "@/types";
import { corToAccent, statusTone } from "@/lib/utils";

const STATUS_CYCLE: TopicStatus[] = ["Não Estudado", "Teoria Lida", "Questões Feitas", "Revisado"];

type Props = {
  topics: Topic[];
  subjects: Subject[];
  onStatusChange: (topicId: string, status: TopicStatus) => void;
  onClose: () => void;
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function GlobalSearch({ topics, subjects, onStatusChange, onClose }: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = prev; };
  }, []);

  const subjectById = Object.fromEntries(subjects.map((s) => [s.id, s]));
  const normalizedQuery = normalize(query.trim());

  const results =
    normalizedQuery.length < 2
      ? []
      : topics
          .filter((t) => {
            const subjectName = subjectById[t.materiaId]?.nome ?? "";
            return (
              normalize(t.titulo).includes(normalizedQuery) ||
              normalize(subjectName).includes(normalizedQuery)
            );
          })
          .slice(0, 30);

  function cycleStatus(topic: Topic) {
    const idx = STATUS_CYCLE.indexOf(topic.status);
    onStatusChange(topic.id, STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pesquisa global"
      className="fixed inset-0 z-[2147483647] flex items-start justify-center overflow-hidden bg-slate-950/45 p-4 pt-[10dvh] backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex max-h-[75dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar tópico ou matéria…"
            className="flex-1 bg-transparent text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar busca"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {normalizedQuery.length < 2 ? (
            <p className="px-5 py-8 text-center text-sm font-medium text-slate-400">
              Digite pelo menos 2 caracteres para buscar.
            </p>
          ) : results.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm font-medium text-slate-400">
              Nenhum tópico encontrado para "{query}".
            </p>
          ) : (
            <div className="divide-y divide-slate-50 px-2 py-2">
              {results.map((topic) => {
                const subject = subjectById[topic.materiaId];
                const accent = corToAccent(subject?.cor ?? "");
                return (
                  <div
                    key={topic.id}
                    className="flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-950">{topic.titulo}</p>
                      {subject && (
                        <span
                          className="mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold"
                          style={{ backgroundColor: `${accent.chart}18`, color: accent.chart }}
                        >
                          {subject.nome}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => cycleStatus(topic)}
                      aria-label={`Status: ${topic.status}. Clique para alterar.`}
                      className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ring-inset transition hover:opacity-80 ${statusTone(topic.status)}`}
                    >
                      {topic.status}
                    </button>
                  </div>
                );
              })}
              {results.length === 30 && (
                <p className="px-3 py-2 text-center text-xs font-medium text-slate-400">
                  Mostrando os primeiros 30 resultados. Refine a busca para ver mais.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

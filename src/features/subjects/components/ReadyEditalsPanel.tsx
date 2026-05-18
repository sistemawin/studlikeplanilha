"use client";

import { BookOpenCheck, FileText, Sparkles } from "lucide-react";
import type { ReadyEdital } from "@/lib/readyEditals";
import { readyEditals } from "@/lib/readyEditals";

type Props = {
  onImportReadyEdital: (edital: ReadyEdital) => void;
};

export function ReadyEditalsPanel({ onImportReadyEdital }: Props) {
  return (
    <section className="mb-4 overflow-hidden rounded-2xl border border-white bg-white shadow-[0_18px_45px_rgba(15,23,42,0.07)] ring-1 ring-slate-900/5">
      <div className="border-b border-slate-100 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1877F2] text-white shadow-lg shadow-blue-600/20">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1877F2]">
              Editais prontos
            </p>
            <h3 className="mt-1 text-lg font-bold text-slate-950">Comece por um edital oficial</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Importe uma base verticalizada criada pelo StudLike a partir de fonte publica. Seus dados atuais nao sao apagados.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:p-5 xl:grid-cols-2">
        {readyEditals.map((edital) => {
          const totalTopics = edital.subjects.reduce((sum, subject) => sum + subject.topicos.length, 0);
          return (
            <article
              key={edital.id}
              className="overflow-hidden rounded-2xl border border-blue-100 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_56%,#e0f2fe_100%)] p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#1877F2] ring-1 ring-blue-100">
                      <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                      {edital.banca}
                    </span>
                    <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-bold text-white">
                      {edital.ano}
                    </span>
                  </div>
                  <h4 className="mt-3 text-base font-black text-slate-950 sm:text-lg">{edital.title}</h4>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-600">{edital.subtitle}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {edital.subjects.length} materia{edital.subjects.length !== 1 ? "s" : ""} · {totalTopics} topico{totalTopics !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onImportReadyEdital(edital)}
                  className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1877F2] px-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-[#1B74E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                >
                  <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
                  Usar edital
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

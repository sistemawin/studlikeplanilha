"use client";

import { RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f7f7f8] p-4">
      <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-xl shadow-slate-900/8">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-rose-500">Erro</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Algo deu errado</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {error.message || "Ocorreu um erro inesperado. Tente recarregar a página."}
        </p>
        {error.digest && (
          <p className="mt-1 font-mono text-xs text-slate-400">{error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-6 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Tentar novamente
        </button>
      </div>
    </main>
  );
}

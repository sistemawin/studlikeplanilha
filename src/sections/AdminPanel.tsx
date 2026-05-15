import { ArrowLeft, RefreshCw, ShieldCheck } from "lucide-react";
import type { Suggestion, SuggestionStatus } from "@/types";

type Props = {
  suggestions: Suggestion[];
  loading: boolean;
  error: string;
  onBack: () => void;
  onRefresh: () => void;
  onStatusChange: (id: string, status: SuggestionStatus) => void;
};

const STATUS_OPTIONS: SuggestionStatus[] = ["nova", "lida", "planejada", "resolvida", "arquivada"];

function statusLabel(status: SuggestionStatus) {
  const labels: Record<SuggestionStatus, string> = {
    nova: "Nova",
    lida: "Lida",
    planejada: "Planejada",
    resolvida: "Resolvida",
    arquivada: "Arquivada",
  };
  return labels[status];
}

export function AdminPanel({ suggestions, loading, error, onBack, onRefresh, onStatusChange }: Props) {
  const openCount = suggestions.filter((item) => item.status === "nova").length;

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-pink-600">Admin</p>
              <h2 className="text-xl font-semibold text-slate-950">Sugestões dos usuários</h2>
              <p className="text-sm text-slate-500">
                {suggestions.length} enviada{suggestions.length !== 1 ? "s" : ""} · {openCount} nova{openCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onRefresh}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Atualizar
            </button>
            <button
              onClick={onBack}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              App
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </p>
      )}

      <div className="grid gap-3">
        {loading ? (
          <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm font-medium text-slate-500">
            Carregando sugestões...
          </p>
        ) : suggestions.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm font-medium text-slate-500">
            Nenhuma sugestão recebida ainda.
          </p>
        ) : (
          suggestions.map((suggestion) => (
            <article key={suggestion.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                      {suggestion.categoria}
                    </span>
                    <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                      {statusLabel(suggestion.status)}
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">
                    {suggestion.mensagem}
                  </p>
                  <p className="mt-3 text-xs font-medium text-slate-400">
                    {suggestion.email} · {new Date(suggestion.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
                <label className="sr-only" htmlFor={`suggestion-status-${suggestion.id}`}>
                  Status da sugestão
                </label>
                <select
                  id={`suggestion-status-${suggestion.id}`}
                  value={suggestion.status}
                  onChange={(e) => onStatusChange(suggestion.id, e.target.value as SuggestionStatus)}
                  className="h-10 shrink-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{statusLabel(status)}</option>
                  ))}
                </select>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

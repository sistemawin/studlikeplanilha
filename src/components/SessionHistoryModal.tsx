import { Download, Trash2, X } from "lucide-react";
import { useEffect } from "react";
import type { StudySession } from "@/types";
import { formatTimer } from "@/lib/utils";

type Props = {
  sessions: StudySession[];
  onDelete: (id: string) => void;
  onClose: () => void;
};

const TYPE_LABELS: Record<string, string> = {
  topico: "Tópico",
  revisao: "Revisão",
  livre: "Livre",
};

const TYPE_STYLE: Record<string, string> = {
  topico: "bg-blue-100 text-blue-800 ring-blue-200",
  revisao: "bg-amber-100 text-amber-800 ring-amber-200",
  livre: "bg-slate-100 text-slate-700 ring-slate-200",
};

export function SessionHistoryModal({ sessions, onDelete, onClose }: Props) {
  function exportCSV() {
    const header = "Data,Tipo,Materia,Topico,Duracao (min)\n";
    const rows = sessions
      .map((s) =>
        [s.data, s.tipo, s.materiaNome ?? "", s.topicoTitulo ?? "", Math.round(s.durationSeconds / 60)]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sessoes.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-label="Histórico de sessões"
      className="fixed inset-0 z-[2147483647] flex items-end justify-center overflow-hidden bg-slate-950/45 p-0 backdrop-blur-md sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 sm:rounded-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Histórico completo</h2>
            <p className="text-xs font-medium text-slate-500">
              {sessions.length} sessão{sessions.length !== 1 ? "ões" : ""} registrada{sessions.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {sessions.length > 0 && (
              <button
                type="button"
                onClick={exportCSV}
                aria-label="Exportar sessões como CSV"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar histórico"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {sessions.length === 0 ? (
            <p className="py-10 text-center text-sm font-medium text-slate-500">
              Nenhuma sessão registrada ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-[#F7F8FA] p-3 ring-1 ring-slate-100"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${TYPE_STYLE[session.tipo] ?? "bg-slate-100 text-slate-700 ring-slate-200"}`}
                      >
                        {TYPE_LABELS[session.tipo] ?? session.tipo}
                      </span>
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {session.topicoTitulo ??
                          (session.tipo === "revisao" ? "Revisão" : "Sessão livre")}
                      </p>
                    </div>
                    <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                      {session.materiaNome ?? "Sem matéria"} · {session.data}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-lg bg-white px-2.5 py-1 font-mono text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                      {formatTimer(session.durationSeconds)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDelete(session.id)}
                      aria-label={`Excluir sessão de ${formatTimer(session.durationSeconds)}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

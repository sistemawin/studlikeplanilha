import { Archive, Loader2, LockKeyhole, X } from "lucide-react";
import { useScrollLock } from "@/hooks/useScrollLock";

type ArchiveCounts = {
  topics: number;
  reviews: number;
  goals: number;
  exams: number;
  questionLogs: number;
};

type Props = {
  open: boolean;
  counts: ArchiveCounts;
  password: string;
  loading: boolean;
  error: string;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

const archiveEffects = [
  "Remove todos os tópicos do edital atual.",
  "Remove todas as revisões agendadas.",
  "Remove metas, simulados e registros de questões.",
  "Reseta o cronograma para o padrão.",
  "Limpa a seleção de revisão manual.",
  "Não apaga sua conta nem suas matérias cadastradas.",
];

export function ArchiveEditalModal({
  open,
  counts,
  password,
  loading,
  error,
  onPasswordChange,
  onSubmit,
  onClose,
}: Props) {
  useScrollLock(open);
  if (!open) return null;

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-edital-title"
      className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-slate-950/45 p-0 backdrop-blur-md sm:items-center sm:p-4"
    >
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl shadow-slate-950/20 ring-1 ring-slate-900/5 sm:rounded-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1877F2] text-white shadow-lg shadow-blue-600/20">
              <Archive className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="archive-edital-title" className="text-lg font-semibold text-slate-950">
                Arquivar edital
              </h2>
              <p className="text-sm text-slate-500">
                Revise o que será limpo antes de confirmar.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Fechar arquivamento"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          <InfoTile label="Tópicos" value={counts.topics} />
          <InfoTile label="Revisões" value={counts.reviews} />
          <InfoTile label="Metas" value={counts.goals} />
          <InfoTile label="Simulados" value={counts.exams} />
          <InfoTile label="Questões" value={counts.questionLogs} />
        </div>

        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <p className="text-sm font-bold">O botão faz isto:</p>
          <ul className="mt-3 space-y-2 text-sm leading-5">
            {archiveEffects.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <label className="mt-5 block text-sm font-semibold text-slate-700" htmlFor="archive-password">
          Confirme sua senha
        </label>
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
          <LockKeyhole className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <input
            id="archive-password"
            type="password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && password.trim() && !loading) onSubmit();
            }}
            autoComplete="current-password"
            placeholder="Senha da sua conta"
            className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>
        {error && (
          <p role="alert" className="mt-2 text-sm font-semibold text-rose-600">
            {error}
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-11 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || !password.trim()}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1877F2] text-sm font-bold text-white hover:bg-[#1B74E4] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Archive className="h-4 w-4" aria-hidden="true" />}
            Confirmar e resetar
          </button>
        </div>
      </div>
    </section>
  );
}

function InfoTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-950">{value}</p>
    </div>
  );
}

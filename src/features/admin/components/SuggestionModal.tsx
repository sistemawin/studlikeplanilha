import { Lightbulb, Loader2, Send, X } from "lucide-react";
import { useScrollLock } from "@/hooks/useScrollLock";

type Props = {
  open: boolean;
  categoria: string;
  mensagem: string;
  loading: boolean;
  onCategoryChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

const CATEGORIES = [
  "Melhoria de design",
  "Nova funcionalidade",
  "Erro ou problema",
  "Experiência no celular",
  "Outro",
];

export function SuggestionModal({
  open,
  categoria,
  mensagem,
  loading,
  onCategoryChange,
  onMessageChange,
  onSubmit,
  onClose,
}: Props) {
  useScrollLock(open);
  if (!open) return null;

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="suggestion-title"
      className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-slate-950/45 p-0 backdrop-blur-md sm:items-center sm:p-4"
    >
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl shadow-slate-950/20 ring-1 ring-slate-900/5 sm:rounded-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1877F2] text-white shadow-lg shadow-blue-600/20">
              <Lightbulb className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="suggestion-title" className="text-lg font-semibold text-slate-950">
                Enviar sugestão
              </h2>
              <p className="text-sm text-slate-500">
                Sua ideia vai direto para a área admin.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar sugestão"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <label className="mt-5 block text-sm font-semibold text-slate-700" htmlFor="suggestion-category">
          Categoria
        </label>
        <select
          id="suggestion-category"
          value={categoria}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          {CATEGORIES.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="suggestion-message">
          Sugestão
        </label>
        <textarea
          id="suggestion-message"
          value={mensagem}
          onChange={(e) => onMessageChange(e.target.value)}
          rows={5}
          placeholder="Descreva o que você gostaria de melhorar no app..."
          className="mt-2 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            onClick={onClose}
            className="h-11 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={loading || mensagem.trim().length < 6}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1877F2] text-sm font-bold text-white hover:bg-[#1B74E4] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
            Enviar
          </button>
        </div>
      </div>
    </section>
  );
}

import { X } from "lucide-react";
import { useState } from "react";
import type { Subject } from "@/types";
import { useScrollLock } from "@/hooks/useScrollLock";

const COLOR_OPTIONS: { cor: string; label: string; dot: string }[] = [
  { cor: "bg-emerald-500", label: "Verde",      dot: "bg-emerald-500" },
  { cor: "bg-sky-500",     label: "Azul claro", dot: "bg-sky-500"     },
  { cor: "bg-blue-500",    label: "Azul",        dot: "bg-blue-500"   },
  { cor: "bg-amber-500",   label: "Âmbar",       dot: "bg-amber-500"  },
  { cor: "bg-rose-500",    label: "Rosa",         dot: "bg-rose-500"  },
  { cor: "bg-fuchsia-500", label: "Fúcsia",      dot: "bg-fuchsia-500"},
  { cor: "bg-violet-500",  label: "Violeta",     dot: "bg-violet-500" },
  { cor: "bg-orange-500",  label: "Laranja",     dot: "bg-orange-500" },
  { cor: "bg-zinc-500",    label: "Cinza",        dot: "bg-zinc-500"  },
];

type SaveData = { nome: string; peso: number; cor: string; topicos: string[] };

type Props = {
  subject?: Subject;
  onSave: (data: SaveData) => void;
  onClose: () => void;
};

export function SubjectModal({ subject, onSave, onClose }: Props) {
  useScrollLock();
  const isCreate = !subject;
  const [nome, setNome] = useState(subject?.nome ?? "");
  const [peso, setPeso] = useState(subject?.peso ?? 3);
  const [cor, setCor] = useState(subject?.cor ?? "bg-emerald-500");
  const [topicosText, setTopicosText] = useState("");
  const [error, setError] = useState("");

  function handleSave() {
    if (!nome.trim()) {
      setError("O nome da matéria é obrigatório.");
      return;
    }
    const topicos = isCreate
      ? topicosText.split("\n").map((l) => l.trim()).filter(Boolean)
      : [];
    onSave({ nome: nome.trim(), peso, cor, topicos });
  }

  return (
    <div
      className="fixed inset-0 z-[2147483647] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subject-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSave();
        }}
        className="relative z-10 flex h-[100svh] max-h-[100svh] w-full max-w-sm flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[calc(100svh-2rem)] sm:rounded-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <h2 id="subject-modal-title" className="text-lg font-semibold text-slate-950">
            {subject ? "Editar matéria" : "Nova matéria"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable body — min-h-0 is required for flex-1 to shrink correctly */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 pb-28 [-webkit-overflow-scrolling:touch]">
          <div className="space-y-6">

            {/* Nome */}
            <div>
              <label htmlFor="subject-nome" className="block text-sm font-semibold text-slate-700">
                Nome
              </label>
              <input
                id="subject-nome"
                value={nome}
                onChange={(e) => { setNome(e.target.value); setError(""); }}
                placeholder="Ex: Direito Constitucional"
                autoFocus
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Peso */}
            <div>
              <p className="text-sm font-semibold text-slate-700">Peso no edital</p>
              <div className="mt-2 grid grid-cols-5 gap-2" role="group" aria-label="Peso da matéria">
                {[1, 2, 3, 4, 5].map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPeso(p)}
                    aria-pressed={peso === p}
                    className={`h-11 rounded-xl text-sm font-semibold transition ${
                      peso === p
                        ? "bg-slate-950 text-white shadow-sm"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Cor */}
            <div>
              <p className="text-sm font-semibold text-slate-700">Cor</p>
              <div className="mt-2 flex flex-wrap gap-3" role="group" aria-label="Cor da matéria">
                {COLOR_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.cor}
                    onClick={() => setCor(option.cor)}
                    aria-label={option.label}
                    aria-pressed={cor === option.cor}
                    className={`h-10 w-10 rounded-full transition hover:scale-110 ${option.dot} ${
                      cor === option.cor ? "ring-2 ring-slate-950 ring-offset-2" : ""
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Tópicos — somente na criação */}
            {isCreate && (
              <div>
                <label htmlFor="modal-topicos" className="block text-sm font-semibold text-slate-700">
                  Tópicos{" "}
                  <span className="font-normal text-slate-400">(opcional)</span>
                </label>
                <p className="mt-0.5 text-xs text-slate-500">
                  Cole a lista — cada linha vira um tópico.
                </p>
                <textarea
                  id="modal-topicos"
                  value={topicosText}
                  onChange={(e) => setTopicosText(e.target.value)}
                  rows={5}
                  placeholder={"Organização do Estado\nAdministração Pública\nPoder Legislativo"}
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                {topicosText.trim() && (
                  <p className="mt-1 text-xs text-blue-600">
                    {topicosText.split("\n").filter((l) => l.trim()).length} tópico(s) serão adicionados
                  </p>
                )}
              </div>
            )}

            {error && (
              <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Footer — always visible */}
        <div className="sticky bottom-0 z-20 shrink-0 border-t border-slate-100 bg-white px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-10px_24px_rgba(15,23,42,0.08)]">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-11 rounded-xl bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
            >
              Salvar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

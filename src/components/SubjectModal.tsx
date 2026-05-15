import { X } from "lucide-react";
import { useState } from "react";
import type { Subject } from "@/types";

const COLOR_OPTIONS: { cor: string; label: string; dot: string }[] = [
  { cor: "bg-emerald-500", label: "Verde",    dot: "bg-emerald-500" },
  { cor: "bg-sky-500",     label: "Azul claro", dot: "bg-sky-500"  },
  { cor: "bg-blue-500",    label: "Azul",     dot: "bg-blue-500"    },
  { cor: "bg-amber-500",   label: "Âmbar",    dot: "bg-amber-500"   },
  { cor: "bg-rose-500",    label: "Rosa",     dot: "bg-rose-500"    },
  { cor: "bg-fuchsia-500", label: "Fúcsia",   dot: "bg-fuchsia-500" },
  { cor: "bg-violet-500",  label: "Violeta",  dot: "bg-violet-500"  },
  { cor: "bg-orange-500",  label: "Laranja",  dot: "bg-orange-500"  },
  { cor: "bg-zinc-500",    label: "Cinza",    dot: "bg-zinc-500"    },
];

type SaveData = { nome: string; peso: number; cor: string; topicos: string[] };

type Props = {
  subject?: Subject;
  onSave: (data: SaveData) => void;
  onClose: () => void;
};

export function SubjectModal({ subject, onSave, onClose }: Props) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subject-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 id="subject-modal-title" className="text-lg font-semibold text-slate-950">
            {subject ? "Editar matéria" : "Nova matéria"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
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
            <div className="mt-2 flex gap-2" role="group" aria-label="Peso da matéria">
              {[1, 2, 3, 4, 5].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeso(p)}
                  aria-pressed={peso === p}
                  className={`h-10 w-10 rounded-xl text-sm font-semibold transition ${
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
                  key={option.cor}
                  onClick={() => setCor(option.cor)}
                  aria-label={option.label}
                  aria-pressed={cor === option.cor}
                  className={`h-8 w-8 rounded-full transition hover:scale-110 ${option.dot} ${
                    cor === option.cor ? "ring-2 ring-slate-950 ring-offset-2" : ""
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Tópicos — só exibe na criação */}
          {isCreate && (
            <div>
              <label htmlFor="modal-topicos" className="block text-sm font-semibold text-slate-700">
                Tópicos{" "}
                <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <p className="mt-0.5 text-xs text-slate-500">Cole uma lista — cada linha vira um tópico.</p>
              <textarea
                id="modal-topicos"
                value={topicosText}
                onChange={(e) => setTopicosText(e.target.value)}
                rows={4}
                placeholder={"Organização do Estado\nAdministração Pública\nPoder Legislativo"}
                className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              {topicosText.trim() && (
                <p className="mt-1 text-xs text-blue-600">
                  {topicosText.split("\n").filter((l) => l.trim()).length} tópico(s) serão adicionados
                </p>
              )}
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm font-medium text-rose-600">
              {error}
            </p>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="h-11 flex-1 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="h-11 flex-1 rounded-xl bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

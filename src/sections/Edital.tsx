import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { Difficulty, NavTarget, Subject, Topic, TopicStatus } from "@/types";
import { ProgressBar } from "@/components/ProgressBar";
import { corToAccent, pct, statusTone } from "@/lib/utils";

type Props = {
  subjects: Subject[];
  topics: Topic[];
  newTopicText: string;
  selectedSubject: string;
  activeSection: NavTarget;
  onTopicTextChange: (value: string) => void;
  onSubjectChange: (id: string) => void;
  onStatusChange: (topicId: string, status: TopicStatus) => void;
  onDifficultyChange: (topicId: string, difficulty: Difficulty) => void;
  onAddTopics: () => void;
  onDeleteTopic: (topicId: string) => void;
  onAddSubject: () => void;
  onEditSubject: (subject: Subject) => void;
  onDeleteSubject: (subjectId: string) => void;
};

export function Edital({
  subjects,
  topics,
  newTopicText,
  selectedSubject,
  activeSection,
  onTopicTextChange,
  onSubjectChange,
  onStatusChange,
  onDifficultyChange,
  onAddTopics,
  onDeleteTopic,
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
}: Props) {
  const [search, setSearch] = useState("");

  const studiedTopics = topics.filter((t) => t.status !== "Não Estudado").length;
  const isVisible = activeSection === "edital" || activeSection === "revisoes";

  const lowerSearch = search.toLowerCase();

  return (
    <section
      className={`${isVisible ? "grid" : "hidden"} gap-5 lg:grid xl:grid-cols-[1.15fr_0.85fr]`}
    >
      <div
        id="edital"
        className={`${
          activeSection === "edital" ? "block" : "hidden"
        } scroll-mt-24 rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5 lg:block`}
      >
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Edital verticalizado</h2>
              <p className="text-sm text-slate-500">
                Tópicos por matéria com status, dificuldade e revisões automáticas.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
                {studiedTopics}/{topics.length} iniciados
              </span>
              <button
                onClick={onAddSubject}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nova matéria
              </button>
            </div>
          </div>

          {/* Search */}
          {topics.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar tópico..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Limpar busca"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
          {search && (
            <p className="text-xs text-slate-500">
              {topics.filter((t) => t.titulo.toLowerCase().includes(lowerSearch)).length} resultado{topics.filter((t) => t.titulo.toLowerCase().includes(lowerSearch)).length !== 1 ? "s" : ""} para "{search}"
            </p>
          )}
        </div>

        <div className="grid gap-4 p-4 sm:p-5">
          {subjects.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-sm font-medium text-slate-500">Nenhuma matéria cadastrada.</p>
              <button
                onClick={onAddSubject}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Adicionar matéria
              </button>
            </div>
          )}

          {subjects.map((subject) => {
            const subjectTopics = topics.filter((t) => t.materiaId === subject.id);
            const filteredTopics = search
              ? subjectTopics.filter((t) => t.titulo.toLowerCase().includes(lowerSearch))
              : subjectTopics;

            if (search && filteredTopics.length === 0) return null;

            const subjectProgress = pct(
              subjectTopics.filter((t) => t.status === "Revisado").length,
              subjectTopics.length,
            );
            const accent = corToAccent(subject.cor);

            return (
              <div key={subject.id} className={`rounded-xl border p-4 ${accent.border} ${accent.card}`}>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`h-10 w-2 rounded-full ${accent.dot}`} aria-hidden="true" />
                    <div>
                      <h3 className={`font-semibold ${accent.text}`}>{subject.nome}</h3>
                      <p className="text-xs text-slate-500">
                        Peso {subject.peso} · {subjectTopics.length} tópico{subjectTopics.length !== 1 ? "s" : ""}
                        {search && filteredTopics.length !== subjectTopics.length && (
                          <span className="ml-1 text-blue-600">({filteredTopics.length} encontrado{filteredTopics.length !== 1 ? "s" : ""})</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 sm:w-36">
                      <ProgressBar value={subjectProgress} tone={accent.progress} label={`Progresso em ${subject.nome}`} />
                    </div>
                    <button
                      onClick={() => onEditSubject(subject)}
                      aria-label={`Editar ${subject.nome}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => onDeleteSubject(subject.id)}
                      aria-label={`Excluir ${subject.nome}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredTopics.length === 0 && !search && (
                    <p className="rounded-lg bg-white/60 px-3 py-2 text-xs text-slate-400">
                      Nenhum tópico. Importe pelo painel ao lado.
                    </p>
                  )}
                  {filteredTopics.map((topic) => (
                    <div
                      key={topic.id}
                      className="grid gap-3 rounded-xl border border-white/70 bg-white/95 p-3 shadow-sm shadow-slate-900/5 md:grid-cols-[1fr_150px_140px_120px_auto]"
                    >
                      <div>
                        <p className="font-medium">{topic.titulo}</p>
                        <p className="text-xs text-slate-500">
                          {topic.estudadoEm ? `Estudado em ${topic.estudadoEm}` : "Ainda não iniciado"}
                        </p>
                      </div>

                      <label className="sr-only" htmlFor={`status-${topic.id}`}>
                        Status de {topic.titulo}
                      </label>
                      <select
                        id={`status-${topic.id}`}
                        value={topic.status}
                        onChange={(e) => onStatusChange(topic.id, e.target.value as TopicStatus)}
                        className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:h-10"
                      >
                        <option>Não Estudado</option>
                        <option>Teoria Lida</option>
                        <option>Questões Feitas</option>
                        <option>Revisado</option>
                      </select>

                      <label className="sr-only" htmlFor={`dificuldade-${topic.id}`}>
                        Dificuldade de {topic.titulo}
                      </label>
                      <select
                        id={`dificuldade-${topic.id}`}
                        value={topic.dificuldade}
                        onChange={(e) => onDifficultyChange(topic.id, e.target.value as Difficulty)}
                        className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:h-10"
                      >
                        <option>Fácil</option>
                        <option>Médio</option>
                        <option>Difícil</option>
                      </select>

                      <span
                        className={`inline-flex h-10 items-center justify-center rounded-xl px-3 text-xs font-semibold ring-1 ${statusTone(topic.status)}`}
                      >
                        {topic.status}
                      </span>

                      <button
                        onClick={() => onDeleteTopic(topic.id)}
                        aria-label={`Excluir tópico ${topic.titulo}`}
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right column */}
      <div
        className={`${
          activeSection === "edital" || activeSection === "revisoes" ? "space-y-5" : "hidden"
        } lg:block lg:space-y-5`}
      >
        <div
          className={`${
            activeSection === "edital" ? "block" : "hidden"
          } rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 sm:p-5 lg:block`}
        >
          <h2 className="text-lg font-semibold">Importar tópicos do edital</h2>
          <p className="mt-1 text-sm text-slate-500">
            Cole uma lista. Cada linha vira um tópico da matéria selecionada.
          </p>

          {subjects.length === 0 ? (
            <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
              Crie ao menos uma matéria antes de importar tópicos.
            </p>
          ) : (
            <>
              <label className="sr-only" htmlFor="subject-select">Matéria</label>
              <select
                id="subject-select"
                value={selectedSubject}
                onChange={(e) => onSubjectChange(e.target.value)}
                className="mt-4 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:h-10"
              >
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.nome}
                  </option>
                ))}
              </select>

              <label className="sr-only" htmlFor="topics-textarea">Tópicos (um por linha)</label>
              <textarea
                id="topics-textarea"
                value={newTopicText}
                onChange={(e) => onTopicTextChange(e.target.value)}
                rows={5}
                placeholder={"Organização do Estado\nAdministração Pública\nPoder Legislativo"}
                className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <button
                onClick={onAddTopics}
                className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Adicionar tópicos
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

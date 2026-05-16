"use client";

import { BookOpenCheck, ChevronLeft, FileText, Pencil, Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { Difficulty, NavTarget, Subject, Topic, TopicStatus } from "@/types";
import { corToAccent } from "@/lib/utils";
import type { ReadyEdital } from "@/lib/readyEditals";
import { readyEditals } from "@/lib/readyEditals";

const STATUS_COLORS: Record<TopicStatus, { bg: string; text: string }> = {
  "Não Estudado": { bg: "rgba(239,68,68,0.18)", text: "#fca5a5" },
  "Teoria Lida": { bg: "rgba(245,158,11,0.18)", text: "#fcd34d" },
  "Questões Feitas": { bg: "rgba(59,130,246,0.18)", text: "#93c5fd" },
  Revisado: { bg: "rgba(16,185,129,0.18)", text: "#6ee7b7" },
};

const DIFFICULTY_COLORS: Record<Difficulty, { bg: string; text: string }> = {
  Fácil: { bg: "rgba(16,185,129,0.12)", text: "#6ee7b7" },
  Médio: { bg: "rgba(245,158,11,0.12)", text: "#fcd34d" },
  Difícil: { bg: "rgba(239,68,68,0.12)", text: "#fca5a5" },
};

const STATUS_CYCLE: TopicStatus[] = ["Não Estudado", "Teoria Lida", "Questões Feitas", "Revisado"];
const DIFFICULTY_CYCLE: Difficulty[] = ["Fácil", "Médio", "Difícil"];
type StatusFilter = TopicStatus | "todos";
type DifficultyFilter = Difficulty | "todas";

type Props = {
  subjects: Subject[];
  topics: Topic[];
  newTopicText: string;
  selectedSubject: string;
  activeSection: NavTarget;
  onTopicTextChange: (text: string) => void;
  onSubjectChange: (id: string) => void;
  onStatusChange: (topicId: string, status: TopicStatus) => void;
  onDifficultyChange: (topicId: string, difficulty: Difficulty) => void;
  onAddTopics: () => void;
  onDeleteTopic: (topicId: string) => void;
  onAddSubject: () => void;
  onEditSubject: (subject: Subject) => void;
  onDeleteSubject: (subjectId: string) => void;
  onImportReadyEdital: (edital: ReadyEdital) => void;
};

function SubjectCard({
  subject,
  topics,
  onOpen,
  onEdit,
  onDelete,
}: {
  subject: Subject;
  topics: Topic[];
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const accent = corToAccent(subject.cor);
  const completedCount = topics.filter((t) => t.status === "Revisado").length;
  const progress = topics.length === 0 ? 0 : Math.round((completedCount / topics.length) * 100);

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      onClick={onOpen}
      className="relative min-h-[136px] cursor-pointer overflow-hidden rounded-2xl border border-white/20 p-4 shadow-lg shadow-blue-900/15 ring-1 ring-blue-950/5 select-none sm:p-5"
      style={{
        background: `linear-gradient(135deg, #1877F2 0%, #1B74E4 52%, ${accent.chart}78 118%)`,
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18)_0%,transparent_36%,rgba(15,23,42,0.12)_100%)]"
      />
      {/* Watermark */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-3 bottom-1 max-w-[85%] truncate text-[56px] font-black leading-none text-white select-none opacity-[0.08]"
      >
        {subject.nome}
      </span>

      <div className="relative z-10 flex min-h-[104px] min-w-0 flex-col justify-between gap-3">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <span
            className="mt-2 block h-1.5 w-10 shrink-0 rounded-full"
            style={{ backgroundColor: accent.chart }}
          />

          <div className="flex shrink-0 gap-1 rounded-2xl border border-white/15 bg-white/10 p-1 shadow-sm shadow-blue-950/10 backdrop-blur">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              aria-label={`Editar ${subject.nome}`}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/18 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              aria-label={`Excluir ${subject.nome}`}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white/80 transition hover:bg-red-500/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="min-w-0">
          <p className="overflow-hidden text-base font-bold leading-snug text-white [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
            {subject.nome}
          </p>
          <p className="mt-1 text-xs font-semibold text-blue-50/75">
            {topics.length} tópico{topics.length !== 1 ? "s" : ""}
            {topics.length > 0 && ` · ${progress}% pronto`}
          </p>
        </div>

        {topics.length > 0 && (
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/18">
            <div
              className="h-1.5 rounded-full bg-white transition-[width] duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

function EditalFilters({
  search,
  status,
  difficulty,
  resultLabel,
  onSearchChange,
  onStatusChange,
  onDifficultyChange,
  onClear,
}: {
  search: string;
  status: StatusFilter;
  difficulty: DifficultyFilter;
  resultLabel: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
  onDifficultyChange: (value: DifficultyFilter) => void;
  onClear: () => void;
}) {
  const hasFilters = Boolean(search.trim()) || status !== "todos" || difficulty !== "todas";

  return (
    <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-900/5 sm:p-4">
      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_180px_160px_auto]">
        <label className="flex h-11 min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
          <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <span className="sr-only">Buscar no edital</span>
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar matéria ou tópico"
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
          />
        </label>

        <label className="sr-only" htmlFor="edital-status-filter">Filtrar por status</label>
        <select
          id="edital-status-filter"
          value={status}
          onChange={(event) => onStatusChange(event.target.value as StatusFilter)}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="todos">Todos os status</option>
          {STATUS_CYCLE.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <label className="sr-only" htmlFor="edital-difficulty-filter">Filtrar por dificuldade</label>
        <select
          id="edital-difficulty-filter"
          value={difficulty}
          onChange={(event) => onDifficultyChange(event.target.value as DifficultyFilter)}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="todas">Todas dificuldades</option>
          {DIFFICULTY_CYCLE.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={onClear}
          disabled={!hasFilters}
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Limpar
        </button>
      </div>
      <p className="mt-3 text-xs font-semibold text-slate-500">{resultLabel}</p>
    </div>
  );
}

export function Edital({
  subjects,
  topics,
  newTopicText,
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
  onImportReadyEdital,
}: Props) {
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("todas");
  const isVisible = activeSection === "edital";
  const normalizedSearch = normalizeSearch(search);

  function openDetail(id: string) {
    setActiveSubjectId(id);
    onSubjectChange(id);
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("todos");
    setDifficultyFilter("todas");
  }

  function topicMatchesFilters(topic: Topic, subjectName: string) {
    const matchesSearch =
      !normalizedSearch ||
      normalizeSearch(topic.titulo).includes(normalizedSearch) ||
      normalizeSearch(subjectName).includes(normalizedSearch);
    const matchesStatus = statusFilter === "todos" || topic.status === statusFilter;
    const matchesDifficulty = difficultyFilter === "todas" || topic.dificuldade === difficultyFilter;
    return matchesSearch && matchesStatus && matchesDifficulty;
  }

  function subjectMatchesFilters(subject: Subject) {
    const subjectTopics = topics.filter((topic) => topic.materiaId === subject.id);
    const matchesSubjectName = !normalizedSearch || normalizeSearch(subject.nome).includes(normalizedSearch);
    const topicFiltersActive = statusFilter !== "todos" || difficultyFilter !== "todas";

    if (topicFiltersActive) {
      return subjectTopics.some((topic) => topicMatchesFilters(topic, subject.nome));
    }

    return matchesSubjectName || subjectTopics.some((topic) => topicMatchesFilters(topic, subject.nome));
  }

  const detailSubject = subjects.find((s) => s.id === activeSubjectId);
  const filteredSubjects = subjects.filter(subjectMatchesFilters);

  // ── Detail view ──────────────────────────────────────────────────────────
  if (activeSubjectId && detailSubject) {
    const subjectTopics = topics.filter((t) => t.materiaId === activeSubjectId);
    const filteredSubjectTopics = subjectTopics.filter((topic) => topicMatchesFilters(topic, detailSubject.nome));
    const accent = corToAccent(detailSubject.cor);
    const lineCount = newTopicText.split("\n").filter((l) => l.trim()).length;

    return (
      <div
        id="edital"
        className={`${isVisible ? "block" : "hidden"} scroll-mt-24 xl:block`}
      >
        {/* Breadcrumb */}
        <button
          onClick={() => setActiveSubjectId(null)}
          className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Todas as matérias
        </button>

        {/* Subject header card */}
        <div
          className="mb-5 overflow-hidden rounded-2xl p-5 shadow-lg"
          style={{
            background: `linear-gradient(135deg, #020617 0%, #0f172a 55%, ${accent.chart}22 100%)`,
          }}
        >
          <span
            className="mb-2 block h-1.5 w-10 rounded-full"
            style={{ backgroundColor: accent.chart }}
          />
          <h2 className="text-2xl font-black text-white">{detailSubject.nome}</h2>
          <p className="mt-1 text-sm text-white/40">
            {subjectTopics.length} tópico{subjectTopics.length !== 1 ? "s" : ""}
            {detailSubject.peso > 0 && ` · peso ${detailSubject.peso}`}
          </p>
        </div>

        <EditalFilters
          search={search}
          status={statusFilter}
          difficulty={difficultyFilter}
          resultLabel={`${filteredSubjectTopics.length} de ${subjectTopics.length} tópico${subjectTopics.length !== 1 ? "s" : ""} nesta matéria`}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
          onDifficultyChange={setDifficultyFilter}
          onClear={clearFilters}
        />

        {/* Topics list */}
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {subjectTopics.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm font-medium text-slate-500">
                Nenhum tópico ainda. Adicione abaixo.
              </div>
            ) : filteredSubjectTopics.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm font-medium text-slate-500">
                Nenhum tópico encontrado com os filtros atuais.
              </div>
            ) : (
              filteredSubjectTopics.map((topic) => {
                const statusStyle = STATUS_COLORS[topic.status];
                const diffStyle = DIFFICULTY_COLORS[topic.dificuldade];

                function cycleStatus() {
                  const idx = STATUS_CYCLE.indexOf(topic.status);
                  onStatusChange(topic.id, STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]);
                }

                function cycleDifficulty() {
                  const idx = DIFFICULTY_CYCLE.indexOf(topic.dificuldade);
                  onDifficultyChange(topic.id, DIFFICULTY_CYCLE[(idx + 1) % DIFFICULTY_CYCLE.length]);
                }

                return (
                  <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 30, transition: { duration: 0.18 } }}
                    className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-snug text-slate-950">{topic.titulo}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <button
                          onClick={cycleStatus}
                          className="rounded-lg px-2.5 py-0.5 text-xs font-bold transition hover:opacity-80"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                          aria-label={`Status: ${topic.status}. Clique para alterar.`}
                        >
                          {topic.status}
                        </button>
                        <button
                          onClick={cycleDifficulty}
                          className="rounded-lg px-2.5 py-0.5 text-xs font-bold transition hover:opacity-80"
                          style={{ backgroundColor: diffStyle.bg, color: diffStyle.text }}
                          aria-label={`Dificuldade: ${topic.dificuldade}. Clique para alterar.`}
                        >
                          {topic.dificuldade}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteTopic(topic.id)}
                      aria-label={`Excluir tópico ${topic.titulo}`}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Add topics form */}
        <div className="mt-5 rounded-2xl border border-white bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.07)] ring-1 ring-slate-900/5">
          <p className="mb-2 text-sm font-semibold text-slate-700">Adicionar tópicos</p>
          <textarea
            value={newTopicText}
            onChange={(e) => onTopicTextChange(e.target.value)}
            placeholder="Cole os tópicos aqui, um por linha…"
            rows={4}
            className="w-full resize-none rounded-xl border border-slate-200 bg-[#F7F8FA] p-3 text-sm text-slate-950 placeholder:text-slate-400 outline-none focus:border-[#1877F2] focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {lineCount} linha{lineCount !== 1 ? "s" : ""}
            </span>
            <button
              onClick={onAddTopics}
              disabled={!newTopicText.trim()}
              className="flex h-9 items-center gap-2 rounded-xl bg-[#1877F2] px-4 text-sm font-bold text-white transition hover:bg-[#1B74E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Adicionar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <div
      id="edital"
      className={`${isVisible ? "block" : "hidden"} scroll-mt-24 xl:block`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Edital verticalizado</h2>
          <p className="text-sm text-slate-500">
            {subjects.length === 0
              ? "Adicione matérias para começar."
              : "Clique em uma matéria para ver os tópicos."}
          </p>
        </div>
        <button
          onClick={onAddSubject}
          className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Nova matéria</span>
        </button>
      </div>

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

      <EditalFilters
        search={search}
        status={statusFilter}
        difficulty={difficultyFilter}
        resultLabel={`${filteredSubjects.length} de ${subjects.length} matéria${subjects.length !== 1 ? "s" : ""} exibida${filteredSubjects.length !== 1 ? "s" : ""}`}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        onDifficultyChange={setDifficultyFilter}
        onClear={clearFilters}
      />

      {subjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm shadow-slate-900/5">
          <p className="text-sm font-semibold text-slate-600">Nenhuma matéria cadastrada.</p>
          <p className="mt-1 text-xs text-slate-400">
            Clique em &quot;Nova matéria&quot; para começar.
          </p>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm shadow-slate-900/5">
          <p className="text-sm font-semibold text-slate-600">Nenhuma matéria encontrada.</p>
          <p className="mt-1 text-xs text-slate-400">
            Ajuste a busca ou limpe os filtros para ver todo o edital.
          </p>
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {filteredSubjects.map((subject) => {
              const subjectTopics = topics.filter((t) => t.materiaId === subject.id);
              return (
                <motion.div
                  key={subject.id}
                  layout
                  className="min-w-0"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.18 } }}
                >
                  <SubjectCard
                    subject={subject}
                    topics={subjectTopics}
                    onOpen={() => openDetail(subject.id)}
                    onEdit={() => onEditSubject(subject)}
                    onDelete={() => onDeleteSubject(subject.id)}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

import { ArrowLeft, ChevronRight, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { motion, type PanInfo } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Difficulty, NavTarget, Subject, Topic, TopicStatus } from "@/types";
import { ProgressBar } from "@/components/ProgressBar";
import { corToAccent, pct, statusTone } from "@/lib/utils";

// ── SubjectCard ─────────────────────────────────────────────────────────────
// Dark card with watermark name + horizontal swipe gesture (mobile) /
// full-card click (desktop) to open subject detail.

const SWIPE_THRESHOLD_PX = 72;
const SWIPE_VELOCITY = 450;

function SubjectCard({
  subject,
  topics,
  onOpen,
  onEdit,
  onDelete,
}: {
  subject: Subject;
  topics: Topic[];
  onOpen: (id: string) => void;
  onEdit: (subject: Subject) => void;
  onDelete: (id: string) => void;
}) {
  const accent = corToAccent(subject.cor);
  const subjectTopics = topics.filter((t) => t.materiaId === subject.id);
  const revisedCount = subjectTopics.filter((t) => t.status === "Revisado").length;
  const progress = pct(revisedCount, subjectTopics.length);

  // Prevent onClick from firing when a drag has occurred
  const didDragRef = useRef(false);

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD_PX || Math.abs(info.velocity.x) > SWIPE_VELOCITY) {
      didDragRef.current = true;
      onOpen(subject.id);
    }
  }

  function handleClick() {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    onOpen(subject.id);
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.18}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      whileTap={{ scale: 0.975 }}
      className="relative cursor-pointer select-none overflow-hidden rounded-2xl shadow-lg"
      style={{
        background: `linear-gradient(135deg, #020617 0%, #0f172a 55%, ${accent.chart}28 100%)`,
      }}
      aria-label={`Abrir matéria ${subject.nome}`}
    >
      {/* Watermark — large transparent subject name */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-1 right-2 select-none text-[64px] font-black leading-none text-white"
        style={{ opacity: 0.055 }}
      >
        {subject.nome}
      </span>

      {/* Card content */}
      <div className="relative z-10 p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${accent.dot}`} aria-hidden="true" />
            <span className="text-xs font-semibold text-white/40">Peso {subject.peso}</span>
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onEdit(subject)}
              aria-label={`Editar ${subject.nome}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:bg-white/10 hover:text-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/50"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              onClick={() => onDelete(subject.id)}
              aria-label={`Excluir ${subject.nome}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:bg-red-500/20 hover:text-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400/50"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Subject name */}
        <h3 className="mt-3 text-xl font-bold leading-tight text-white">{subject.nome}</h3>

        {/* Stats */}
        <p className="mt-1 text-sm text-white/50">
          {subjectTopics.length} tópico{subjectTopics.length !== 1 ? "s" : ""}
          {revisedCount > 0 && ` · ${revisedCount} revisado${revisedCount !== 1 ? "s" : ""}`}
        </p>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-white/35">
            <span>Progresso</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-1.5 rounded-full ${accent.progress}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Swipe hint arrow */}
      <ChevronRight
        className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/20"
        aria-hidden="true"
      />
    </motion.div>
  );
}

// ── Props ────────────────────────────────────────────────────────────────────
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
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);

  // Se a matéria ativa for excluída, volta para a lista
  useEffect(() => {
    if (activeSubjectId && !subjects.some((s) => s.id === activeSubjectId)) {
      setActiveSubjectId(null);
    }
  }, [subjects, activeSubjectId]);

  const isVisible = activeSection === "edital" || activeSection === "revisoes";
  const activeSubject = subjects.find((s) => s.id === activeSubjectId) ?? null;

  function openDetail(subjectId: string) {
    setActiveSubjectId(subjectId);
    onSubjectChange(subjectId);
    setSearch("");
  }

  function closeDetail() {
    setActiveSubjectId(null);
    setSearch("");
  }

  // ── DETAIL VIEW ────────────────────────────────────────────────────────────
  if (activeSubject && isVisible) {
    const subjectTopics = topics.filter((t) => t.materiaId === activeSubject.id);
    const lowerSearch = search.toLowerCase();
    const filteredTopics = search
      ? subjectTopics.filter((t) => t.titulo.toLowerCase().includes(lowerSearch))
      : subjectTopics;
    const progress = pct(
      subjectTopics.filter((t) => t.status === "Revisado").length,
      subjectTopics.length,
    );
    const accent = corToAccent(activeSubject.cor);
    const studiedCount = subjectTopics.filter((t) => t.status !== "Não Estudado").length;

    return (
      <div id="edital" className="scroll-mt-24 space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <button
            onClick={closeDetail}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
            aria-label="Voltar ao edital"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Edital
          </button>
          <span className="text-slate-300" aria-hidden="true">/</span>
          <span className={`h-2.5 w-2.5 rounded-full ${accent.dot}`} aria-hidden="true" />
          <span className="min-w-0 truncate font-semibold text-slate-900">{activeSubject.nome}</span>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <button
              onClick={() => onEditSubject(activeSubject)}
              aria-label={`Editar ${activeSubject.nome}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              onClick={() => { onDeleteSubject(activeSubject.id); }}
              aria-label={`Excluir ${activeSubject.nome}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Subject progress bar */}
        <div className={`rounded-xl border p-4 ${accent.border} ${accent.card}`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className={`text-sm font-semibold ${accent.text}`}>Peso {activeSubject.peso}</span>
            <span className="text-xs text-slate-500">
              {studiedCount}/{subjectTopics.length} iniciados · {progress}% revisados
            </span>
          </div>
          <ProgressBar value={progress} tone={accent.progress} label={`Progresso em ${activeSubject.nome}`} />
        </div>

        {/* Topics panel */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
          {/* Panel header with search */}
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Tópicos</h2>
              {search && (
                <span className="text-xs text-slate-500">
                  {filteredTopics.length} de {subjectTopics.length}
                </span>
              )}
            </div>
            {subjectTopics.length > 0 && (
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3 p-4 sm:p-5">
            {filteredTopics.length === 0 && subjectTopics.length === 0 && (
              <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                Nenhum tópico ainda. Importe abaixo.
              </p>
            )}
            {filteredTopics.length === 0 && subjectTopics.length > 0 && (
              <p className="text-sm text-slate-500">Nenhum resultado para &quot;{search}&quot;.</p>
            )}
            {filteredTopics.map((topic) => (
              <div
                key={topic.id}
                className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 sm:grid-cols-[1fr_150px_140px_120px_auto]"
              >
                <div>
                  <p className="font-medium text-slate-900">{topic.titulo}</p>
                  <p className="text-xs text-slate-500">
                    {topic.estudadoEm ? `Estudado em ${topic.estudadoEm}` : "Ainda não iniciado"}
                  </p>
                </div>

                <label className="sr-only" htmlFor={`status-${topic.id}`}>Status de {topic.titulo}</label>
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

                <label className="sr-only" htmlFor={`dificuldade-${topic.id}`}>Dificuldade de {topic.titulo}</label>
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

                <span className={`inline-flex h-10 items-center justify-center rounded-xl px-3 text-xs font-semibold ring-1 ${statusTone(topic.status)}`}>
                  {topic.status}
                </span>

                <button
                  onClick={() => onDeleteTopic(topic.id)}
                  aria-label={`Excluir tópico ${topic.titulo}`}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Import topics — below the list */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 sm:p-5">
          <h2 className="text-lg font-semibold">Importar tópicos</h2>
          <p className="mt-1 text-sm text-slate-500">
            Cole uma lista — cada linha vira um tópico de{" "}
            <span className={`font-semibold ${accent.text}`}>{activeSubject.nome}</span>.
          </p>
          <label className="sr-only" htmlFor="detail-topics-textarea">Tópicos (um por linha)</label>
          <textarea
            id="detail-topics-textarea"
            value={newTopicText}
            onChange={(e) => onTopicTextChange(e.target.value)}
            rows={4}
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
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  const studiedTopics = topics.filter((t) => t.status !== "Não Estudado").length;

  return (
    <div
      id="edital"
      className={`scroll-mt-24 space-y-3 ${!isVisible ? "hidden xl:block" : ""}`}
    >
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="text-lg font-semibold">Edital verticalizado</h2>
          <p className="text-sm text-slate-500">
            {studiedTopics}/{topics.length} tópicos iniciados em {subjects.length} matéria{subjects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={onAddSubject}
          className="flex h-9 w-fit items-center gap-1.5 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nova matéria
        </button>
      </div>

      {/* Empty state */}
      {subjects.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
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

      {/* Dark swipeable subject cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {subjects.map((subject) => (
          <SubjectCard
            key={subject.id}
            subject={subject}
            topics={topics}
            onOpen={openDetail}
            onEdit={onEditSubject}
            onDelete={onDeleteSubject}
          />
        ))}
      </div>
    </div>
  );
}

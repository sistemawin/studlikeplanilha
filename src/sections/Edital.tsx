"use client";

import { ChevronLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import type { Difficulty, NavTarget, Subject, Topic, TopicStatus } from "@/types";
import { corToAccent } from "@/lib/utils";

const SWIPE_THRESHOLD_PX = 72;
const SWIPE_VELOCITY = 450;

// Module-level touch detection — safe since this file is only rendered on the client
const IS_TOUCH_DEVICE =
  typeof window !== "undefined" &&
  window.matchMedia("(hover: none) and (pointer: coarse)").matches;

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
  const didDragRef = useRef(false);
  const accent = corToAccent(subject.cor);
  const completedCount = topics.filter((t) => t.status === "Revisado").length;
  const progress = topics.length === 0 ? 0 : Math.round((completedCount / topics.length) * 100);

  function handleClick() {
    if (didDragRef.current) return;
    onOpen();
  }

  return (
    <motion.div
      drag={IS_TOUCH_DEVICE ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.18}
      dragMomentum={false}
      onDragStart={() => {
        didDragRef.current = true;
      }}
      onDragEnd={(_, info) => {
        const farEnough = Math.abs(info.offset.x) > SWIPE_THRESHOLD_PX;
        const fastEnough = Math.abs(info.velocity.x) > SWIPE_VELOCITY;
        if (farEnough || fastEnough) onDelete();
        setTimeout(() => {
          didDragRef.current = false;
        }, 50);
      }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      onClick={handleClick}
      className="relative cursor-pointer overflow-hidden rounded-2xl p-5 shadow-lg select-none"
      style={{
        background: `linear-gradient(135deg, #020617 0%, #0f172a 55%, ${accent.chart}28 100%)`,
      }}
    >
      {/* Watermark */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-3 bottom-1 max-w-[85%] truncate text-[56px] font-black leading-none select-none opacity-[0.055]"
        style={{ color: accent.chart }}
      >
        {subject.nome}
      </span>

      <div className="relative z-10">
        <span
          className="mb-3 block h-1.5 w-10 rounded-full"
          style={{ backgroundColor: accent.chart }}
        />

        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-white">{subject.nome}</p>
            <p className="mt-0.5 text-xs font-medium text-white/40">
              {topics.length} tópico{topics.length !== 1 ? "s" : ""}
              {topics.length > 0 && ` · ${progress}% pronto`}
            </p>
          </div>

          <div className="flex shrink-0 gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              aria-label={`Editar ${subject.nome}`}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 hover:bg-white/10 hover:text-white/70 transition"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              aria-label={`Excluir ${subject.nome}`}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 hover:bg-red-500/20 hover:text-red-400 transition"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {topics.length > 0 && (
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-1 rounded-full transition-[width] duration-700 ease-out"
              style={{ width: `${progress}%`, backgroundColor: accent.chart }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

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
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const isVisible = activeSection === "edital";

  function openDetail(id: string) {
    setActiveSubjectId(id);
    onSubjectChange(id);
  }

  const detailSubject = subjects.find((s) => s.id === activeSubjectId);

  // ── Detail view ──────────────────────────────────────────────────────────
  if (activeSubjectId && detailSubject) {
    const subjectTopics = topics.filter((t) => t.materiaId === activeSubjectId);
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
          className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-white/40 transition hover:text-white"
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

        {/* Topics list */}
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {subjectTopics.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm font-medium text-white/30">
                Nenhum tópico ainda. Adicione abaixo.
              </div>
            ) : (
              subjectTopics.map((topic) => {
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
                    className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.04] px-4 py-3 transition hover:bg-white/[0.07]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-snug text-white">{topic.titulo}</p>
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
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/20 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400"
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
        <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <p className="mb-2 text-sm font-semibold text-white/50">Adicionar tópicos</p>
          <textarea
            value={newTopicText}
            onChange={(e) => onTopicTextChange(e.target.value)}
            placeholder="Cole os tópicos aqui, um por linha…"
            rows={4}
            className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/15"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-white/30">
              {lineCount} linha{lineCount !== 1 ? "s" : ""}
            </span>
            <button
              onClick={onAddTopics}
              disabled={!newTopicText.trim()}
              className="flex h-9 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 disabled:cursor-not-allowed disabled:opacity-40"
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
          <h2 className="text-lg font-bold text-white">Edital verticalizado</h2>
          <p className="text-sm text-white/40">
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

      {subjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-white/40">Nenhuma matéria cadastrada.</p>
          <p className="mt-1 text-xs text-white/25">
            Clique em &quot;Nova matéria&quot; para começar.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {subjects.map((subject) => {
              const subjectTopics = topics.filter((t) => t.materiaId === subject.id);
              return (
                <motion.div
                  key={subject.id}
                  layout
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

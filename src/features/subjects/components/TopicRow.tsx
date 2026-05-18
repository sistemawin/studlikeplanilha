"use client";

import { useState } from "react";
import { ArrowRightLeft, Pencil, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";
import type { Difficulty, Subject, Topic, TopicStatus } from "@/types";
import {
  DIFFICULTY_COLORS,
  DIFFICULTY_CYCLE,
  STATUS_COLORS,
  STATUS_CYCLE,
} from "./editalConstants";

type Props = {
  topic: Topic;
  subjects: Subject[];
  onStatusChange: (topicId: string, status: TopicStatus) => void;
  onDifficultyChange: (topicId: string, difficulty: Difficulty) => void;
  onEditTopic: (topicId: string, newTitle: string) => void;
  onDeleteTopic: (topicId: string) => void;
  onMoveTopic: (topicId: string, targetSubjectId: string) => void;
};

export function TopicRow({ topic, subjects, onStatusChange, onDifficultyChange, onEditTopic, onDeleteTopic, onMoveTopic }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [isMoving, setIsMoving] = useState(false);

  function startEditing() {
    setDraftTitle(topic.titulo);
    setIsEditing(true);
  }

  function saveEdit() {
    if (draftTitle.trim()) onEditTopic(topic.id, draftTitle.trim());
    setIsEditing(false);
  }

  function cycleStatus() {
    const idx = STATUS_CYCLE.indexOf(topic.status);
    onStatusChange(topic.id, STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]);
  }

  function cycleDifficulty() {
    const idx = DIFFICULTY_CYCLE.indexOf(topic.dificuldade);
    onDifficultyChange(topic.id, DIFFICULTY_CYCLE[(idx + 1) % DIFFICULTY_CYCLE.length]);
  }

  const statusStyle = STATUS_COLORS[topic.status];
  const diffStyle = DIFFICULTY_COLORS[topic.dificuldade];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 30, transition: { duration: 0.18 } }}
      className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="min-w-0 flex-1">
        {isEditing ? (
          <input
            autoFocus
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit();
              if (e.key === "Escape") setIsEditing(false);
            }}
            onBlur={saveEdit}
            className="w-full rounded-lg border border-blue-300 bg-blue-50 px-2 py-1 text-sm font-semibold text-slate-950 outline-none focus:ring-2 focus:ring-blue-200"
            aria-label="Renomear tópico"
          />
        ) : (
          <p className="text-sm font-semibold leading-snug text-slate-950">{topic.titulo}</p>
        )}
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

      <div className="flex shrink-0 items-center gap-1">
        {isMoving ? (
          <>
            <select
              autoFocus
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  onMoveTopic(topic.id, e.target.value);
                  setIsMoving(false);
                }
              }}
              className="h-9 rounded-xl border border-blue-300 bg-blue-50 px-2 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Mover para...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
            <button
              onClick={() => setIsMoving(false)}
              aria-label="Cancelar"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </>
        ) : (
          <>
            {!isEditing && subjects.length > 0 && (
              <button
                onClick={() => setIsMoving(true)}
                aria-label={`Mover tópico ${topic.titulo}`}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-violet-50 hover:text-violet-600"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
            {!isEditing && (
              <button
                onClick={startEditing}
                aria-label={`Renomear tópico ${topic.titulo}`}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
            <button
              onClick={() => onDeleteTopic(topic.id)}
              aria-label={`Excluir tópico ${topic.titulo}`}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

"use client";

import { Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import type { Subject, Topic } from "@/types";
import { corToAccent } from "@/lib/utils";

type Props = {
  subject: Subject;
  topics: Topic[];
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function SubjectCard({ subject, topics, onOpen, onEdit, onDelete }: Props) {
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

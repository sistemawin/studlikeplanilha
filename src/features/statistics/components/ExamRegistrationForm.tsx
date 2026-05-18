"use client";

import { Save, Trash2 } from "lucide-react";
import type { Exam } from "@/types";
import { pct } from "@/lib/utils";

type ExamDraft = { nome: string; acertos: number; total: number };

type Props = {
  exams: Exam[];
  examDraft: ExamDraft;
  onExamDraftChange: (draft: ExamDraft) => void;
  onAddExam: () => void;
  onDeleteExam: (examId: string) => void;
};

export function ExamRegistrationForm({ exams, examDraft, onExamDraftChange, onAddExam, onDeleteExam }: Props) {
  return (
    <div className="mt-5 min-w-0 w-full max-w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="font-semibold">Registrar simulado</p>
      <div className="mt-3 grid min-w-0 w-full max-w-full gap-2 overflow-hidden xl:grid-cols-[minmax(0,1fr)_90px_90px_auto]">
        <label className="sr-only" htmlFor="exam-nome">Nome do simulado</label>
        <input
          id="exam-nome"
          value={examDraft.nome}
          onChange={(e) => onExamDraftChange({ ...examDraft, nome: e.target.value })}
          placeholder="Nome do simulado"
          className="h-11 min-w-0 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:h-10"
        />
        <label className="sr-only" htmlFor="exam-acertos">Acertos</label>
        <input
          id="exam-acertos"
          type="number"
          min={0}
          value={examDraft.acertos}
          onChange={(e) => onExamDraftChange({ ...examDraft, acertos: Number(e.target.value) })}
          aria-label="Acertos"
          className="h-11 min-w-0 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:h-10"
        />
        <label className="sr-only" htmlFor="exam-total">Total de questões</label>
        <input
          id="exam-total"
          type="number"
          min={1}
          value={examDraft.total}
          onChange={(e) => onExamDraftChange({ ...examDraft, total: Number(e.target.value) })}
          aria-label="Total de questões"
          className="h-11 min-w-0 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:h-10"
        />
        <button
          onClick={onAddExam}
          className="flex h-11 min-w-0 items-center justify-center gap-2 rounded-xl bg-[#1877F2] px-3 text-sm font-bold text-white hover:bg-[#1B74E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 md:h-10"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          Salvar
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {exams.map((exam) => (
          <div
            key={exam.id}
            className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm shadow-slate-900/5"
          >
            <span className="min-w-0 truncate text-sm font-medium">{exam.nome}</span>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-sm font-semibold">{pct(exam.acertos, exam.total)}%</span>
              <button
                onClick={() => onDeleteExam(exam.id)}
                aria-label={`Excluir simulado ${exam.nome}`}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { ChevronRight, ListChecks, Save, Trash2 } from "lucide-react";
import type { QuestionLog, Subject, Topic } from "@/types";

type Props = {
  subjects: Subject[];
  topics: Topic[];
  questionLogs: QuestionLog[];
  onAddQuestionLog: (data: { materiaId: string; topicoId: string; quantidade: number; acertos: number | null; data: string }) => void;
  onDeleteQuestionLog: (logId: string) => void;
};

export function QuestionLogForm({ subjects, topics, questionLogs, onAddQuestionLog, onDeleteQuestionLog }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [showAllQuestionLogs, setShowAllQuestionLogs] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [questionQty, setQuestionQty] = useState("");
  const [questionHits, setQuestionHits] = useState("");
  const [questionDate, setQuestionDate] = useState(today);

  const questionTopics = topics.filter((topic) => topic.materiaId === selectedSubjectId);

  function submitQuestionLog() {
    const quantidade = Number.parseInt(questionQty, 10);
    const acertos = questionHits.trim() ? Number.parseInt(questionHits, 10) : null;

    onAddQuestionLog({
      materiaId: selectedSubjectId,
      topicoId: selectedTopicId,
      quantidade: Number.isFinite(quantidade) ? quantidade : 0,
      acertos: acertos !== null && Number.isFinite(acertos) ? acertos : null,
      data: questionDate || today,
    });

    if (
      Number.isFinite(quantidade)
      && quantidade > 0
      && (acertos === null || (Number.isFinite(acertos) && acertos >= 0 && acertos <= quantidade))
      && selectedSubjectId
      && selectedTopicId
    ) {
      setQuestionQty("");
      setQuestionHits("");
    }
  }

  return (
    <div className="mt-4 min-w-0 w-full max-w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1877F2] text-white">
          <ListChecks className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold">Registrar questões por tópico</p>
          <p className="text-sm text-slate-500">Selecione a matéria, o tópico e a quantidade feita.</p>
        </div>
      </div>

      {subjects.length === 0 || topics.length === 0 ? (
        <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
          Crie uma matéria e ao menos um tópico no edital antes de registrar questões.
        </p>
      ) : (
        <>
          <div className="mt-4 grid min-w-0 w-full max-w-full gap-2 overflow-hidden xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_110px_110px_150px_auto]">
            <label className="sr-only" htmlFor="question-subject">Matéria</label>
            <select
              id="question-subject"
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setSelectedTopicId("");
              }}
              className="h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:h-10"
            >
              <option value="">Selecione a matéria</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.nome}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="question-topic">Tópico</label>
            <select
              id="question-topic"
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:h-10"
            >
              <option value="">Selecione o tópico</option>
              {questionTopics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.titulo}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="question-qty">Quantidade</label>
            <input
              id="question-qty"
              type="number"
              inputMode="numeric"
              min={1}
              value={questionQty}
              onChange={(e) => setQuestionQty(e.target.value)}
              placeholder="Qtd."
              className="h-11 min-w-0 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:h-10"
            />

            <label className="sr-only" htmlFor="question-hits">Acertos</label>
            <input
              id="question-hits"
              type="number"
              inputMode="numeric"
              min={0}
              value={questionHits}
              onChange={(e) => setQuestionHits(e.target.value)}
              placeholder="Acertos"
              className="h-11 min-w-0 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:h-10"
            />

            <label className="sr-only" htmlFor="question-date">Data</label>
            <input
              id="question-date"
              type="date"
              value={questionDate}
              onChange={(e) => setQuestionDate(e.target.value)}
              className="h-11 min-w-0 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:h-10"
            />

            <button
              onClick={submitQuestionLog}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1877F2] px-3 text-sm font-bold text-white hover:bg-[#1B74E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 md:h-10"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              Salvar
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {(showAllQuestionLogs ? questionLogs : questionLogs.slice(0, 5)).map((log) => {
              const subject = subjects.find((item) => item.id === log.materiaId);
              const topic = topics.find((item) => item.id === log.topicoId);
              return (
                <div
                  key={log.id}
                  className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm shadow-slate-900/5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">{topic?.titulo ?? "Tópico removido"}</p>
                    <p className="truncate text-xs font-medium text-slate-500">
                      {subject?.nome ?? "Matéria removida"} · {log.quantidade} questão{log.quantidade !== 1 ? "ões" : ""}
                      {log.acertos !== null ? ` · ${log.acertos} acerto${log.acertos !== 1 ? "s" : ""}` : ""} · {log.data}
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteQuestionLog(log.id)}
                    aria-label="Excluir registro de questões"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
          {questionLogs.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllQuestionLogs((v) => !v)}
              className="mt-3 flex w-full max-w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <ChevronRight className={`h-3.5 w-3.5 transition-transform ${showAllQuestionLogs ? "rotate-90" : ""}`} aria-hidden="true" />
              {showAllQuestionLogs
                ? "Mostrar menos"
                : `Ver histórico completo (${questionLogs.length} registros)`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

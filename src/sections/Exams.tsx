import { ListChecks, Pencil, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { Exam, Goal, NavTarget, QuestionLog, Subject, Topic } from "@/types";
import { PieChart } from "@/components/PieChart";
import { ProgressBar } from "@/components/ProgressBar";
import { corToAccent, pct, topicScore } from "@/lib/utils";

type ExamDraft = { nome: string; acertos: number; total: number };

type Props = {
  subjects: Subject[];
  topics: Topic[];
  exams: Exam[];
  questionLogs: QuestionLog[];
  goals: Goal[];
  examDraft: ExamDraft;
  selectedManualTopic: string;
  manualDate: string;
  activeSection: NavTarget;
  onExamDraftChange: (draft: ExamDraft) => void;
  onAddExam: () => void;
  onDeleteExam: (examId: string) => void;
  onManualTopicChange: (id: string) => void;
  onManualDateChange: (date: string) => void;
  onAddManualReview: () => void;
  onUpdateGoalObjective: (tipo: "questões" | "horas", value: number) => void;
  onAddQuestionLog: (data: { materiaId: string; topicoId: string; quantidade: number; acertos: number | null; data: string }) => void;
  onDeleteQuestionLog: (logId: string) => void;
};

function GoalCard({
  goal,
  label,
  tone,
  onUpdateObjective,
}: {
  goal: Goal;
  label: string;
  tone: string;
  onUpdateObjective: (value: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(String(goal.valorObjetivo));

  function save() {
    const n = Number(draftValue);
    if (n > 0) onUpdateObjective(n);
    setEditing(false);
  }

  return (
    <div className={`min-w-0 rounded-xl border p-4 ${tone}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="break-words text-sm font-medium">{label}</p>
        <button
          onClick={() => { setDraftValue(String(goal.valorObjetivo)); setEditing(true); }}
          aria-label={`Editar meta de ${label}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-white/60 hover:text-slate-800"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {editing ? (
        <div className="mt-2 flex items-center gap-2">
          <label className="sr-only" htmlFor={`goal-${goal.tipo}`}>
            Nova meta de {label}
          </label>
          <input
            id={`goal-${goal.tipo}`}
            type="number"
            min={1}
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
            className="h-9 w-24 rounded-lg border border-slate-300 bg-white px-2 text-sm outline-none focus:border-blue-500"
          />
          <button onClick={save} className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1877F2] text-white hover:bg-[#1B74E4]">
            <Save className="h-4 w-4" aria-hidden="true" />
          </button>
          <button onClick={() => setEditing(false)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <p className="mt-2 text-2xl font-semibold">
          {goal.valorAtual}
          <span className="text-base font-normal text-slate-500">
            /{goal.valorObjetivo}{goal.tipo === "horas" ? "h" : ""}
          </span>
        </p>
      )}

      {!editing && (
        <ProgressBar
          value={pct(goal.valorAtual, goal.valorObjetivo)}
          tone={`bg-${tone.includes("blue") ? "blue" : "emerald"}-500`}
          label={label}
        />
      )}
    </div>
  );
}

export function Exams({
  subjects,
  topics,
  exams,
  questionLogs,
  goals,
  examDraft,
  selectedManualTopic,
  manualDate,
  activeSection,
  onExamDraftChange,
  onAddExam,
  onDeleteExam,
  onManualTopicChange,
  onManualDateChange,
  onAddManualReview,
  onUpdateGoalObjective,
  onAddQuestionLog,
  onDeleteQuestionLog,
}: Props) {
  const isVisible = activeSection === "simulados";
  const today = new Date().toISOString().slice(0, 10);
  const [questionSubjectId, setQuestionSubjectId] = useState("");
  const [questionTopicId, setQuestionTopicId] = useState("");
  const [questionQty, setQuestionQty] = useState("");
  const [questionHits, setQuestionHits] = useState("");
  const [questionDate, setQuestionDate] = useState(today);

  const hourGoal = goals.find((g) => g.tipo === "horas") ?? { id: "", tipo: "horas" as const, valorObjetivo: 0, valorAtual: 0, dataReferencia: "" };
  const questionGoal = goals.find((g) => g.tipo === "questões") ?? { id: "", tipo: "questões" as const, valorObjetivo: 0, valorAtual: 0, dataReferencia: "" };

  const avgExam =
    exams.length === 0
      ? 0
      : Math.round(exams.reduce((sum, e) => sum + (e.acertos / e.total) * 100, 0) / exams.length);

  const examTrend = exams.map((e) => ({ ...e, percent: pct(e.acertos, e.total) }));

  const subjectPerformance = subjects.map((subject) => {
    const subjectTopics = topics.filter((t) => t.materiaId === subject.id);
    const score =
      subjectTopics.length === 0
        ? 0
        : Math.round(
            subjectTopics.reduce((sum, t) => sum + topicScore(t.status, t.dificuldade), 0) /
              subjectTopics.length,
          );
    return { subject, score, accent: corToAccent(subject.cor) };
  });

  const bestSubjects = [...subjectPerformance].sort((a, b) => b.score - a.score);

  const bestTopics = topics
    .map((t) => {
      const subject = subjects.find((s) => s.id === t.materiaId);
      return { topic: t, score: topicScore(t.status, t.dificuldade), subject, accent: corToAccent(subject?.cor ?? "") };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const subjectPieSlices = subjectPerformance.map((item) => ({
    label: item.subject.nome.replace("Direito ", ""),
    value: Math.max(item.score, 1),
    color: item.accent.chart,
  }));

  const topicPieSlices = bestTopics.slice(0, 4).map((item) => ({
    label: item.topic.titulo,
    value: Math.max(item.score, 1),
    color: item.accent.chart,
  }));

  const selectedQuestionSubjectId = questionSubjectId || subjects[0]?.id || "";
  const questionTopics = topics.filter((topic) => topic.materiaId === selectedQuestionSubjectId);
  const selectedQuestionTopicId =
    questionTopicId && questionTopics.some((topic) => topic.id === questionTopicId)
      ? questionTopicId
      : questionTopics[0]?.id ?? "";

  function submitQuestionLog() {
    const quantidade = Number.parseInt(questionQty, 10);
    const acertos = questionHits.trim() ? Number.parseInt(questionHits, 10) : null;

    onAddQuestionLog({
      materiaId: selectedQuestionSubjectId,
      topicoId: selectedQuestionTopicId,
      quantidade: Number.isFinite(quantidade) ? quantidade : 0,
      acertos: acertos !== null && Number.isFinite(acertos) ? acertos : null,
      data: questionDate || today,
    });

    if (
      Number.isFinite(quantidade)
      && quantidade > 0
      && (acertos === null || (Number.isFinite(acertos) && acertos >= 0 && acertos <= quantidade))
      && selectedQuestionSubjectId
      && selectedQuestionTopicId
    ) {
      setQuestionQty("");
      setQuestionHits("");
    }
  }

  return (
    <>
      {/* Analytics charts */}
      <section className={`${isVisible ? "grid" : "hidden"} gap-6 xl:grid 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]`}>
        <PieChart
          title="Melhores matérias"
          subtitle="Ranking calculado pelo avanço dos tópicos, dificuldade e status atual."
          slices={subjectPieSlices}
          centerLabel={`${bestSubjects[0]?.score ?? 0}%`}
        />
        <PieChart
          title="Melhores tópicos"
          subtitle="Distribuição dos tópicos com maior desempenho e maior prontidão para revisão."
          slices={topicPieSlices}
          centerLabel={`${bestTopics[0]?.score ?? 0}%`}
        />
      </section>

      {/* Performance bar chart + ranking */}
      <section className={`${isVisible ? "grid" : "hidden"} gap-5 xl:grid 2xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]`}>
        {/* Bar chart */}
        <div className="w-full max-w-full overflow-hidden rounded-2xl border border-white bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/5 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-400">Acertos</p>
              <h2 className="mt-1 break-words text-xl font-bold text-slate-950">Desempenho em simulados</h2>
              <p className="mt-1 break-words text-sm leading-6 text-slate-500">
                Evolução dos percentuais de acerto registrados.
              </p>
            </div>
            <span className="w-fit shrink-0 rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-[#1877F2] ring-1 ring-blue-100">
              média {Number.isFinite(avgExam) ? avgExam : 0}%
            </span>
          </div>

          <div
            role="img"
            aria-label="Gráfico de barras de desempenho em simulados"
            className="mt-6 flex h-48 max-w-full items-end gap-2 overflow-hidden rounded-xl bg-[#F0F2F5] px-3 py-5 sm:h-52 sm:gap-3 sm:px-4"
          >
            {examTrend.length === 0 ? (
              <p className="self-center text-sm font-medium text-slate-500">Nenhum simulado registrado.</p>
            ) : (
              examTrend.map((exam) => (
                <div key={exam.id} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div className="flex h-36 w-full items-end rounded-lg bg-white shadow-inner">
                    <div
                      className="w-full rounded-lg bg-gradient-to-t from-blue-600 to-cyan-400 transition-[height] duration-500"
                      style={{ height: `${Math.max(exam.percent, 4)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-950">{exam.percent}%</span>
                  <span className="max-w-full truncate text-xs font-medium text-slate-500">{exam.nome}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ranking */}
        <div className="w-full max-w-full overflow-hidden rounded-2xl border border-white bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/5 sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1877F2]">Ranking</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Top matérias e tópicos</h2>
          <div className="mt-5 space-y-4">
            {bestSubjects.slice(0, 3).map((item, index) => (
              <div key={item.subject.id} className="min-w-0">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="min-w-0 break-words text-sm font-semibold leading-5 text-slate-700">
                    {index + 1}. {item.subject.nome}
                  </span>
                  <span className="shrink-0 text-sm font-bold text-slate-950">{item.score}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-1.5 rounded-full transition-[width] duration-500"
                    style={{ width: `${item.score}%`, backgroundColor: item.accent.chart }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-3">
            {bestTopics.slice(0, 3).map((item) => (
              <div
                key={item.topic.id}
                className="min-w-0 overflow-hidden rounded-xl border border-slate-100 p-3"
                style={{ background: `linear-gradient(135deg, #ffffff 0%, ${item.accent.chart}12 100%)` }}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 break-words text-sm font-bold leading-5 text-slate-950">{item.topic.titulo}</p>
                  <span className="shrink-0 text-sm font-bold" style={{ color: item.accent.chart }}>{item.score}%</span>
                </div>
                <p className="mt-1 break-words text-xs font-medium leading-5 text-slate-500">
                  {item.subject?.nome ?? "Sem matéria"} · {item.topic.status}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Goals + exam form + manual review */}
      <div
        id="simulados"
        className={`${
          isVisible ? "block" : "hidden"
        } w-full max-w-full overflow-hidden scroll-mt-24 rounded-2xl border border-white bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.07)] ring-1 ring-slate-900/5 sm:p-5 xl:block`}
      >
        <h2 className="break-words text-lg font-semibold">Questões, metas, simulados e revisão manual</h2>

        {/* Question registration */}
        <div className="mt-4 min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1877F2] text-white">
              <ListChecks className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
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
              <div className="mt-4 grid min-w-0 gap-2 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_110px_110px_150px_auto]">
                <label className="sr-only" htmlFor="question-subject">Matéria</label>
                <select
                  id="question-subject"
                  value={selectedQuestionSubjectId}
                  onChange={(e) => {
                    setQuestionSubjectId(e.target.value);
                    setQuestionTopicId("");
                  }}
                  className="h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:h-10"
                >
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.nome}
                    </option>
                  ))}
                </select>

                <label className="sr-only" htmlFor="question-topic">Tópico</label>
                <select
                  id="question-topic"
                  value={selectedQuestionTopicId}
                  onChange={(e) => setQuestionTopicId(e.target.value)}
                  className="h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:h-10"
                >
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
                {questionLogs.slice(0, 5).map((log) => {
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
            </>
          )}
        </div>

        {/* Editable goal cards */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <GoalCard
            goal={hourGoal}
            label="Horas estudadas"
            tone="border-blue-200 bg-blue-50 text-blue-800"
            onUpdateObjective={(v) => onUpdateGoalObjective("horas", v)}
          />
          <GoalCard
            goal={questionGoal}
            label="Questões diárias"
            tone="border-emerald-200 bg-emerald-50 text-emerald-800"
            onUpdateObjective={(v) => onUpdateGoalObjective("questões", v)}
          />
        </div>

        {/* Exam registration */}
        <div className="mt-5 min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="font-semibold">Registrar simulado</p>
          <div className="mt-3 grid min-w-0 gap-2 xl:grid-cols-[minmax(0,1fr)_90px_90px_auto]">
            <label className="sr-only" htmlFor="exam-nome">Nome do simulado</label>
            <input
              id="exam-nome"
              value={examDraft.nome}
              onChange={(e) => onExamDraftChange({ ...examDraft, nome: e.target.value })}
              placeholder="Nome do simulado"
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:h-10"
            />
            <label className="sr-only" htmlFor="exam-acertos">Acertos</label>
            <input
              id="exam-acertos"
              type="number"
              min={0}
              value={examDraft.acertos}
              onChange={(e) => onExamDraftChange({ ...examDraft, acertos: Number(e.target.value) })}
              aria-label="Acertos"
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:h-10"
            />
            <label className="sr-only" htmlFor="exam-total">Total de questões</label>
            <input
              id="exam-total"
              type="number"
              min={1}
              value={examDraft.total}
              onChange={(e) => onExamDraftChange({ ...examDraft, total: Number(e.target.value) })}
              aria-label="Total de questões"
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:h-10"
            />
            <button
              onClick={onAddExam}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1877F2] px-3 text-sm font-bold text-white hover:bg-[#1B74E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 md:h-10"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              Salvar
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm shadow-slate-900/5"
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

        {/* Manual review */}
        <div className="mt-5 min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-blue-50/50 p-4">
          <p className="font-semibold">Revisão manual</p>
          <div className="mt-3 grid min-w-0 max-w-full gap-2 overflow-hidden xl:grid-cols-[minmax(0,1fr)_150px_auto]">
            <label className="sr-only" htmlFor="manual-topic">Tópico para revisão</label>
            <select
              id="manual-topic"
              value={selectedManualTopic}
              onChange={(e) => onManualTopicChange(e.target.value)}
              className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:h-10"
            >
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.titulo}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="manual-date">Data da revisão</label>
            <input
              id="manual-date"
              type="date"
              value={manualDate}
              onChange={(e) => onManualDateChange(e.target.value)}
              className="h-11 w-full min-w-0 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:h-10"
            />

            <button
              onClick={onAddManualReview}
              className="h-11 w-full min-w-0 rounded-xl bg-[#1877F2] px-3 text-sm font-bold text-white hover:bg-[#1B74E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 md:h-10"
            >
              Agendar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

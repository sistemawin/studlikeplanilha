import type { Exam, Goal, NavTarget, QuestionLog, Review, StudySession, Subject, Topic } from "@/types";
import { addDays, corToAccent, isoDate, pct, topicScore } from "@/lib/utils";
import { GoalCard } from "./GoalCard";
import { QuestionLogForm } from "./QuestionLogForm";
import { ExamRegistrationForm } from "./ExamRegistrationForm";
import { StatisticsCharts } from "./StatisticsCharts";

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
  reviews: Review[];
  todayIso: string;
  studySessions: StudySession[];
  onDifficultyChange: (topicId: string, difficulty: import("@/types").Difficulty) => void;
};


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
  reviews,
  todayIso,
  studySessions,
  onDifficultyChange,
}: Props) {
  const isVisible = activeSection === "simulados";

  const hourGoal = goals.find((g) => g.tipo === "horas") ?? { id: "", tipo: "horas" as const, valorObjetivo: 0, valorAtual: 0, dataReferencia: "" };
  const questionGoal = goals.find((g) => g.tipo === "questões") ?? { id: "", tipo: "questões" as const, valorObjetivo: 0, valorAtual: 0, dataReferencia: "" };

  const avgExam =
    exams.length === 0
      ? 0
      : Math.round(exams.reduce((sum, e) => sum + (e.acertos / e.total) * 100, 0) / exams.length);

  const logsWithAccuracy = questionLogs.filter((q) => q.acertos !== null && q.quantidade > 0);
  const avgQuestionAccuracy =
    logsWithAccuracy.length === 0
      ? 0
      : Math.round(
          logsWithAccuracy.reduce((sum, q) => sum + (q.acertos! / q.quantidade) * 100, 0) / logsWithAccuracy.length,
        );

  const avgSessionMinutes =
    studySessions.length === 0
      ? 0
      : Math.round(studySessions.reduce((sum, s) => sum + s.durationSeconds, 0) / studySessions.length / 60);

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
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const hasStudyData = subjectPerformance.some((item) => item.score > 0);

  const subjectPieSlices = subjectPerformance
    .filter((item) => item.score > 0)
    .map((item) => ({
      label: item.subject.nome.replace("Direito ", ""),
      value: item.score,
      color: item.accent.chart,
    }));

  const topicPieSlices = bestTopics.slice(0, 4).map((item) => ({
    label: item.topic.titulo,
    value: item.score,
    color: item.accent.chart,
  }));

  // ── Diagnosis ──────────────────────────────────────────────────────────────
  const notStudiedGaps = hasStudyData
    ? topics
        .filter((t) => t.status === "Não Estudado")
        .map((t) => ({ topic: t, subject: subjects.find((s) => s.id === t.materiaId) }))
        .filter((item) => item.subject)
        .sort((a, b) => (b.subject!.peso - a.subject!.peso) || a.topic.titulo.localeCompare(b.topic.titulo))
        .slice(0, 4)
    : [];

  const accuracyByTopic = new Map<string, { acertos: number; quantidade: number }>();
  for (const log of questionLogs) {
    const prev = accuracyByTopic.get(log.topicoId) ?? { acertos: 0, quantidade: 0 };
    accuracyByTopic.set(log.topicoId, {
      acertos: prev.acertos + (log.acertos ?? 0),
      quantidade: prev.quantidade + log.quantidade,
    });
  }
  const lowAccuracyGaps = [...accuracyByTopic.entries()]
    .map(([topicoId, stats]) => ({
      topic: topics.find((t) => t.id === topicoId),
      subject: subjects.find((s) => s.id === topics.find((t) => t.id === topicoId)?.materiaId),
      accuracy: stats.quantidade > 0 ? stats.acertos / stats.quantidade : 0,
      quantidade: stats.quantidade,
    }))
    .filter((item) => item.topic && item.quantidade >= 5 && item.accuracy < 0.6)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 4);

  const overdueByTopic = new Map<string, number>();
  for (const review of reviews) {
    if (!review.concluida && review.dataAgendada < todayIso) {
      const days = Math.floor(
        (new Date(todayIso).getTime() - new Date(review.dataAgendada).getTime()) / (1000 * 60 * 60 * 24),
      );
      overdueByTopic.set(review.topicoId, Math.max(overdueByTopic.get(review.topicoId) ?? 0, days));
    }
  }
  const overdueGaps = [...overdueByTopic.entries()]
    .map(([topicoId, days]) => ({
      topic: topics.find((t) => t.id === topicoId),
      subject: subjects.find((s) => s.id === topics.find((t) => t.id === topicoId)?.materiaId),
      days,
    }))
    .filter((item) => item.topic)
    .sort((a, b) => b.days - a.days)
    .slice(0, 4);

  const hasAnyGap = notStudiedGaps.length > 0 || lowAccuracyGaps.length > 0 || overdueGaps.length > 0;
  const showDiagnosis = topics.length > 0 && subjects.length > 0;

  // ── Temporal charts ────────────────────────────────────────────────────────
  const examsByDate = [...exams]
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(-12)
    .map((e) => ({ ...e, percent: pct(e.acertos, e.total) }));

  const weeklyHoursData = Array.from({ length: 8 }, (_, i) => {
    const endDate = new Date(todayIso + "T12:00:00");
    endDate.setDate(endDate.getDate() - i * 7);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6);
    const startIso = isoDate(startDate);
    const endIso = isoDate(endDate);
    const secs = studySessions
      .filter((s) => s.data >= startIso && s.data <= endIso)
      .reduce((sum, s) => sum + s.durationSeconds, 0);
    return {
      label: `${startDate.getDate()}/${startDate.getMonth() + 1}`,
      hours: Math.round((secs / 3600) * 10) / 10,
    };
  }).reverse();

  const maxWeeklyHours = Math.max(...weeklyHoursData.map((w) => w.hours), 0.1);

  // ── Time distribution by subject ───────────────────────────────────────────
  const timeBySubjectMap = new Map<string, { nome: string; cor: string; seconds: number }>();
  for (const session of studySessions) {
    if (!session.materiaId || !session.materiaNome) continue;
    const subject = subjects.find((s) => s.id === session.materiaId);
    const prev = timeBySubjectMap.get(session.materiaId) ?? { nome: session.materiaNome, cor: subject?.cor ?? "", seconds: 0 };
    timeBySubjectMap.set(session.materiaId, { ...prev, seconds: prev.seconds + session.durationSeconds });
  }
  const timeBySubjectData = [...timeBySubjectMap.values()].sort((a, b) => b.seconds - a.seconds);
  const timePieSlices = timeBySubjectData.map((item) => ({
    label: item.nome.replace("Direito ", ""),
    value: Math.round((item.seconds / 3600) * 10) / 10,
    color: corToAccent(item.cor).chart,
  }));
  const totalStudyHours = Math.round((studySessions.reduce((sum, s) => sum + s.durationSeconds, 0) / 3600) * 10) / 10;

  // ── Weekly progress ────────────────────────────────────────────────────────
  const weekStart = (() => {
    const d = new Date(todayIso + "T12:00:00");
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return isoDate(d);
  })();
  const weeklySeconds = studySessions
    .filter((s) => s.data >= weekStart && s.data <= todayIso)
    .reduce((sum, s) => sum + s.durationSeconds, 0);
  const weeklyHours = Math.round((weeklySeconds / 3600) * 10) / 10;
  const weeklyHoursTarget = hourGoal.valorObjetivo * 5;
  const weeklyQuestions = questionLogs
    .filter((q) => q.data >= weekStart && q.data <= todayIso)
    .reduce((sum, q) => sum + q.quantidade, 0);
  const weeklyQuestionsTarget = questionGoal.valorObjetivo * 5;

  const lastWeekStart = addDays(new Date(weekStart + "T12:00:00"), -7);
  const lastWeekEnd = addDays(new Date(weekStart + "T12:00:00"), -1);
  const lastWeekSeconds = studySessions
    .filter((s) => s.data >= lastWeekStart && s.data <= lastWeekEnd)
    .reduce((sum, s) => sum + s.durationSeconds, 0);
  const lastWeekQuestions = questionLogs
    .filter((q) => q.data >= lastWeekStart && q.data <= lastWeekEnd)
    .reduce((sum, q) => sum + q.quantidade, 0);
  const hoursVsLastWeek =
    lastWeekSeconds > 0
      ? Math.round(((weeklySeconds - lastWeekSeconds) / lastWeekSeconds) * 100)
      : null;
  const questionsVsLastWeek =
    lastWeekQuestions > 0
      ? Math.round(((weeklyQuestions - lastWeekQuestions) / lastWeekQuestions) * 100)
      : null;

  // ── Day-of-week distribution ───────────────────────────────────────────────
  const hoursPerWeekday = Array(7).fill(0) as number[];
  for (const session of studySessions) {
    const dayIndex = (new Date(session.data + "T12:00:00").getDay() + 6) % 7;
    hoursPerWeekday[dayIndex] += session.durationSeconds / 3600;
  }
  const maxWeekdayHours = Math.max(...hoursPerWeekday, 0.1);

  // ── Activity heatmap (last 12 weeks, Mon-aligned) ──────────────────────────
  const heatmapMinutesByDate = new Map<string, number>();
  for (const session of studySessions) {
    heatmapMinutesByDate.set(session.data, (heatmapMinutesByDate.get(session.data) ?? 0) + session.durationSeconds / 60);
  }
  const heatmapStart = (() => {
    const d = new Date(todayIso + "T12:00:00");
    const dayOfWeek = (d.getDay() + 6) % 7; // 0=Mon…6=Sun
    d.setDate(d.getDate() - dayOfWeek - 7 * 11);
    return d;
  })();
  const heatmapDays: string[] = [];
  const heatCursor = new Date(heatmapStart);
  while (isoDate(heatCursor) <= todayIso) {
    heatmapDays.push(isoDate(heatCursor));
    heatCursor.setDate(heatCursor.getDate() + 1);
  }

  const chartsData = {
    subjectPieSlices,
    topicPieSlices,
    timePieSlices,
    totalStudyHours,
    examsByDate,
    examTrend,
    weeklyHoursData,
    maxWeeklyHours,
    hoursPerWeekday,
    maxWeekdayHours,
    heatmapDays,
    heatmapMinutesByDate,
    avgExam,
    avgQuestionAccuracy,
    avgSessionMinutes,
    hasStudyData,
  };

  const diagnosisData = {
    show: showDiagnosis,
    hasAnyGap,
    bestSubjects,
    bestTopics,
    notStudiedGaps,
    lowAccuracyGaps,
    overdueGaps,
  };

  return (
    <div
      id="simulados"
      className={`${
        isVisible ? "grid" : "hidden"
      } min-w-0 w-full max-w-full gap-4 overflow-x-hidden scroll-mt-24 pb-[calc(5.75rem+env(safe-area-inset-bottom))] sm:gap-5 xl:grid xl:pb-0`}
    >
      <StatisticsCharts
        isVisible={isVisible}
        todayIso={todayIso}
        hasSessions={studySessions.length > 0}
        charts={chartsData}
        diagnosis={diagnosisData}
        onDifficultyChange={onDifficultyChange}
      />

      {/* Goals + exam form + manual review */}
      <div
        className={`${
          isVisible ? "block" : "hidden"
        } min-w-0 w-full max-w-full overflow-hidden rounded-2xl border border-white bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.07)] ring-1 ring-slate-900/5 sm:p-5 xl:block`}
      >
        <h2 className="break-words text-lg font-semibold">Questões, metas, simulados e revisão manual</h2>

        <QuestionLogForm
          subjects={subjects}
          topics={topics}
          questionLogs={questionLogs}
          onAddQuestionLog={onAddQuestionLog}
          onDeleteQuestionLog={onDeleteQuestionLog}
        />

        {/* Editable goal cards */}
        <div className="mt-4 grid min-w-0 w-full max-w-full gap-4 overflow-hidden sm:grid-cols-2">
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

        {/* Weekly progress */}
        {(weeklyHoursTarget > 0 || weeklyQuestionsTarget > 0) && (
        <div className="mt-4 grid min-w-0 w-full max-w-full gap-3 overflow-hidden sm:grid-cols-2">
            {weeklyHoursTarget > 0 && (
              <div className="min-w-0 w-full max-w-full overflow-hidden rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-500">Horas esta semana</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className="text-2xl font-black text-blue-700">{weeklyHours}h</p>
                  {hoursVsLastWeek !== null && (
                    <span className={`text-[10px] font-bold ${hoursVsLastWeek >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                      {hoursVsLastWeek >= 0 ? "+" : ""}{hoursVsLastWeek}% vs ant.
                    </span>
                  )}
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-100">
                  <div
                    className="h-1.5 rounded-full bg-blue-500 transition-[width] duration-500"
                    style={{ width: `${Math.min((weeklyHours / weeklyHoursTarget) * 100, 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] font-medium text-blue-500">meta {weeklyHoursTarget}h</p>
              </div>
            )}
            {weeklyQuestionsTarget > 0 && (
              <div className="min-w-0 w-full max-w-full overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-500">Questões esta semana</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className="text-2xl font-black text-emerald-700">{weeklyQuestions}</p>
                  {questionsVsLastWeek !== null && (
                    <span className={`text-[10px] font-bold ${questionsVsLastWeek >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                      {questionsVsLastWeek >= 0 ? "+" : ""}{questionsVsLastWeek}% vs ant.
                    </span>
                  )}
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-emerald-100">
                  <div
                    className="h-1.5 rounded-full bg-emerald-500 transition-[width] duration-500"
                    style={{ width: `${Math.min((weeklyQuestions / weeklyQuestionsTarget) * 100, 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] font-medium text-emerald-500">meta {weeklyQuestionsTarget} questões</p>
              </div>
            )}
          </div>
        )}

        <ExamRegistrationForm
          exams={exams}
          examDraft={examDraft}
          onExamDraftChange={onExamDraftChange}
          onAddExam={onAddExam}
          onDeleteExam={onDeleteExam}
        />

        {/* Manual review */}
        <div className="mt-5 min-w-0 w-full max-w-full overflow-hidden rounded-xl border border-slate-200 bg-blue-50/50 p-4">
          <p className="font-semibold">Revisão manual</p>
          <div className="mt-3 grid min-w-0 w-full max-w-full gap-2 overflow-hidden xl:grid-cols-[minmax(0,1fr)_150px_auto]">
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
    </div>
  );
}

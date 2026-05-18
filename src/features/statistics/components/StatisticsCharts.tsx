"use client";

import { AlertCircle, BarChart3 as BarChart3Icon, CheckCircle2, Clock, Timer, TrendingUp } from "lucide-react";
import type { ChartSlice, Difficulty, Exam, Subject, SubjectAccent, Topic } from "@/types";
import { PieChart } from "@/components/charts/PieChart";

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function heatColor(minutes: number) {
  if (minutes === 0) return "bg-slate-100";
  if (minutes < 30) return "bg-blue-200";
  if (minutes < 90) return "bg-blue-400";
  return "bg-[#1877F2]";
}

type ExamDataPoint = Exam & { percent: number };

type ChartSet = {
  subjectPieSlices: ChartSlice[];
  topicPieSlices: ChartSlice[];
  timePieSlices: ChartSlice[];
  totalStudyHours: number;
  examsByDate: ExamDataPoint[];
  examTrend: ExamDataPoint[];
  weeklyHoursData: { label: string; hours: number }[];
  maxWeeklyHours: number;
  hoursPerWeekday: number[];
  maxWeekdayHours: number;
  heatmapDays: string[];
  heatmapMinutesByDate: Map<string, number>;
  avgExam: number;
  avgQuestionAccuracy: number;
  avgSessionMinutes: number;
  hasStudyData: boolean;
};

type DiagnosisSet = {
  show: boolean;
  hasAnyGap: boolean;
  bestSubjects: { subject: Subject; score: number; accent: SubjectAccent }[];
  bestTopics: { topic: Topic; score: number; subject: Subject | undefined; accent: SubjectAccent }[];
  notStudiedGaps: { topic: Topic; subject: Subject | undefined }[];
  lowAccuracyGaps: { topic: Topic | undefined; subject: Subject | undefined; accuracy: number; quantidade: number }[];
  overdueGaps: { topic: Topic | undefined; subject: Subject | undefined; days: number }[];
};

type Props = {
  isVisible: boolean;
  todayIso: string;
  hasSessions: boolean;
  charts: ChartSet;
  diagnosis: DiagnosisSet;
  onDifficultyChange: (topicId: string, difficulty: Difficulty) => void;
};

export function StatisticsCharts({ isVisible, todayIso, hasSessions, charts, diagnosis, onDifficultyChange }: Props) {
  const {
    subjectPieSlices, topicPieSlices, timePieSlices, totalStudyHours,
    examsByDate, examTrend, weeklyHoursData, maxWeeklyHours,
    hoursPerWeekday, maxWeekdayHours, heatmapDays, heatmapMinutesByDate,
    avgExam, avgQuestionAccuracy, avgSessionMinutes, hasStudyData,
  } = charts;
  const { show: showDiagnosis, hasAnyGap, bestSubjects, bestTopics, notStudiedGaps, lowAccuracyGaps, overdueGaps } = diagnosis;

  return (
    <>
      {/* Analytics charts */}
      <section className={`${isVisible ? "grid" : "hidden"} min-w-0 w-full max-w-full gap-4 overflow-hidden sm:gap-6 xl:grid 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]`}>
        {hasStudyData ? (
          <>
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
          </>
        ) : (
          <div className="2xl:col-span-2 flex min-w-0 w-full max-w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-white bg-white p-10 text-center shadow-[0_18px_45px_rgba(15,23,42,0.07)] ring-1 ring-slate-900/5">
            <BarChart3Icon className="h-8 w-8 text-slate-300" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-500">Nenhum dado para exibir ainda.</p>
            <p className="text-sm text-slate-400">Estude tópicos do edital para ver suas estatísticas aqui.</p>
          </div>
        )}
      </section>

      {/* Diagnosis */}
      {showDiagnosis && (
        <section className={`${isVisible ? "block" : "hidden"} min-w-0 w-full max-w-full overflow-hidden xl:block`}>
          <div className="min-w-0 w-full max-w-full overflow-hidden rounded-2xl border border-white bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/5 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose-400">Diagnóstico</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">Lacunas e pontos fracos</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  O que exige atenção agora com base no seu progresso.
                </p>
              </div>
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" aria-hidden="true" />
            </div>

            {!hasAnyGap ? (
              <div className="mt-5 flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-4 ring-1 ring-emerald-100">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                <p className="text-sm font-semibold text-emerald-700">
                  Nenhuma lacuna detectada. Continue assim!
                </p>
              </div>
            ) : (
              <div className="mt-5 grid min-w-0 w-full max-w-full gap-4 overflow-hidden lg:grid-cols-3">
                {/* Not studied gaps */}
                <div className="min-w-0 w-full max-w-full overflow-hidden rounded-xl border border-rose-100 bg-rose-50/50 p-3">
                  <p className="mb-2 max-w-full break-words text-xs font-bold uppercase leading-5 tracking-[0.08em] text-rose-500">
                    Não estudados (prioridade alta)
                  </p>
                  {notStudiedGaps.length === 0 ? (
                    <p className="text-xs font-medium text-slate-400">Nenhum pendente.</p>
                  ) : (
                    <div className="min-w-0 w-full max-w-full space-y-2 overflow-hidden">
                      {notStudiedGaps.map((item) => (
                        <div key={item.topic.id} className="min-w-0 w-full max-w-full overflow-hidden rounded-lg bg-white p-2.5 ring-1 ring-rose-100">
                          <p className="max-w-full truncate text-xs font-semibold text-slate-950">{item.topic.titulo}</p>
                          <p className="mt-0.5 max-w-full truncate text-[11px] font-medium text-slate-500">
                            {item.subject!.nome} · peso {item.subject!.peso}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Low accuracy gaps */}
                <div className="min-w-0 w-full max-w-full overflow-hidden rounded-xl border border-amber-100 bg-amber-50/50 p-3">
                  <p className="mb-2 max-w-full break-words text-xs font-bold uppercase leading-5 tracking-[0.08em] text-amber-600">
                    Baixo aproveitamento em questões
                  </p>
                  {lowAccuracyGaps.length === 0 ? (
                    <p className="text-xs font-medium text-slate-400">Nenhum abaixo de 60%.</p>
                  ) : (
                    <div className="min-w-0 w-full max-w-full space-y-2 overflow-hidden">
                      {lowAccuracyGaps.map((item) => (
                        <div key={item.topic!.id} className="min-w-0 w-full max-w-full overflow-hidden rounded-lg bg-white p-2.5 ring-1 ring-amber-100">
                          <div className="flex min-w-0 w-full max-w-full items-center justify-between gap-2 overflow-hidden">
                            <p className="min-w-0 max-w-full truncate text-xs font-semibold text-slate-950">{item.topic!.titulo}</p>
                            <span className="shrink-0 text-xs font-bold text-amber-600">
                              {Math.round(item.accuracy * 100)}%
                            </span>
                          </div>
                          <div className="mt-1.5 flex min-w-0 w-full max-w-full items-center justify-between gap-2 overflow-hidden">
                            <p className="min-w-0 max-w-full truncate text-[11px] font-medium text-slate-500">
                              {item.subject?.nome ?? "—"} · {item.quantidade} questões
                            </p>
                            {item.topic!.dificuldade !== "Difícil" && (
                              <button
                                type="button"
                                onClick={() => onDifficultyChange(item.topic!.id, "Difícil")}
                                className="shrink-0 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 hover:bg-amber-100"
                              >
                                → Difícil
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Overdue gaps */}
                <div className="min-w-0 w-full max-w-full overflow-hidden rounded-xl border border-orange-100 bg-orange-50/50 p-3">
                  <p className="mb-2 flex max-w-full items-center gap-1.5 break-words text-xs font-bold uppercase leading-5 tracking-[0.08em] text-orange-500">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    Revisões em atraso
                  </p>
                  {overdueGaps.length === 0 ? (
                    <p className="text-xs font-medium text-slate-400">Nenhuma em atraso.</p>
                  ) : (
                    <div className="min-w-0 w-full max-w-full space-y-2 overflow-hidden">
                      {overdueGaps.map((item) => (
                        <div key={item.topic!.id} className="min-w-0 w-full max-w-full overflow-hidden rounded-lg bg-white p-2.5 ring-1 ring-orange-100">
                          <div className="flex min-w-0 w-full max-w-full items-center justify-between gap-2 overflow-hidden">
                            <p className="min-w-0 max-w-full truncate text-xs font-semibold text-slate-950">{item.topic!.titulo}</p>
                            <span className="shrink-0 text-xs font-bold text-orange-500">
                              {item.days}d
                            </span>
                          </div>
                          <p className="mt-0.5 max-w-full truncate text-[11px] font-medium text-slate-500">
                            {item.subject?.nome ?? "—"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Temporal evolution charts */}
      <section className={`${isVisible ? "grid" : "hidden"} min-w-0 w-full max-w-full gap-4 overflow-hidden sm:gap-6 xl:grid 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]`}>
        {/* Simulados ao longo do tempo */}
        <div className="min-w-0 w-full max-w-full overflow-hidden rounded-2xl border border-white bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/5 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-400">Evolução</p>
              <h2 className="mt-1 break-words text-xl font-bold text-slate-950">Simulados ao longo do tempo</h2>
              <p className="mt-1 break-words text-sm leading-6 text-slate-500">Percentual de acerto por simulado em ordem cronológica.</p>
            </div>
            <TrendingUp className="h-5 w-5 shrink-0 text-blue-500" aria-hidden="true" />
          </div>

          <div
            role="img"
            aria-label="Gráfico de evolução dos simulados"
            className="mt-5 flex h-40 w-full max-w-full items-end gap-2 overflow-x-auto overflow-y-hidden rounded-xl bg-[#F0F2F5] px-3 py-4 sm:mt-6 sm:h-52 sm:gap-3 sm:px-4 sm:py-5"
          >
            {examsByDate.length === 0 ? (
              <p className="self-center text-sm font-medium text-slate-500">Nenhum simulado registrado ainda.</p>
            ) : (
              examsByDate.map((exam) => (
                <div key={exam.id} className="flex min-w-[34px] flex-1 flex-col items-center gap-1 sm:min-w-0">
                  <div className="flex h-28 w-full items-end rounded-lg bg-white shadow-inner sm:h-36">
                    <div
                      className="w-full rounded-lg bg-gradient-to-t from-blue-600 to-cyan-400 transition-[height] duration-500"
                      style={{ height: `${Math.max(exam.percent, 4)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-950">{exam.percent}%</span>
                  <span className="max-w-full truncate text-[10px] font-medium text-slate-400">{exam.data.slice(5).replace("-", "/")}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Horas estudadas por semana */}
        <div className="min-w-0 w-full max-w-full overflow-hidden rounded-2xl border border-white bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/5 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-400">Horas</p>
              <h2 className="mt-1 break-words text-xl font-bold text-slate-950">Horas estudadas por semana</h2>
              <p className="mt-1 break-words text-sm leading-6 text-slate-500">Tempo acumulado nas últimas 8 semanas.</p>
            </div>
            <Timer className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden="true" />
          </div>

          <div
            role="img"
            aria-label="Gráfico de horas estudadas por semana"
            className="mt-5 flex h-40 w-full max-w-full items-end gap-2 overflow-x-auto overflow-y-hidden rounded-xl bg-[#F0F2F5] px-3 py-4 sm:mt-6 sm:h-52 sm:gap-3 sm:px-4 sm:py-5"
          >
            {weeklyHoursData.every((w) => w.hours === 0) ? (
              <p className="self-center text-sm font-medium text-slate-500">Nenhuma sessão registrada ainda.</p>
            ) : (
              weeklyHoursData.map((week, i) => (
                <div key={i} className="flex min-w-[34px] flex-1 flex-col items-center gap-1 sm:min-w-0">
                  <div className="flex h-28 w-full items-end rounded-lg bg-white shadow-inner sm:h-36">
                    <div
                      className="w-full rounded-lg bg-gradient-to-t from-emerald-600 to-teal-400 transition-[height] duration-500"
                      style={{ height: `${Math.max((week.hours / maxWeeklyHours) * 100, week.hours > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-950">{week.hours > 0 ? `${week.hours}h` : "—"}</span>
                  <span className="max-w-full truncate text-[10px] font-medium text-slate-400">{week.label}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Time distribution by subject */}
      <section className={`${isVisible ? "block" : "hidden"} min-w-0 w-full max-w-full overflow-hidden xl:block`}>
        {timePieSlices.length === 0 ? (
          <div className="flex min-w-0 w-full max-w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-white bg-white p-10 text-center shadow-[0_18px_45px_rgba(15,23,42,0.07)] ring-1 ring-slate-900/5">
            <Timer className="h-8 w-8 text-slate-300" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-500">Nenhuma sessão com matéria registrada ainda.</p>
            <p className="text-sm text-slate-400">Use o modo foco e selecione uma matéria para ver a distribuição.</p>
          </div>
        ) : (
          <PieChart
            title="Distribuição de tempo por matéria"
            subtitle="Percentual do tempo total de estudo dedicado a cada matéria."
            slices={timePieSlices}
            centerLabel={`${totalStudyHours}h`}
          />
        )}
      </section>

      {/* Activity heatmap */}
      {hasSessions && (
        <section className={`${isVisible ? "block" : "hidden"} min-w-0 w-full max-w-full overflow-hidden xl:block`}>
          <div className="min-w-0 w-full max-w-full overflow-hidden rounded-2xl border border-white bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/5 sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1877F2]">Atividade</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">Heatmap de estudo</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">Intensidade diária nas últimas 12 semanas.</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                <span>Menos</span>
                {["bg-slate-100", "bg-blue-200", "bg-blue-400", "bg-[#1877F2]"].map((c) => (
                  <span key={c} className={`h-3 w-3 rounded-sm ${c}`} aria-hidden="true" />
                ))}
                <span>Mais</span>
              </div>
            </div>

            <div className="w-full max-w-full overflow-x-auto overflow-y-hidden pb-1">
              <div className="flex min-w-max gap-1">
              <div className="grid shrink-0 gap-0.5 pr-1" style={{ gridTemplateRows: "repeat(7, 12px)" }}>
                {["S", "T", "Q", "Q", "S", "S", "D"].map((l, i) => (
                  <span key={i} className="flex h-3 items-center text-[9px] font-bold text-slate-300">{l}</span>
                ))}
              </div>
              <div
                className="grid gap-0.5"
                style={{ gridTemplateRows: "repeat(7, 12px)", gridAutoFlow: "column", gridAutoColumns: "12px" }}
              >
                {heatmapDays.map((day) => {
                  const mins = heatmapMinutesByDate.get(day) ?? 0;
                  const isToday = day === todayIso;
                  return (
                    <div
                      key={day}
                      title={`${day}${mins > 0 ? ` · ${Math.round(mins)}min` : ""}`}
                      className={`h-3 w-3 rounded-sm ${heatColor(mins)} ${isToday ? "ring-1 ring-offset-1 ring-[#1877F2]" : ""}`}
                    />
                  );
                })}
              </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Day-of-week distribution */}
      {hasSessions && (
        <section className={`${isVisible ? "block" : "hidden"} min-w-0 w-full max-w-full overflow-hidden xl:block`}>
          <div className="min-w-0 w-full max-w-full overflow-hidden rounded-2xl border border-white bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/5 sm:p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-400">Hábito</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">Distribuição por dia da semana</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Horas acumuladas de estudo por dia da semana desde o início.</p>
            <div
              role="img"
              aria-label="Gráfico de horas por dia da semana"
              className="mt-5 flex h-36 w-full max-w-full items-end gap-2 overflow-x-auto overflow-y-hidden rounded-xl bg-[#F0F2F5] px-3 py-4 sm:mt-6 sm:h-48 sm:gap-4 sm:px-4 sm:py-5"
            >
              {hoursPerWeekday.map((hours, i) => (
                <div key={i} className="flex min-w-[34px] flex-1 flex-col items-center gap-2 sm:min-w-0">
                  <div className="flex h-24 w-full items-end rounded-lg bg-white shadow-inner sm:h-32">
                    <div
                      className="w-full rounded-lg bg-gradient-to-t from-violet-600 to-fuchsia-400 transition-[height] duration-500"
                      style={{ height: `${Math.max((hours / maxWeekdayHours) * 100, hours > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-950">
                    {hours > 0 ? `${Math.round(hours * 10) / 10}h` : "—"}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">{WEEKDAY_LABELS[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Performance bar chart + ranking */}
      <section className={`${isVisible ? "grid" : "hidden"} min-w-0 w-full max-w-full gap-4 overflow-hidden sm:gap-5 xl:grid 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]`}>
        {/* Bar chart */}
        <div className="min-w-0 w-full max-w-full overflow-hidden rounded-2xl border border-white bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/5 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-400">Acertos</p>
              <h2 className="mt-1 break-words text-xl font-bold text-slate-950">Desempenho em simulados</h2>
              <p className="mt-1 break-words text-sm leading-6 text-slate-500">
                Evolução dos percentuais de acerto registrados.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-[#1877F2] ring-1 ring-blue-100">
                simulados {Number.isFinite(avgExam) ? avgExam : 0}%
              </span>
              {avgQuestionAccuracy > 0 && (
                <span className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100">
                  questões {avgQuestionAccuracy}%
                </span>
              )}
              {avgSessionMinutes > 0 && (
                <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
                  sessão {avgSessionMinutes}min
                </span>
              )}
            </div>
          </div>

          <div
            role="img"
            aria-label="Gráfico de barras de desempenho em simulados"
            className="mt-5 flex h-40 w-full max-w-full items-end gap-2 overflow-x-auto overflow-y-hidden rounded-xl bg-[#F0F2F5] px-3 py-4 sm:mt-6 sm:h-52 sm:gap-3 sm:px-4 sm:py-5"
          >
            {examTrend.length === 0 ? (
              <p className="self-center text-sm font-medium text-slate-500">Nenhum simulado registrado.</p>
            ) : (
              examTrend.map((exam) => (
                <div key={exam.id} className="flex min-w-[42px] flex-1 flex-col items-center gap-2 sm:min-w-0">
                  <div className="flex h-28 w-full items-end rounded-lg bg-white shadow-inner sm:h-36">
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
        <div className="min-w-0 w-full max-w-full overflow-hidden rounded-2xl border border-white bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/5 sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1877F2]">Ranking</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Top matérias e tópicos</h2>
          {hasStudyData ? (
            <>
              <div className="mt-5 space-y-4">
                {bestSubjects.filter((item) => item.score > 0).slice(0, 3).map((item, index) => (
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
                        style={{ width: `${Math.min(item.score, 100)}%`, backgroundColor: item.accent.chart }}
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
            </>
          ) : (
            <p className="mt-6 text-sm font-medium text-slate-400">
              Nenhum tópico estudado ainda. Marque tópicos como estudados para ver o ranking.
            </p>
          )}
        </div>
      </section>
    </>
  );
}

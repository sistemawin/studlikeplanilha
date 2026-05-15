import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AppState,
  ExamRow,
  GoalRow,
  QuestionLogRow,
  ReviewRow,
  ScheduleConfig,
  ScheduleRow,
  StudySessionRow,
  SubjectRow,
  TopicRow,
} from "@/types";
import { isoDate } from "@/lib/utils";
import { defaultSchedule, defaultGoals } from "@/lib/seed";

function isMissingTableError(error: unknown, tableName: string) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string };
  const message = candidate.message?.toLowerCase() ?? "";
  const table = tableName.toLowerCase();

  return (
    candidate.code === "42P01"
    || candidate.code === "PGRST205"
    || (message.includes(table) && (message.includes("could not find") || message.includes("does not exist")))
  );
}

export function serializeAppState(state: AppState) {
  return JSON.stringify(state);
}

export function validateSchedule(value: unknown, fallback: ScheduleConfig): ScheduleConfig {
  if (!value || typeof value !== "object") return fallback;
  const candidate = value as Partial<ScheduleConfig>;
  if (candidate.modo !== "semanal" && candidate.modo !== "ciclos") return fallback;
  return {
    modo: candidate.modo,
    horasDia: Number(candidate.horasDia) || fallback.horasDia,
    semanal: candidate.semanal ?? fallback.semanal,
    ciclos: candidate.ciclos ?? fallback.ciclos,
  };
}

export async function loadRemoteState(supabase: SupabaseClient, userId: string): Promise<AppState> {
  const { data: subjectRows, error: subjectsError } = await supabase
    .from("materias")
    .select("id,nome,peso,cor")
    .eq("user_id", userId)
    .order("created_at");

  if (subjectsError) throw subjectsError;

  const [
    { data: topicRows, error: topicsError },
    { data: reviewRows, error: reviewsError },
    { data: scheduleRows, error: scheduleError },
    { data: goalRows, error: goalsError },
    { data: examRows, error: examsError },
    { data: questionLogRows, error: questionLogsError },
    { data: studySessionRows, error: studySessionsError },
  ] = await Promise.all([
    supabase.from("topicos").select("id,materia_id,titulo,status,dificuldade,estudado_em").order("created_at"),
    supabase.from("revisoes").select("id,topico_id,data_agendada,concluida,tipo").order("data_agendada"),
    supabase.from("cronograma").select("id,configuracao").eq("user_id", userId).order("created_at").limit(1),
    supabase.from("metas").select("id,tipo,valor_objetivo,valor_atual").eq("user_id", userId).order("created_at"),
    supabase.from("simulados").select("id,nome,acertos,total_questoes,data_realizacao").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("questoes").select("id,materia_id,topico_id,quantidade,acertos,data_realizacao").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("sessoes_estudo").select("id,user_id,tipo,data_realizacao,ended_at,duration_seconds,materia_id,materia_nome,topico_id,topico_titulo,review_id").eq("user_id", userId).order("ended_at", { ascending: false }),
  ]);

  if (topicsError) throw topicsError;
  if (reviewsError) throw reviewsError;
  if (scheduleError) throw scheduleError;
  if (goalsError) throw goalsError;
  if (examsError) throw examsError;
  if (questionLogsError && !isMissingTableError(questionLogsError, "questoes")) {
    throw questionLogsError;
  }
  if (studySessionsError && !isMissingTableError(studySessionsError, "sessoes_estudo")) {
    throw studySessionsError;
  }

  const subjects = ((subjectRows ?? []) as SubjectRow[]).map((row) => ({
    id: row.id,
    nome: row.nome,
    peso: row.peso,
    cor: row.cor,
  }));

  const topics = ((topicRows ?? []) as TopicRow[]).map((row) => ({
    id: row.id,
    materiaId: row.materia_id,
    titulo: row.titulo,
    status: row.status,
    dificuldade: row.dificuldade,
    estudadoEm: row.estudado_em ?? undefined,
  }));

  const reviews = ((reviewRows ?? []) as ReviewRow[]).map((row) => ({
    id: row.id,
    topicoId: row.topico_id,
    dataAgendada: row.data_agendada,
    concluida: row.concluida,
    tipo: row.tipo,
  }));

  const scheduleConfig = ((scheduleRows ?? []) as ScheduleRow[])[0]?.configuracao;

  const today = isoDate(new Date());
  const goals = ((goalRows ?? []) as GoalRow[]).map((row) => {
    const dataRef = row.data_referencia ?? today;
    const isNewDay = dataRef < today;
    return {
      id: row.id,
      tipo: row.tipo,
      valorObjetivo: Number(row.valor_objetivo),
      valorAtual: isNewDay ? 0 : Number(row.valor_atual),
      dataReferencia: isNewDay ? today : dataRef,
    };
  });

  const exams = ((examRows ?? []) as ExamRow[]).map((row) => ({
    id: row.id,
    nome: row.nome,
    acertos: row.acertos,
    total: row.total_questoes,
    data: row.data_realizacao,
  }));

  const questionLogs = questionLogsError
    ? []
    : ((questionLogRows ?? []) as QuestionLogRow[]).map((row) => ({
        id: row.id,
        materiaId: row.materia_id,
        topicoId: row.topico_id,
        quantidade: row.quantidade,
        acertos: row.acertos,
        data: row.data_realizacao,
      }));

  const studySessions = studySessionsError
    ? []
    : ((studySessionRows ?? []) as StudySessionRow[]).map((row) => ({
        id: row.id,
        tipo: row.tipo,
        data: row.data_realizacao,
        endedAt: row.ended_at,
        durationSeconds: row.duration_seconds,
        materiaId: row.materia_id ?? undefined,
        materiaNome: row.materia_nome ?? undefined,
        topicoId: row.topico_id ?? undefined,
        topicoTitulo: row.topico_titulo ?? undefined,
        reviewId: row.review_id ?? undefined,
      }));

  return {
    subjects,
    topics,
    reviews,
    schedule: validateSchedule(scheduleConfig, defaultSchedule),
    goals: goals.length > 0 ? goals : defaultGoals(),
    exams,
    questionLogs,
    studySessions,
  };
}

// Uses upsert + targeted deletes instead of delete-all + re-insert,
// preventing data loss if the operation is interrupted mid-way.
export async function saveRemoteState(supabase: SupabaseClient, userId: string, state: AppState) {
  const subjectIds = state.subjects.map((s) => s.id);
  const validTopics = state.topics.filter((t) => subjectIds.includes(t.materiaId));
  const topicIds = validTopics.map((t) => t.id);
  const validReviews = state.reviews.filter((r) => topicIds.includes(r.topicoId));
  const reviewIds = validReviews.map((r) => r.id);
  const goalIds = state.goals.map((g) => g.id);
  const examIds = state.exams.map((e) => e.id);
  const validQuestionLogs = state.questionLogs.filter((q) => subjectIds.includes(q.materiaId) && topicIds.includes(q.topicoId));
  const questionLogIds = validQuestionLogs.map((q) => q.id);
  const studySessionIds = state.studySessions.map((s) => s.id);
  // ── Materias ──────────────────────────────────────────────────────────────
  if (state.subjects.length > 0) {
    const { error } = await supabase.from("materias").upsert(
      state.subjects.map((s) => ({ id: s.id, user_id: userId, nome: s.nome, peso: s.peso, cor: s.cor })),
      { onConflict: "id" },
    );
    if (error) throw error;
  }
  // Delete subjects removed from state (cascades to topicos and revisoes)
  {
    const base = supabase.from("materias").delete().eq("user_id", userId);
    const { error } = subjectIds.length > 0
      ? await base.not("id", "in", `(${subjectIds.join(",")})`)
      : await base;
    if (error) throw error;
  }

  // ── Topicos ───────────────────────────────────────────────────────────────
  if (validTopics.length > 0) {
    const { error } = await supabase.from("topicos").upsert(
      validTopics.map((t) => ({
        id: t.id,
        materia_id: t.materiaId,
        titulo: t.titulo,
        status: t.status,
        dificuldade: t.dificuldade,
        estudado_em: t.estudadoEm ?? null,
      })),
      { onConflict: "id" },
    );
    if (error) throw error;
  }
  // Delete topics removed from state, scoped to existing subjects
  if (subjectIds.length > 0) {
    const base = supabase.from("topicos").delete().in("materia_id", subjectIds);
    const { error } = topicIds.length > 0
      ? await base.not("id", "in", `(${topicIds.join(",")})`)
      : await base;
    if (error) throw error;
  }

  // ── Revisoes ──────────────────────────────────────────────────────────────
  if (validReviews.length > 0) {
    const { error } = await supabase.from("revisoes").upsert(
      validReviews.map((r) => ({
        id: r.id,
        topico_id: r.topicoId,
        data_agendada: r.dataAgendada,
        concluida: r.concluida,
        tipo: r.tipo,
      })),
      { onConflict: "id" },
    );
    if (error) throw error;
  }
  // Delete reviews removed from state, scoped to existing topics
  if (topicIds.length > 0) {
    const base = supabase.from("revisoes").delete().in("topico_id", topicIds);
    const { error } = reviewIds.length > 0
      ? await base.not("id", "in", `(${reviewIds.join(",")})`)
      : await base;
    if (error) throw error;
  }

  // ── Metas ─────────────────────────────────────────────────────────────────
  if (state.goals.length > 0) {
    const { error } = await supabase.from("metas").upsert(
      state.goals.map((g) => ({
        id: g.id,
        user_id: userId,
        tipo: g.tipo,
        valor_objetivo: g.valorObjetivo,
        valor_atual: g.valorAtual,
        data_referencia: g.dataReferencia,
      })),
      { onConflict: "id" },
    );
    if (error) throw error;
  }
  {
    const base = supabase.from("metas").delete().eq("user_id", userId);
    const { error } = goalIds.length > 0
      ? await base.not("id", "in", `(${goalIds.join(",")})`)
      : await base;
    if (error) throw error;
  }

  // ── Simulados ─────────────────────────────────────────────────────────────
  if (state.exams.length > 0) {
    const { error } = await supabase.from("simulados").upsert(
      state.exams.map((e) => ({
        id: e.id,
        user_id: userId,
        nome: e.nome,
        acertos: e.acertos,
        total_questoes: e.total,
        data_realizacao: e.data,
      })),
      { onConflict: "id" },
    );
    if (error) throw error;
  }
  {
    const base = supabase.from("simulados").delete().eq("user_id", userId);
    const { error } = examIds.length > 0
      ? await base.not("id", "in", `(${examIds.join(",")})`)
      : await base;
    if (error) throw error;
  }

  // ── Questões por tópico ──────────────────────────────────────────────────
  try {
    if (validQuestionLogs.length > 0) {
      const { error } = await supabase.from("questoes").upsert(
        validQuestionLogs.map((q) => ({
          id: q.id,
          user_id: userId,
          materia_id: q.materiaId,
          topico_id: q.topicoId,
          quantidade: q.quantidade,
          acertos: q.acertos,
          data_realizacao: q.data,
        })),
        { onConflict: "id" },
      );
      if (error) throw error;
    }
    {
      const base = supabase.from("questoes").delete().eq("user_id", userId);
      const { error } = questionLogIds.length > 0
        ? await base.not("id", "in", `(${questionLogIds.join(",")})`)
        : await base;
      if (error) throw error;
    }
  } catch (error) {
    if (!isMissingTableError(error, "questoes")) {
      throw error;
    }
  }

  // ── Sessões de estudo ────────────────────────────────────────────────────
  try {
    if (state.studySessions.length > 0) {
      const { error } = await supabase.from("sessoes_estudo").upsert(
        state.studySessions.map((s) => ({
          id: s.id,
          user_id: userId,
          tipo: s.tipo,
          data_realizacao: s.data,
          ended_at: s.endedAt,
          duration_seconds: s.durationSeconds,
          materia_id: s.materiaId ?? null,
          materia_nome: s.materiaNome ?? null,
          topico_id: s.topicoId ?? null,
          topico_titulo: s.topicoTitulo ?? null,
          review_id: s.reviewId ?? null,
        })),
        { onConflict: "id" },
      );
      if (error) throw error;
    }
    {
      const base = supabase.from("sessoes_estudo").delete().eq("user_id", userId);
      const { error } = studySessionIds.length > 0
        ? await base.not("id", "in", `(${studySessionIds.join(",")})`)
        : await base;
      if (error) throw error;
    }
  } catch (error) {
    if (!isMissingTableError(error, "sessoes_estudo")) {
      throw error;
    }
  }

  // ── Cronograma (single JSONB row per user) ────────────────────────────────
  await supabase.from("cronograma").delete().eq("user_id", userId);
  const { error: scheduleError } = await supabase
    .from("cronograma")
    .insert({ user_id: userId, configuracao: state.schedule });
  if (scheduleError) throw scheduleError;
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AppState,
  ExamRow,
  GoalRow,
  ReviewRow,
  ScheduleConfig,
  ScheduleRow,
  SubjectRow,
  TopicRow,
} from "@/types";
import { isoDate } from "@/lib/utils";
import { goalsSeed, scheduleSeed, subjectsSeed, topicsSeed, reviewsSeed, examsSeed } from "@/lib/seed";

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

function createInitialRemoteState(): AppState {
  const subjectIdBySeedId = new Map(subjectsSeed.map((s) => [s.id, crypto.randomUUID()]));
  const topicIdBySeedId = new Map(topicsSeed.map((t) => [t.id, crypto.randomUUID()]));

  const subjects = subjectsSeed.map((s) => ({ ...s, id: subjectIdBySeedId.get(s.id)! }));
  const topics = topicsSeed.map((t) => ({
    ...t,
    id: topicIdBySeedId.get(t.id)!,
    materiaId: subjectIdBySeedId.get(t.materiaId)!,
  }));
  const reviews = reviewsSeed
    .map((r) => ({ ...r, id: crypto.randomUUID(), topicoId: topicIdBySeedId.get(r.topicoId) ?? "" }))
    .filter((r) => r.topicoId);
  const mapIds = (ids: string[]) => ids.map((id) => subjectIdBySeedId.get(id) ?? id);

  return {
    subjects,
    topics,
    reviews,
    schedule: {
      ...scheduleSeed,
      semanal: Object.fromEntries(
        Object.entries(scheduleSeed.semanal).map(([day, ids]) => [day, mapIds(ids)]),
      ),
      ciclos: mapIds(scheduleSeed.ciclos),
    },
    goals: goalsSeed.map((g) => ({ ...g, id: crypto.randomUUID() })),
    exams: examsSeed.map((e) => ({ ...e, id: crypto.randomUUID() })),
  };
}

export async function loadRemoteState(supabase: SupabaseClient, userId: string): Promise<AppState> {
  const { data: subjectRows, error: subjectsError } = await supabase
    .from("materias")
    .select("id,nome,peso,cor")
    .eq("user_id", userId)
    .order("created_at");

  if (subjectsError) throw subjectsError;

  if (!subjectRows || subjectRows.length === 0) {
    const initial = createInitialRemoteState();
    await saveRemoteState(supabase, userId, initial);
    return initial;
  }

  const [
    { data: topicRows, error: topicsError },
    { data: reviewRows, error: reviewsError },
    { data: scheduleRows, error: scheduleError },
    { data: goalRows, error: goalsError },
    { data: examRows, error: examsError },
  ] = await Promise.all([
    supabase.from("topicos").select("id,materia_id,titulo,status,dificuldade,estudado_em").order("created_at"),
    supabase.from("revisoes").select("id,topico_id,data_agendada,concluida,tipo").order("data_agendada"),
    supabase.from("cronograma").select("id,configuracao").eq("user_id", userId).order("created_at").limit(1),
    supabase.from("metas").select("id,tipo,valor_objetivo,valor_atual").eq("user_id", userId).order("created_at"),
    supabase.from("simulados").select("id,nome,acertos,total_questoes,data_realizacao").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);

  if (topicsError) throw topicsError;
  if (reviewsError) throw reviewsError;
  if (scheduleError) throw scheduleError;
  if (goalsError) throw goalsError;
  if (examsError) throw examsError;

  const subjects = (subjectRows as SubjectRow[]).map((row) => ({
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

  const goals = ((goalRows ?? []) as GoalRow[]).map((row) => ({
    id: row.id,
    tipo: row.tipo,
    valorObjetivo: Number(row.valor_objetivo),
    valorAtual: Number(row.valor_atual),
  }));

  const exams = ((examRows ?? []) as ExamRow[]).map((row) => ({
    id: row.id,
    nome: row.nome,
    acertos: row.acertos,
    total: row.total_questoes,
    data: row.data_realizacao,
  }));

  return {
    subjects,
    topics,
    reviews,
    schedule: validateSchedule(scheduleConfig, scheduleSeed),
    goals: goals.length > 0 ? goals : goalsSeed.map((g) => ({ ...g, id: crypto.randomUUID() })),
    exams,
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
  const today = isoDate(new Date());

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
        data_referencia: today,
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

  // ── Cronograma (single JSONB row per user) ────────────────────────────────
  await supabase.from("cronograma").delete().eq("user_id", userId);
  const { error: scheduleError } = await supabase
    .from("cronograma")
    .insert({ user_id: userId, configuracao: state.schedule });
  if (scheduleError) throw scheduleError;
}

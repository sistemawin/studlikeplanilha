export type TopicStatus =
  | "Não Estudado"
  | "Teoria Lida"
  | "Questões Feitas"
  | "Revisado";

export type Difficulty = "Fácil" | "Médio" | "Difícil";
export type ReviewType = "1" | "7" | "21" | "30" | "manual" | "dificuldade";
export type PlanningMode = "semanal" | "ciclos";
export type NavTarget = "dashboard" | "edital" | "revisoes" | "cronograma" | "simulados";

export type ExamDate = {
  id: string;
  nome: string;
  data: string;
};
export type AuthMode = "login" | "signup" | "forgot" | "reset";

export type Subject = {
  id: string;
  nome: string;
  peso: number;
  cor: string;
};

export type Topic = {
  id: string;
  materiaId: string;
  titulo: string;
  status: TopicStatus;
  dificuldade: Difficulty;
  estudadoEm?: string;
};

export type Review = {
  id: string;
  topicoId: string;
  dataAgendada: string;
  concluida: boolean;
  tipo: ReviewType;
};

export type ScheduleConfig = {
  modo: PlanningMode;
  horasDia: number;
  semanal: Record<string, string[]>;
  ciclos: string[];
  provas: ExamDate[];
};

export type Goal = {
  id: string;
  tipo: "horas" | "questões";
  valorObjetivo: number;
  valorAtual: number;
  dataReferencia: string;
};

export type SyncStatus = "idle" | "pending" | "saving" | "saved" | "error";
export type SuggestionStatus = "nova" | "lida" | "planejada" | "resolvida" | "arquivada";

export type Exam = {
  id: string;
  nome: string;
  acertos: number;
  total: number;
  data: string;
};

export type QuestionLog = {
  id: string;
  materiaId: string;
  topicoId: string;
  quantidade: number;
  acertos: number | null;
  data: string;
};

export type StudySessionType = "topico" | "revisao" | "livre";

export type StudySession = {
  id: string;
  tipo: StudySessionType;
  data: string;
  endedAt: string;
  durationSeconds: number;
  materiaId?: string;
  materiaNome?: string;
  topicoId?: string;
  topicoTitulo?: string;
  reviewId?: string;
};

export type Suggestion = {
  id: string;
  userId: string;
  email: string;
  categoria: string;
  mensagem: string;
  status: SuggestionStatus;
  createdAt: string;
};

export type AdminUser = {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  bannedUntil: string | null;
  isAdmin: boolean;
};

export type SubjectAccent = {
  dot: string;
  card: string;
  border: string;
  chip: string;
  progress: string;
  text: string;
  chart: string;
};

export type ChartSlice = {
  label: string;
  value: number;
  color: string;
};

export type AppState = {
  subjects: Subject[];
  topics: Topic[];
  reviews: Review[];
  schedule: ScheduleConfig;
  goals: Goal[];
  exams: Exam[];
  questionLogs: QuestionLog[];
  studySessions: StudySession[];
};

// Database row types
export type SubjectRow = {
  id: string;
  nome: string;
  peso: number;
  cor: string;
};

export type TopicRow = {
  id: string;
  materia_id: string;
  titulo: string;
  status: TopicStatus;
  dificuldade: Difficulty;
  estudado_em: string | null;
};

export type ReviewRow = {
  id: string;
  topico_id: string;
  data_agendada: string;
  concluida: boolean;
  tipo: ReviewType;
};

export type ScheduleRow = {
  id: string;
  configuracao: ScheduleConfig;
};

export type GoalRow = {
  id: string;
  tipo: "horas" | "questões";
  valor_objetivo: number | string;
  valor_atual: number | string;
  data_referencia: string;
};

export type ExamRow = {
  id: string;
  nome: string;
  acertos: number;
  total_questoes: number;
  data_realizacao: string;
};

export type QuestionLogRow = {
  id: string;
  materia_id: string;
  topico_id: string;
  quantidade: number;
  acertos: number | null;
  data_realizacao: string;
};

export type StudySessionRow = {
  id: string;
  user_id: string;
  tipo: StudySessionType;
  data_realizacao: string;
  ended_at: string;
  duration_seconds: number;
  materia_id: string | null;
  materia_nome: string | null;
  topico_id: string | null;
  topico_titulo: string | null;
  review_id: string | null;
};

export type SuggestionRow = {
  id: string;
  user_id: string;
  email: string;
  categoria: string;
  mensagem: string;
  status: SuggestionStatus;
  created_at: string;
};

export type AdminUserRow = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  banned_until: string | null;
  is_admin: boolean;
  total_count: number | string;
};

export type AdminUserAction = "block" | "unblock" | "delete" | "promote";

export type ReadOnlyUser = { id: string; email: string };

export type ConfirmDialogState = {
  title: string;
  description: string;
  details?: string;
  confirmLabel?: string;
  onConfirm: () => void;
};

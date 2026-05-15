export type TopicStatus =
  | "Não Estudado"
  | "Teoria Lida"
  | "Questões Feitas"
  | "Revisado";

export type Difficulty = "Fácil" | "Médio" | "Difícil";
export type ReviewType = "1" | "7" | "21" | "30" | "manual" | "dificuldade";
export type PlanningMode = "semanal" | "ciclos";
export type NavTarget = "dashboard" | "edital" | "revisoes" | "cronograma" | "simulados";
export type AuthMode = "login" | "signup";

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
};

export type Goal = {
  id: string;
  tipo: "horas" | "questões";
  valorObjetivo: number;
  valorAtual: number;
};

export type MockExam = {
  id: string;
  nome: string;
  acertos: number;
  total: number;
  data: string;
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
  exams: MockExam[];
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
};

export type ExamRow = {
  id: string;
  nome: string;
  acertos: number;
  total_questoes: number;
  data_realizacao: string;
};

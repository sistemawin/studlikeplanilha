import type { Goal, MockExam, Review, ScheduleConfig, Subject, Topic } from "@/types";
import { addDays, isoDate } from "@/lib/utils";

// Anchor date used only for seeding new accounts
const SEED_DATE = new Date("2026-05-13T12:00:00");

export const subjectsSeed: Subject[] = [
  { id: "const", nome: "Direito Constitucional", peso: 5, cor: "bg-emerald-500" },
  { id: "adm", nome: "Direito Administrativo", peso: 4, cor: "bg-sky-500" },
  { id: "port", nome: "Português", peso: 4, cor: "bg-amber-500" },
  { id: "rlm", nome: "Raciocínio Lógico", peso: 3, cor: "bg-rose-500" },
];

export const topicsSeed: Topic[] = [
  {
    id: "t1",
    materiaId: "const",
    titulo: "Controle de Constitucionalidade",
    status: "Questões Feitas",
    dificuldade: "Difícil",
    estudadoEm: "2026-05-12",
  },
  {
    id: "t2",
    materiaId: "const",
    titulo: "Direitos e Garantias Fundamentais",
    status: "Teoria Lida",
    dificuldade: "Médio",
    estudadoEm: "2026-05-06",
  },
  {
    id: "t3",
    materiaId: "adm",
    titulo: "Atos Administrativos",
    status: "Revisado",
    dificuldade: "Fácil",
    estudadoEm: "2026-04-22",
  },
  {
    id: "t4",
    materiaId: "adm",
    titulo: "Licitações e Contratos",
    status: "Não Estudado",
    dificuldade: "Difícil",
  },
  {
    id: "t5",
    materiaId: "port",
    titulo: "Concordância Verbal e Nominal",
    status: "Questões Feitas",
    dificuldade: "Médio",
    estudadoEm: "2026-05-13",
  },
  {
    id: "t6",
    materiaId: "rlm",
    titulo: "Proposições e Tabelas-Verdade",
    status: "Não Estudado",
    dificuldade: "Médio",
  },
];

export const reviewsSeed: Review[] = [
  { id: "r1", topicoId: "t1", dataAgendada: isoDate(SEED_DATE), concluida: false, tipo: "1" },
  { id: "r2", topicoId: "t2", dataAgendada: isoDate(SEED_DATE), concluida: false, tipo: "7" },
  { id: "r3", topicoId: "t4", dataAgendada: addDays(SEED_DATE, -2), concluida: false, tipo: "manual" },
  { id: "r4", topicoId: "t3", dataAgendada: isoDate(SEED_DATE), concluida: true, tipo: "21" },
];

export const scheduleSeed: ScheduleConfig = {
  modo: "ciclos",
  horasDia: 4,
  semanal: {
    Segunda: ["const", "port"],
    Terça: ["adm", "rlm"],
    Quarta: ["const", "adm"],
    Quinta: ["port", "rlm"],
    Sexta: ["const", "adm"],
    Sábado: ["port", "rlm"],
    Domingo: ["Revisões"],
  },
  ciclos: ["const", "adm", "port", "rlm"],
};

export const goalsSeed: Goal[] = [
  { id: "g1", tipo: "questões", valorObjetivo: 50, valorAtual: 32 },
  { id: "g2", tipo: "horas", valorObjetivo: 4, valorAtual: 2.5 },
];

export const examsSeed: MockExam[] = [
  { id: "s1", nome: "Simulado Cebraspe 01", acertos: 78, total: 100, data: "2026-05-10" },
  { id: "s2", nome: "Bloco Constitucional", acertos: 34, total: 50, data: "2026-05-12" },
];

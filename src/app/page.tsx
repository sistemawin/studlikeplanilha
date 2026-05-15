"use client";

import {
  Archive,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Flame,
  HomeIcon,
  ListChecks,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  Maximize2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Target,
  Timer,
  UserPlus,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type TopicStatus =
  | "Não Estudado"
  | "Teoria Lida"
  | "Questões Feitas"
  | "Revisado";
type Difficulty = "Fácil" | "Médio" | "Difícil";
type ReviewType = "1" | "7" | "21" | "30" | "manual" | "dificuldade";
type PlanningMode = "semanal" | "ciclos";
type NavTarget = "dashboard" | "edital" | "revisoes" | "cronograma" | "simulados";
type AuthMode = "login" | "signup";

type Subject = {
  id: string;
  nome: string;
  peso: number;
  cor: string;
};

type Topic = {
  id: string;
  materiaId: string;
  titulo: string;
  status: TopicStatus;
  dificuldade: Difficulty;
  estudadoEm?: string;
};

type Review = {
  id: string;
  topicoId: string;
  dataAgendada: string;
  concluida: boolean;
  tipo: ReviewType;
};

type ScheduleConfig = {
  modo: PlanningMode;
  horasDia: number;
  semanal: Record<string, string[]>;
  ciclos: string[];
};

type Goal = {
  id: string;
  tipo: "horas" | "questões";
  valorObjetivo: number;
  valorAtual: number;
};

type MockExam = {
  id: string;
  nome: string;
  acertos: number;
  total: number;
  data: string;
};

type SubjectAccent = {
  dot: string;
  card: string;
  border: string;
  chip: string;
  progress: string;
  text: string;
  chart: string;
};

type ChartSlice = {
  label: string;
  value: number;
  color: string;
};

const today = new Date("2026-05-13T12:00:00");
const storageKey = "planilhagpt-state-v1";

const subjectsSeed: Subject[] = [
  { id: "const", nome: "Direito Constitucional", peso: 5, cor: "bg-emerald-500" },
  { id: "adm", nome: "Direito Administrativo", peso: 4, cor: "bg-sky-500" },
  { id: "port", nome: "Português", peso: 4, cor: "bg-amber-500" },
  { id: "rlm", nome: "Raciocínio Lógico", peso: 3, cor: "bg-rose-500" },
];

const topicsSeed: Topic[] = [
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

const reviewsSeed: Review[] = [
  { id: "r1", topicoId: "t1", dataAgendada: "2026-05-13", concluida: false, tipo: "1" },
  { id: "r2", topicoId: "t2", dataAgendada: "2026-05-13", concluida: false, tipo: "7" },
  { id: "r3", topicoId: "t4", dataAgendada: "2026-05-11", concluida: false, tipo: "manual" },
  { id: "r4", topicoId: "t3", dataAgendada: "2026-05-13", concluida: true, tipo: "21" },
];

const scheduleSeed: ScheduleConfig = {
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

const goalsSeed: Goal[] = [
  { id: "g1", tipo: "questões", valorObjetivo: 50, valorAtual: 32 },
  { id: "g2", tipo: "horas", valorObjetivo: 4, valorAtual: 2.5 },
];

const examsSeed: MockExam[] = [
  { id: "s1", nome: "Simulado Cebraspe 01", acertos: 78, total: 100, data: "2026-05-10" },
  { id: "s2", nome: "Bloco Constitucional", acertos: 34, total: 50, data: "2026-05-12" },
];

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return isoDate(next);
}

function pct(value: number, total: number) {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

function statusTone(status: TopicStatus) {
  if (status === "Revisado") return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  if (status === "Questões Feitas") return "bg-blue-100 text-blue-800 ring-blue-200";
  if (status === "Teoria Lida") return "bg-amber-100 text-amber-800 ring-amber-200";
  return "bg-rose-100 text-rose-800 ring-rose-200";
}

function subjectAccent(subjectId: string): SubjectAccent {
  const accents: Record<string, SubjectAccent> = {
    const: {
      dot: "bg-emerald-500",
      card: "bg-emerald-50",
      border: "border-emerald-200",
      chip: "bg-emerald-100 text-emerald-800",
      progress: "bg-emerald-500",
      text: "text-emerald-800",
      chart: "#10b981",
    },
    adm: {
      dot: "bg-blue-500",
      card: "bg-blue-50",
      border: "border-blue-200",
      chip: "bg-blue-100 text-blue-800",
      progress: "bg-blue-500",
      text: "text-blue-800",
      chart: "#1877f2",
    },
    port: {
      dot: "bg-amber-500",
      card: "bg-amber-50",
      border: "border-amber-200",
      chip: "bg-amber-100 text-amber-800",
      progress: "bg-amber-500",
      text: "text-amber-800",
      chart: "#f59e0b",
    },
    rlm: {
      dot: "bg-fuchsia-500",
      card: "bg-fuchsia-50",
      border: "border-fuchsia-200",
      chip: "bg-fuchsia-100 text-fuchsia-800",
      progress: "bg-fuchsia-500",
      text: "text-fuchsia-800",
      chart: "#d946ef",
    },
  };

  return (
    accents[subjectId] ?? {
      dot: "bg-slate-500",
      card: "bg-slate-50",
      border: "border-slate-200",
      chip: "bg-slate-100 text-slate-800",
      progress: "bg-blue-500",
      text: "text-slate-800",
      chart: "#64748b",
    }
  );
}

function difficultyDays(difficulty: Difficulty) {
  if (difficulty === "Difícil") return [3, 10, 17];
  if (difficulty === "Médio") return [7, 21];
  return [14];
}

function NavButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof HomeIcon;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-white text-slate-950 shadow-sm"
          : "text-slate-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

function ProgressBar({ value, tone = "bg-zinc-950" }: { value: number; tone?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div className={`h-2 rounded-full ${tone}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

function topicScore(status: TopicStatus, difficulty: Difficulty) {
  const statusPoints: Record<TopicStatus, number> = {
    "Não Estudado": 8,
    "Teoria Lida": 42,
    "Questões Feitas": 76,
    Revisado: 94,
  };
  const difficultyBonus: Record<Difficulty, number> = {
    Fácil: 4,
    Médio: 0,
    Difícil: -6,
  };
  return Math.max(0, Math.min(100, statusPoints[status] + difficultyBonus[difficulty]));
}

function pieBackground(slices: ChartSlice[]) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  if (total === 0) return "#e2e8f0";

  let cursor = 0;
  const stops = slices.map((slice) => {
    const start = cursor;
    const end = cursor + (slice.value / total) * 100;
    cursor = end;
    return `${slice.color} ${start}% ${end}%`;
  });

  return `conic-gradient(${stops.join(", ")})`;
}

function PieChart({
  title,
  subtitle,
  slices,
  centerLabel,
}: {
  title: string;
  subtitle: string;
  slices: ChartSlice[];
  centerLabel: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Analytics
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
        </div>
        <BarChart3 className="h-5 w-5 text-blue-500" />
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-[160px_1fr] sm:items-center">
        <div
          className="relative mx-auto h-40 w-40 rounded-full shadow-inner shadow-slate-900/10"
          style={{ background: pieBackground(slices) }}
        >
          <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white text-center shadow-sm">
            <span className="text-2xl font-semibold text-slate-950">{centerLabel}</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              total
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {slices.map((slice) => (
            <div key={slice.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: slice.color }}
                  />
                  {slice.label}
                </span>
                <span className="font-semibold text-slate-950">
                  {total === 0 ? 0 : pct(slice.value, total)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${total === 0 ? 0 : pct(slice.value, total)}%`,
                    backgroundColor: slice.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuthScreen({
  mode,
  email,
  password,
  name,
  loading,
  error,
  message,
  onModeChange,
  onEmailChange,
  onPasswordChange,
  onNameChange,
  onSubmit,
}: {
  mode: AuthMode;
  email: string;
  password: string;
  name: string;
  loading: boolean;
  error: string;
  message: string;
  onModeChange: (mode: AuthMode) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const isSignup = mode === "signup";

  return (
    <main className="flex min-h-dvh w-full max-w-full items-center justify-center overflow-x-hidden bg-[#f7f7f8] px-4 py-6 text-slate-950 sm:py-10">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/8 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="flex min-h-0 flex-col justify-between bg-slate-950 p-5 text-white sm:p-8 lg:min-h-[560px] lg:p-10">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-950 shadow-sm sm:h-11 sm:w-11">
              <BookOpenCheck className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 lg:mt-8">
              Studlike
            </p>
            <h1 className="mt-2 max-w-md text-2xl font-semibold tracking-normal sm:mt-3 sm:text-4xl lg:text-5xl">
              Controle real do seu plano de estudos.
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-300 sm:mt-4 sm:text-base sm:leading-7">
              Login seguro com Supabase para salvar matérias, tópicos, revisões e simulados por usuário.
            </p>
          </div>

          <div className="mt-6 hidden gap-3 text-sm text-slate-300 sm:grid lg:mt-0">
            {["Dados protegidos por usuário", "Dashboard com gráficos", "Revisões e simulados salvos"].map(
              (item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <span className="font-medium">{item}</span>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="p-5 sm:p-6 md:p-10">
          <div className="mx-auto max-w-md">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600">
              Acesso
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">
              {isSignup ? "Criar conta" : "Entrar na conta"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {isSignup
                ? "Cadastre seu e-mail e senha para começar."
                : "Use seu e-mail e senha cadastrados."}
            </p>

            <div className="mt-8 space-y-4">
              {isSignup && (
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Nome</span>
                  <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-blue-500">
                    <UserPlus className="h-4 w-4 text-slate-400" />
                    <input
                      value={name}
                      onChange={(event) => onNameChange(event.target.value)}
                      placeholder="Seu nome"
                      className="h-full flex-1 bg-transparent text-sm outline-none"
                    />
                  </div>
                </label>
              )}

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">E-mail</span>
                <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-blue-500">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => onEmailChange(event.target.value)}
                    placeholder="voce@email.com"
                    className="h-full flex-1 bg-transparent text-sm outline-none"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Senha</span>
                <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-blue-500">
                  <LockKeyhole className="h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => onPasswordChange(event.target.value)}
                    placeholder="mínimo 6 caracteres"
                    className="h-full flex-1 bg-transparent text-sm outline-none"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") onSubmit();
                    }}
                  />
                </div>
              </label>

              {error && (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {error}
                </p>
              )}
              {message && (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                  {message}
                </p>
              )}

              <button
                onClick={onSubmit}
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isSignup ? "Criar conta" : "Entrar"}
              </button>
            </div>

            <button
              onClick={() => onModeChange(isSignup ? "login" : "signup")}
              className="mt-6 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              {isSignup ? "Já tenho conta" : "Criar uma nova conta"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function Home() {
  const [subjects, setSubjects] = useState(subjectsSeed);
  const [topics, setTopics] = useState(topicsSeed);
  const [reviews, setReviews] = useState(reviewsSeed);
  const [schedule, setSchedule] = useState(scheduleSeed);
  const [goals, setGoals] = useState(goalsSeed);
  const [exams, setExams] = useState(examsSeed);
  const [newTopicText, setNewTopicText] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(subjectsSeed[0].id);
  const [selectedManualTopic, setSelectedManualTopic] = useState(topicsSeed[0].id);
  const [manualDate, setManualDate] = useState(addDays(today, 5));
  const [examDraft, setExamDraft] = useState({ nome: "", acertos: 0, total: 0 });
  const [activeSection, setActiveSection] = useState<NavTarget>("dashboard");
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerFocusOpen, setTimerFocusOpen] = useState(false);
  const [notice, setNotice] = useState("Pronto para estudar.");
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return;
    queueMicrotask(() => {
      const state = JSON.parse(saved);
      setSubjects(state.subjects ?? subjectsSeed);
      setTopics(state.topics ?? topicsSeed);
      setReviews(state.reviews ?? reviewsSeed);
      setSchedule(state.schedule ?? scheduleSeed);
      setGoals(state.goals ?? goalsSeed);
      setExams(state.exams ?? examsSeed);
    });
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ subjects, topics, reviews, schedule, goals, exams }),
    );
  }, [subjects, topics, reviews, schedule, goals, exams]);

  useEffect(() => {
    if (!timerRunning) return;
    const intervalId = window.setInterval(() => {
      setTimerSeconds((current) => current + 1);
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [timerRunning]);

  useEffect(() => {
    try {
      const supabase = getSupabaseBrowserClient();

      supabase.auth
        .getSession()
        .then(({ data }) => setSession(data.session))
        .catch((error: unknown) => {
          setAuthError(error instanceof Error ? error.message : "Não foi possível carregar a sessão.");
        })
        .finally(() => setAuthReady(true));

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
        setAuthReady(true);
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      queueMicrotask(() => {
        setAuthReady(true);
        setAuthError(error instanceof Error ? error.message : "Erro ao configurar autenticação.");
      });
    }
  }, []);

  const completedTopics = topics.filter((topic) => topic.status === "Revisado").length;
  const studiedTopics = topics.filter((topic) => topic.status !== "Não Estudado").length;
  const generalProgress = pct(completedTopics, topics.length);
  const todayIso = isoDate(today);

  const topicById = useMemo(
    () => Object.fromEntries(topics.map((topic) => [topic.id, topic])),
    [topics],
  );
  const subjectById = useMemo(
    () => Object.fromEntries(subjects.map((subject) => [subject.id, subject])),
    [subjects],
  );
  const pendingToday = reviews.filter(
    (review) => !review.concluida && review.dataAgendada <= todayIso,
  );
  const overdue = pendingToday.filter((review) => review.dataAgendada < todayIso).length;
  const questionGoal = goals.find((goal) => goal.tipo === "questões")!;
  const hourGoal = goals.find((goal) => goal.tipo === "horas")!;
  const avgExam = Math.round(
    exams.reduce((sum, exam) => sum + (exam.acertos / exam.total) * 100, 0) / exams.length,
  );
  const subjectPerformance = subjects.map((subject) => {
    const subjectTopics = topics.filter((topic) => topic.materiaId === subject.id);
    const score =
      subjectTopics.length === 0
        ? 0
        : Math.round(
            subjectTopics.reduce(
              (sum, topic) => sum + topicScore(topic.status, topic.dificuldade),
              0,
            ) / subjectTopics.length,
          );
    return {
      subject,
      score,
      topics: subjectTopics.length,
      accent: subjectAccent(subject.id),
    };
  });
  const bestSubjects = [...subjectPerformance].sort((a, b) => b.score - a.score);
  const bestTopics = topics
    .map((topic) => ({
      topic,
      score: topicScore(topic.status, topic.dificuldade),
      subject: subjectById[topic.materiaId],
      accent: subjectAccent(topic.materiaId),
    }))
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
  const examTrend = exams.map((exam) => ({
    ...exam,
    percent: pct(exam.acertos, exam.total),
  }));
  const sectionTitle: Record<NavTarget, string> = {
    dashboard: "Hoje",
    edital: "Edital",
    revisoes: "Revisões",
    cronograma: "Plano",
    simulados: "Dados",
  };

  function scheduleReviews(topic: Topic) {
    const base = new Date(`${todayIso}T12:00:00`);
    const spaced = [1, 7, 21, 30].map((days) => ({
      id: crypto.randomUUID(),
      topicoId: topic.id,
      dataAgendada: addDays(base, days),
      concluida: false,
      tipo: String(days) as ReviewType,
    }));
    const byDifficulty = difficultyDays(topic.dificuldade).map((days) => ({
      id: crypto.randomUUID(),
      topicoId: topic.id,
      dataAgendada: addDays(base, days),
      concluida: false,
      tipo: "dificuldade" as ReviewType,
    }));
    setReviews((current) => [
      ...current.filter((review) => review.topicoId !== topic.id || review.concluida),
      ...spaced,
      ...byDifficulty,
    ]);
  }

  function scrollToSection(target: NavTarget) {
    setActiveSection(target);
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openMobileSection(target: NavTarget) {
    setActiveSection(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function formatTimer(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  function toggleTimer() {
    setTimerRunning((current) => {
      const next = !current;
      setNotice(next ? "Cronômetro iniciado." : `Cronômetro pausado em ${formatTimer(timerSeconds)}.`);
      return next;
    });
  }

  function openFocusTimer() {
    setTimerFocusOpen(true);
    setTimerRunning(true);
    setNotice("Modo foco iniciado.");
  }

  function resetTimer() {
    setTimerRunning(false);
    setTimerSeconds(0);
    setNotice("Cronômetro reiniciado.");
  }

  function registerQuestions() {
    setGoals((current) =>
      current.map((goal) =>
        goal.tipo === "questões" ? { ...goal, valorAtual: goal.valorAtual + 10 } : goal,
      ),
    );
    setNotice("10 questões registradas.");
  }

  async function submitAuth() {
    setAuthError("");
    setAuthMessage("");

    if (!authEmail.trim() || !authPassword) {
      setAuthError("Preencha e-mail e senha.");
      return;
    }

    if (authPassword.length < 6) {
      setAuthError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setAuthLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();

      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
          options: {
            data: { name: authName.trim() },
          },
        });

        if (error) throw error;

        if (!data.session) {
          setAuthMessage("Conta criada. Confirme seu e-mail para entrar.");
          return;
        }

        setSession(data.session);
        setNotice("Conta criada com sucesso.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        });

        if (error) throw error;

        setSession(data.session);
        setNotice("Login realizado com sucesso.");
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Não foi possível autenticar.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function signOut() {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      setSession(null);
      setAuthPassword("");
      setNotice("Sessão encerrada.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível sair.");
    }
  }

  function updateTopicStatus(topicId: string, status: TopicStatus) {
    const currentTopic = topics.find((topic) => topic.id === topicId);
    if (!currentTopic) return;

    const nextTopic = {
      ...currentTopic,
      status,
      estudadoEm: status === "Não Estudado" ? undefined : todayIso,
    };

    setTopics((current) =>
      current.map((topic) => (topic.id === topicId ? nextTopic : topic)),
    );

    if (status === "Questões Feitas" || status === "Revisado") {
      scheduleReviews(nextTopic);
    }
  }

  function addTopicsFromText() {
    const lines = newTopicText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      setNotice("Cole pelo menos um tópico antes de adicionar.");
      return;
    }
    setTopics((current) => [
      ...current,
      ...lines.map((line) => ({
        id: crypto.randomUUID(),
        materiaId: selectedSubject,
        titulo: line.replace(/^[-*0-9. ]+/, ""),
        status: "Não Estudado" as TopicStatus,
        dificuldade: "Médio" as Difficulty,
      })),
    ]);
    setNewTopicText("");
    setNotice(`${lines.length} tópico${lines.length > 1 ? "s" : ""} adicionado${lines.length > 1 ? "s" : ""}.`);
  }

  function addManualReview(topicId: string) {
    if (!topicId) {
      setNotice("Escolha um tópico para agendar a revisão.");
      return;
    }
    setReviews((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        topicoId: topicId,
        dataAgendada: manualDate,
        concluida: false,
        tipo: "manual",
      },
    ]);
    setNotice("Revisão manual agendada.");
  }

  function archiveAll() {
    const confirmArchive = window.confirm(
      "Arquivar o edital atual? Isso limpa tópicos, revisões, metas e simulados.",
    );
    if (!confirmArchive) return;
    setTopics([]);
    setReviews([]);
    setGoals([
      { id: crypto.randomUUID(), tipo: "questões", valorObjetivo: 50, valorAtual: 0 },
      { id: crypto.randomUUID(), tipo: "horas", valorObjetivo: 4, valorAtual: 0 },
    ]);
    setExams([]);
    setNotice("Edital arquivado. Dados principais foram limpos.");
  }

  function addExam() {
    if (!examDraft.nome || examDraft.total <= 0) {
      setNotice("Preencha o nome do simulado e o total de questões.");
      return;
    }
    setExams((current) => [
      {
        id: crypto.randomUUID(),
        nome: examDraft.nome,
        acertos: Math.min(examDraft.acertos, examDraft.total),
        total: examDraft.total,
        data: todayIso,
      },
      ...current,
    ]);
    setExamDraft({ nome: "", acertos: 0, total: 0 });
    setNotice("Simulado salvo.");
  }

  const calendarDays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
  const mobileNavItems: {
    icon: typeof HomeIcon;
    label: string;
    target?: NavTarget;
    action: () => void;
  }[] = [
    { icon: HomeIcon, label: "Início", target: "dashboard", action: () => openMobileSection("dashboard") },
    { icon: ClipboardList, label: "Edital", target: "edital", action: () => openMobileSection("edital") },
    { icon: RotateCcw, label: "Revisar", target: "revisoes", action: () => openMobileSection("revisoes") },
    { icon: CalendarDays, label: "Plano", target: "cronograma", action: () => openMobileSection("cronograma") },
    { icon: BarChart3, label: "Dados", target: "simulados", action: () => openMobileSection("simulados") },
  ];

  if (!authReady) {
    return (
      <main className="flex min-h-dvh w-full max-w-full items-center justify-center overflow-x-hidden bg-[#f7f7f8] text-blue-700">
        <Loader2 className="h-7 w-7 animate-spin" />
      </main>
    );
  }

  if (!session) {
    return (
      <AuthScreen
        mode={authMode}
        email={authEmail}
        password={authPassword}
        name={authName}
        loading={authLoading}
        error={authError}
        message={authMessage}
        onModeChange={(nextMode) => {
          setAuthMode(nextMode);
          setAuthError("");
          setAuthMessage("");
        }}
        onEmailChange={setAuthEmail}
        onPasswordChange={setAuthPassword}
        onNameChange={setAuthName}
        onSubmit={submitAuth}
      />
    );
  }

  return (
    <main className="min-h-dvh w-full max-w-full overflow-x-hidden bg-[#f7f7f8] text-slate-950">
      {timerFocusOpen && (
        <section className="fixed inset-0 z-50 flex min-h-dvh w-full max-w-full flex-col overflow-x-hidden bg-[radial-gradient(circle_at_top,#1d4ed8_0,#0f172a_44%,#020617_100%)] px-5 py-5 text-white md:px-10 md:py-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-blue-100 ring-1 ring-white/15">
                <Timer className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-blue-200">
                  Modo foco
                </p>
                <h2 className="text-lg font-semibold md:text-2xl">Sessão de estudo</h2>
              </div>
            </div>
            <button
              onClick={() => setTimerFocusOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15 transition hover:bg-white/20"
              aria-label="Fechar modo foco"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
            <p className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-100 ring-1 ring-white/15">
              {timerRunning ? "Estudando agora" : "Sessão pausada"}
            </p>
            <div className="mt-8 rounded-[2rem] border border-white/15 bg-white/10 px-8 py-8 shadow-2xl shadow-blue-950/40 backdrop-blur md:px-16 md:py-12">
              <p className="font-mono text-7xl font-semibold tracking-normal text-white md:text-9xl">
                {formatTimer(timerSeconds)}
              </p>
              <p className="mt-4 text-sm font-medium text-blue-100 md:text-base">
                Respire, mantenha o foco e avance uma tarefa por vez.
              </p>
            </div>

            <div className="mt-8 grid w-full max-w-xl gap-3 sm:grid-cols-3">
              <button
                onClick={toggleTimer}
                className="flex h-14 items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-blue-700 shadow-xl shadow-blue-950/20 transition hover:bg-blue-50"
              >
                {timerRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                {timerRunning ? "Pausar" : "Continuar"}
              </button>
              <button
                onClick={resetTimer}
                className="flex h-14 items-center justify-center gap-2 rounded-xl bg-white/10 text-sm font-bold text-white ring-1 ring-white/15 transition hover:bg-white/20"
              >
                <RotateCcw className="h-5 w-5" />
                Reiniciar
              </button>
              <button
                onClick={() => {
                  setTimerFocusOpen(false);
                  setNotice(`Sessão em ${formatTimer(timerSeconds)}.`);
                }}
                className="flex h-14 items-center justify-center gap-2 rounded-xl bg-blue-500 text-sm font-bold text-white shadow-xl shadow-blue-950/20 transition hover:bg-blue-400"
              >
                <CheckCircle2 className="h-5 w-5" />
                Voltar
              </button>
            </div>
          </div>

          <div className="grid gap-3 border-t border-white/10 pt-4 text-sm text-blue-100 md:grid-cols-3">
            <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="font-bold text-white">Meta do dia</p>
              <p className="mt-1">{hourGoal.valorAtual}/{hourGoal.valorObjetivo}h registradas</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="font-bold text-white">Questões</p>
              <p className="mt-1">{questionGoal.valorAtual}/{questionGoal.valorObjetivo} hoje</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="font-bold text-white">Revisões</p>
              <p className="mt-1">{pendingToday.length} pendentes agora</p>
            </div>
          </div>
        </section>
      )}

      <aside className="fixed left-0 top-0 hidden h-screen w-20 border-r border-slate-900 bg-[#050505] p-3 text-white shadow-xl shadow-slate-900/10 lg:block xl:w-64">
        <div className="mb-8 flex items-center gap-3 px-2 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-950 shadow-sm">
            <BookOpenCheck className="h-5 w-5" />
          </div>
          <div className="hidden xl:block">
            <p className="text-sm font-semibold">Studlike</p>
            <p className="text-xs text-slate-400">Plano de estudos</p>
          </div>
        </div>
        <nav className="space-y-1">
          <NavButton
            icon={HomeIcon}
            label="Dashboard"
            active={activeSection === "dashboard"}
            onClick={() => scrollToSection("dashboard")}
          />
          <NavButton
            icon={ClipboardList}
            label="Edital"
            active={activeSection === "edital"}
            onClick={() => scrollToSection("edital")}
          />
          <NavButton
            icon={RotateCcw}
            label="Revisões"
            active={activeSection === "revisoes"}
            onClick={() => scrollToSection("revisoes")}
          />
          <NavButton
            icon={CalendarDays}
            label="Cronograma"
            active={activeSection === "cronograma"}
            onClick={() => scrollToSection("cronograma")}
          />
          <NavButton
            icon={BarChart3}
            label="Simulados"
            active={activeSection === "simulados"}
            onClick={() => scrollToSection("simulados")}
          />
        </nav>
        <button
          onClick={archiveAll}
          className="absolute bottom-4 left-3 right-3 flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
        >
          <Archive className="h-4 w-4" />
          <span className="hidden xl:inline">Arquivar edital</span>
        </button>
      </aside>

      <section className="w-full max-w-full overflow-x-hidden pb-24 lg:ml-20 lg:w-auto lg:pb-0 xl:ml-64">
        <header className="sticky top-0 z-20 w-full max-w-full overflow-x-hidden border-b border-slate-200 bg-white/92 px-4 py-3 shadow-sm shadow-slate-900/5 backdrop-blur-xl md:px-8 md:py-4">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white lg:hidden">
                  <BookOpenCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-pink-600">
                    {sectionTitle[activeSection]}
                  </p>
                  <h1 className="mt-0.5 truncate text-xl font-semibold tracking-normal text-slate-950 sm:text-2xl md:text-3xl">
                    Studlike
                  </h1>
                </div>
              </div>
              <p className="mt-2 hidden text-sm leading-6 text-slate-500 sm:block">
                Alertas, edital verticalizado e metas do dia em uma tela.
              </p>
              <p className="mt-1 truncate text-xs font-medium text-slate-400 sm:mt-2">
                {session.user.email}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
              <button
                onClick={openFocusTimer}
                className="hidden h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm shadow-slate-900/15 hover:bg-slate-800 sm:flex"
              >
                <Maximize2 className="h-4 w-4" />
                <span className="truncate">{timerRunning ? `Foco ${formatTimer(timerSeconds)}` : `Iniciar foco`}</span>
              </button>
              <button
                onClick={registerQuestions}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ListChecks className="h-4 w-4" />
                <span className="truncate">Questões</span>
              </button>
              <button
                onClick={signOut}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-7xl space-y-5 overflow-x-hidden p-4 md:space-y-6 md:p-8">
          <section
            id="dashboard"
            className={`scroll-mt-24 ${
              activeSection === "dashboard" ? "grid" : "hidden"
            } grid-cols-2 gap-3 md:gap-4 lg:grid xl:grid-cols-4`}
          >
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Progresso geral</p>
                <Target className="h-5 w-5 text-blue-500" />
              </div>
              <p className="mt-3 text-2xl font-semibold sm:text-3xl">{generalProgress}%</p>
              <ProgressBar value={generalProgress} tone="bg-blue-500" />
              <p className="mt-2 text-xs text-slate-500">
                {completedTopics} revisados de {topics.length} tópicos
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm shadow-amber-900/5 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-amber-800">Para revisar hoje</p>
                <RotateCcw className="h-5 w-5 text-amber-500" />
              </div>
              <p className="mt-3 text-2xl font-semibold sm:text-3xl">{pendingToday.length}</p>
              <p className="mt-2 text-xs text-amber-800/70">
                {overdue} atrasadas exigem prioridade máxima
              </p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm shadow-rose-900/5 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-rose-800">Questões hoje</p>
                <Flame className="h-5 w-5 text-red-500" />
              </div>
              <p className="mt-3 text-2xl font-semibold sm:text-3xl">
                {questionGoal.valorAtual}/{questionGoal.valorObjetivo}
              </p>
              <ProgressBar value={pct(questionGoal.valorAtual, questionGoal.valorObjetivo)} tone="bg-rose-500" />
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm shadow-emerald-900/5 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-emerald-800">Média simulados</p>
                <BarChart3 className="h-5 w-5 text-sky-500" />
              </div>
              <p className="mt-3 text-2xl font-semibold sm:text-3xl">{Number.isFinite(avgExam) ? avgExam : 0}%</p>
              <p className="mt-2 text-xs text-emerald-800/70">
                Fórmula: acertos / total obrigatório
              </p>
            </div>
          </section>

          <section
            className={`${
              activeSection === "dashboard" ? "block" : "hidden"
            } lg:hidden`}
          >
            <div className="w-full max-w-full overflow-hidden">
              <div className="flex max-w-full gap-3 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                onClick={openFocusTimer}
                className="flex w-[150px] shrink-0 items-center gap-3 rounded-2xl bg-[#050505] p-3 text-left text-white shadow-lg shadow-slate-900/15"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/12">
                  <Timer className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-xs font-semibold text-white/60">Foco</span>
                  <span className="block text-sm font-semibold">
                    {timerRunning ? formatTimer(timerSeconds) : "Iniciar"}
                  </span>
                </span>
              </button>
              {bestSubjects.slice(0, 3).map((item) => (
                <button
                  key={item.subject.id}
                  onClick={() => openMobileSection("edital")}
                  className="w-[126px] shrink-0 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm shadow-slate-900/5"
                >
                  <span className={`mb-3 block h-2 w-10 rounded-full ${item.accent.progress}`} />
                  <span className="block truncate text-sm font-semibold text-slate-950">
                    {item.subject.nome.replace("Direito ", "")}
                  </span>
                  <span className="mt-1 block text-xs font-medium text-slate-500">
                    {item.score}% pronto
                  </span>
                </button>
              ))}
              </div>
            </div>
          </section>

          <p
            className={`${
              activeSection === "dashboard" ? "block" : "hidden"
            } rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm font-medium text-blue-700 shadow-sm shadow-slate-900/5 lg:block`}
          >
            {notice}
          </p>

          <section
            className={`${
              activeSection === "simulados" ? "grid" : "hidden"
            } gap-6 lg:grid xl:grid-cols-[1fr_1fr]`}
          >
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

          <section
            className={`${
              activeSection === "simulados" ? "grid" : "hidden"
            } gap-5 lg:grid xl:grid-cols-[1.1fr_0.9fr]`}
          >
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-500">
                    Acertos
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950">
                    Desempenho em simulados
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Evolução dos percentuais de acerto registrados.
                  </p>
                </div>
                <span className="w-fit rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                  média {Number.isFinite(avgExam) ? avgExam : 0}%
                </span>
              </div>

              <div className="mt-6 flex h-48 items-end gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-5 sm:h-52 sm:gap-3 sm:px-4">
                {examTrend.length === 0 ? (
                  <p className="self-center text-sm text-slate-500">Nenhum simulado registrado.</p>
                ) : (
                  examTrend.map((exam) => (
                    <div key={exam.id} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                      <div className="flex h-36 w-full items-end rounded-md bg-white shadow-inner shadow-slate-900/5">
                        <div
                          className="w-full rounded-md bg-gradient-to-t from-blue-700 to-sky-400"
                          style={{ height: `${Math.max(exam.percent, 4)}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-slate-950">{exam.percent}%</span>
                      <span className="max-w-full truncate text-xs font-medium text-slate-500">
                        {exam.nome}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 sm:p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Ranking
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                Top matérias e tópicos
              </h2>
              <div className="mt-5 space-y-4">
                {bestSubjects.slice(0, 3).map((item, index) => (
                  <div key={item.subject.id}>
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-800">
                        {index + 1}. {item.subject.nome}
                      </span>
                      <span className="text-sm font-semibold text-slate-950">{item.score}%</span>
                    </div>
                    <ProgressBar value={item.score} tone={item.accent.progress} />
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-3">
                {bestTopics.slice(0, 3).map((item) => (
                  <div
                    key={item.topic.id}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="min-w-0 truncate text-sm font-semibold text-slate-900">
                        {item.topic.titulo}
                      </p>
                      <span className="text-sm font-semibold text-blue-700">{item.score}%</span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {item.subject?.nome ?? "Sem matéria"} · {item.topic.status}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            className={`${
              activeSection === "edital" || activeSection === "revisoes" ? "grid" : "hidden"
            } gap-5 lg:grid xl:grid-cols-[1.15fr_0.85fr]`}
          >
            <div
              id="edital"
              className={`${
                activeSection === "edital" ? "block" : "hidden"
              } scroll-mt-24 rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5 lg:block`}
            >
              <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between sm:p-5">
                <div>
                  <h2 className="text-lg font-semibold">Edital verticalizado</h2>
                  <p className="text-sm text-slate-500">
                    Tópicos por matéria com status, dificuldade e revisões automáticas.
                  </p>
                </div>
                <span className="w-fit rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
                  {studiedTopics}/{topics.length} iniciados
                </span>
              </div>
              <div className="grid gap-4 p-4 sm:p-5">
                {subjects.map((subject) => {
                  const subjectTopics = topics.filter((topic) => topic.materiaId === subject.id);
                  const subjectProgress = pct(
                    subjectTopics.filter((topic) => topic.status === "Revisado").length,
                    subjectTopics.length,
                  );
                  const accent = subjectAccent(subject.id);
                  return (
                    <div
                      key={subject.id}
                      className={`rounded-xl border p-4 ${accent.border} ${accent.card}`}
                    >
                      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`h-10 w-2 rounded-full ${accent.dot}`} />
                          <div>
                            <h3 className={`font-semibold ${accent.text}`}>{subject.nome}</h3>
                            <p className="text-xs text-slate-500">
                              Peso {subject.peso} · {subjectTopics.length} tópicos
                            </p>
                          </div>
                        </div>
                        <div className="w-full sm:w-36">
                          <ProgressBar value={subjectProgress} tone={accent.progress} />
                        </div>
                      </div>
                      <div className="space-y-3">
                        {subjectTopics.map((topic) => (
                          <div
                            key={topic.id}
                            className="grid gap-3 rounded-xl border border-white/70 bg-white/95 p-3 shadow-sm shadow-slate-900/5 md:grid-cols-[1fr_150px_140px_120px]"
                          >
                            <div>
                              <p className="font-medium">{topic.titulo}</p>
                              <p className="text-xs text-slate-500">
                                {topic.estudadoEm ? `Estudado em ${topic.estudadoEm}` : "Ainda não iniciado"}
                              </p>
                            </div>
                            <select
                              value={topic.status}
                              onChange={(event) =>
                                updateTopicStatus(topic.id, event.target.value as TopicStatus)
                              }
                              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 md:h-10"
                            >
                              <option>Não Estudado</option>
                              <option>Teoria Lida</option>
                              <option>Questões Feitas</option>
                              <option>Revisado</option>
                            </select>
                            <select
                              value={topic.dificuldade}
                              onChange={(event) =>
                                setTopics((current) =>
                                  current.map((item) =>
                                    item.id === topic.id
                                      ? { ...item, dificuldade: event.target.value as Difficulty }
                                      : item,
                                  ),
                                )
                              }
                              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 md:h-10"
                            >
                              <option>Fácil</option>
                              <option>Médio</option>
                              <option>Difícil</option>
                            </select>
                            <span
                              className={`inline-flex h-10 items-center justify-center rounded-xl px-3 text-xs font-semibold ring-1 ${statusTone(
                                topic.status,
                              )}`}
                            >
                              {topic.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              className={`${
                activeSection === "edital" || activeSection === "revisoes" ? "space-y-5" : "hidden"
              } lg:block lg:space-y-5`}
            >
              <div
                id="revisoes"
                className={`${
                  activeSection === "revisoes" ? "block" : "hidden"
                } scroll-mt-24 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 sm:p-5 lg:block`}
              >
                <h2 className="text-lg font-semibold">Para revisar hoje</h2>
                <div className="mt-4 space-y-3">
                  {pendingToday.length === 0 ? (
                    <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                      Nenhuma revisão pendente para hoje.
                    </p>
                  ) : (
                    pendingToday.map((review) => {
                      const topic = topicById[review.topicoId];
                      if (!topic) return null;
                      const late = review.dataAgendada < todayIso;
                      return (
                        <div
                          key={review.id}
                          className={`rounded-xl border p-4 ${
                            late ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold">{topic.titulo}</p>
                              <p className="text-sm text-slate-600">
                                {subjectById[topic.materiaId]?.nome} · tipo {review.tipo}
                              </p>
                            </div>
                            <span className="text-xs font-semibold">
                              {late ? "Atrasado" : "Hoje"}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setReviews((current) =>
                                current.map((item) =>
                                  item.id === review.id ? { ...item, concluida: true } : item,
                                ),
                              );
                              setNotice("Revisão concluída.");
                            }}
                            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800"
                          >
                            <CheckCircle2 className="h-5 w-5" />
                            Concluir revisão
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div
                className={`${
                  activeSection === "edital" ? "block" : "hidden"
                } rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 sm:p-5 lg:block`}
              >
                <h2 className="text-lg font-semibold">Importar tópicos do edital</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Cole uma lista. Cada linha vira um tópico da matéria selecionada.
                </p>
                <select
                  value={selectedSubject}
                  onChange={(event) => setSelectedSubject(event.target.value)}
                  className="mt-4 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 md:h-10"
                >
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.nome}
                    </option>
                  ))}
                </select>
                <textarea
                  value={newTopicText}
                  onChange={(event) => setNewTopicText(event.target.value)}
                  rows={5}
                  placeholder="Organização do Estado&#10;Administração Pública&#10;Poder Legislativo"
                  className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500"
                />
                <button
                  onClick={addTopicsFromText}
                  className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar tópicos
                </button>
              </div>
            </div>
          </section>

          <section
            className={`${
              activeSection === "cronograma" || activeSection === "simulados" ? "grid" : "hidden"
            } gap-5 lg:grid xl:grid-cols-2`}
          >
            <div
              id="cronograma"
              className={`${
                activeSection === "cronograma" ? "block" : "hidden"
              } scroll-mt-24 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 sm:p-5 lg:block`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Planejamento flexível</h2>
                  <p className="text-sm text-slate-500">Escolha grade semanal ou ciclo rotativo.</p>
                </div>
                <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 sm:flex">
                  {(["semanal", "ciclos"] as PlanningMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setSchedule((current) => ({ ...current, modo: mode }))}
                      className={`rounded-md px-3 py-2 text-sm font-semibold ${
                        schedule.modo === mode ? "bg-slate-950 text-white shadow-sm" : "text-slate-600"
                      }`}
                    >
                      {mode === "semanal" ? "Semanal" : "Ciclos"}
                    </button>
                  ))}
                </div>
              </div>
              <label className="mt-4 block text-sm font-medium">Meta de horas por dia</label>
              <input
                type="number"
                min={1}
                value={schedule.horasDia}
                onChange={(event) =>
                  setSchedule((current) => ({ ...current, horasDia: Number(event.target.value) }))
                }
                className="mt-2 h-11 w-32 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 md:h-10"
              />
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {calendarDays.map((day, index) => {
                  const ids =
                    schedule.modo === "semanal"
                      ? schedule.semanal[day]
                      : [schedule.ciclos[index % schedule.ciclos.length]];
                  return (
                    <div key={day} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="font-semibold">{day}</p>
                        <span className="flex items-center gap-1 text-xs text-blue-700">
                          <Clock3 className="h-3 w-3" />
                          {schedule.horasDia}h
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {ids.map((id) => (
                          <span
                            key={`${day}-${id}`}
                            className={`rounded-lg px-2 py-1 text-xs font-medium ${
                              subjectAccent(id).chip
                            }`}
                          >
                            {subjectById[id]?.nome ?? id}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              id="simulados"
              className={`${
                activeSection === "simulados" ? "block" : "hidden"
              } scroll-mt-24 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 sm:p-5 lg:block`}
            >
              <h2 className="text-lg font-semibold">Metas, simulados e revisão manual</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm font-medium text-blue-800">Horas estudadas</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {hourGoal.valorAtual}/{hourGoal.valorObjetivo}h
                  </p>
                  <ProgressBar value={pct(hourGoal.valorAtual, hourGoal.valorObjetivo)} tone="bg-blue-500" />
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-medium text-emerald-800">Questões diárias</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {questionGoal.valorAtual}/{questionGoal.valorObjetivo}
                  </p>
                  <ProgressBar value={pct(questionGoal.valorAtual, questionGoal.valorObjetivo)} tone="bg-emerald-500" />
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="font-semibold">Registrar simulado</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_90px_90px_auto]">
                  <input
                    value={examDraft.nome}
                    onChange={(event) => setExamDraft((draft) => ({ ...draft, nome: event.target.value }))}
                    placeholder="Nome do simulado"
                    className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 md:h-10"
                  />
                  <input
                    type="number"
                    min={0}
                    value={examDraft.acertos}
                    onChange={(event) =>
                      setExamDraft((draft) => ({ ...draft, acertos: Number(event.target.value) }))
                    }
                    className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 md:h-10"
                  />
                  <input
                    type="number"
                    min={1}
                    value={examDraft.total}
                    onChange={(event) =>
                      setExamDraft((draft) => ({ ...draft, total: Number(event.target.value) }))
                    }
                    className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 md:h-10"
                  />
                  <button
                    onClick={addExam}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-semibold text-white hover:bg-slate-800 md:h-10"
                  >
                    <Save className="h-4 w-4" />
                    Salvar
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {exams.map((exam) => (
                    <div key={exam.id} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm shadow-slate-900/5">
                      <span className="min-w-0 truncate text-sm font-medium">{exam.nome}</span>
                      <span className="text-sm font-semibold">{pct(exam.acertos, exam.total)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-blue-50/50 p-4">
                <p className="font-semibold">Revisão manual</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_150px_auto]">
                  <select
                    value={selectedManualTopic}
                    onChange={(event) => setSelectedManualTopic(event.target.value)}
                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 md:h-10"
                  >
                    {topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.titulo}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(event) => setManualDate(event.target.value)}
                    className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 md:h-10"
                  />
                  <button
                    onClick={() => addManualReview(selectedManualTopic)}
                    className="h-11 rounded-xl bg-slate-950 px-3 text-sm font-semibold text-white hover:bg-slate-800 md:h-10"
                  >
                    Agendar
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      <nav className="fixed bottom-3 left-3 right-3 z-30 grid max-w-[calc(100vw-1.5rem)] grid-cols-5 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-2xl shadow-slate-900/18 backdrop-blur-xl lg:hidden">
        {mobileNavItems.map((item) => {
          const MobileIcon = item.icon;
          const active = item.target ? activeSection === item.target : item.label === "Timer" && timerRunning;
          return (
          <button
            key={item.label}
            onClick={item.action}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-1 text-[10px] font-bold transition sm:text-[11px] ${
              active
                ? "bg-slate-950 text-white shadow-lg shadow-slate-900/20"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
            }`}
          >
            <MobileIcon className="h-5 w-5" />
            {item.label}
          </button>
        );
        })}
      </nav>
    </main>
  );
}

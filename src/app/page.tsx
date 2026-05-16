"use client";

import {
  Archive,
  AppWindow,
  BarChart3,
  CalendarDays,
  Check,
  ClipboardList,
  HomeIcon,
  Loader2,
  LogOut,
  Maximize2,
  MessageSquarePlus,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { StudlikeLogo } from "@/components/StudlikeLogo";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, getSupabasePasswordVerifierClient } from "@/lib/supabase";
import { loadRemoteState, saveRemoteState, serializeAppState, validateSchedule } from "@/lib/sync";
import { addDays, formatTimer, isoDate, pct } from "@/lib/utils";
import { useScrollLock } from "@/hooks/useScrollLock";
import { defaultGoals, defaultSchedule } from "@/lib/seed";
import type { ReadyEdital } from "@/lib/readyEditals";
import type {
  AppState,
  AuthMode,
  Difficulty,
  Goal,
  Exam,
  NavTarget,
  PlanningMode,
  QuestionLog,
  Review,
  ReviewType,
  StudySession,
  Subject,
  SyncStatus,
  Suggestion,
  AdminUser,
  AdminUserRow,
  SuggestionRow,
  SuggestionStatus,
  Topic,
  TopicStatus,
} from "@/types";
import { AuthScreen } from "@/components/AuthScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NavButton } from "@/components/NavButton";
import { SubjectModal } from "@/components/SubjectModal";
import { Dashboard } from "@/sections/Dashboard";
import { Edital } from "@/sections/Edital";
import { Reviews } from "@/sections/Reviews";
import { Schedule } from "@/sections/Schedule";
import { Exams } from "@/sections/Exams";
import { FocusTimer } from "@/sections/FocusTimer";
import { SuggestionModal } from "@/components/SuggestionModal";
import { ArchiveEditalModal } from "@/components/ArchiveEditalModal";
import { AdminPanel } from "@/sections/AdminPanel";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AppFeedbackToast, type AppFeedback, type FeedbackTone } from "@/components/AppFeedbackToast";

const SYNC_DEBOUNCE_MS = 700;
const ADMIN_USERS_PAGE_SIZE = 20;
type AdminUserAction = "block" | "unblock" | "delete" | "promote";
type ReadOnlyUser = { id: string; email: string };
type ConfirmDialogState = {
  title: string;
  description: string;
  details?: string;
  confirmLabel?: string;
  onConfirm: () => void;
};

function feedbackToneFromMessage(message: string): FeedbackTone {
  const normalized = message.toLocaleLowerCase("pt-BR");
  const errorWords = [
    "não foi possível",
    "erro",
    "inválid",
    "preencha",
    "digite",
    "informe",
    "escolha",
    "selecione",
    "maior que",
    "expirou",
    "bloqueado",
  ];

  if (errorWords.some((word) => normalized.includes(word))) {
    return "error";
  }

  return "success";
}

function normalizeAdminAppState(value: unknown): AppState {
  if (!value || typeof value !== "object") {
    throw new Error("Dados do usuário indisponíveis.");
  }
  const candidate = value as Partial<AppState> & { error?: string };
  if (candidate.error) throw new Error(candidate.error);

  return {
    subjects: Array.isArray(candidate.subjects) ? candidate.subjects : [],
    topics: Array.isArray(candidate.topics)
      ? candidate.topics.map((topic) => ({ ...topic, estudadoEm: topic.estudadoEm ?? undefined }))
      : [],
    reviews: Array.isArray(candidate.reviews) ? candidate.reviews : [],
    schedule: validateSchedule(candidate.schedule, defaultSchedule),
    goals: Array.isArray(candidate.goals)
      ? candidate.goals.map((goal) => ({
          ...goal,
          valorObjetivo: Number(goal.valorObjetivo),
          valorAtual: Number(goal.valorAtual),
        }))
      : defaultGoals(),
    exams: Array.isArray(candidate.exams)
      ? candidate.exams.map((exam) => ({ ...exam, total: Number(exam.total), acertos: Number(exam.acertos) }))
      : [],
    questionLogs: Array.isArray(candidate.questionLogs)
      ? candidate.questionLogs.map((log) => ({
          ...log,
          quantidade: Number(log.quantidade),
          acertos: log.acertos === null ? null : Number(log.acertos),
        }))
      : [],
    studySessions: Array.isArray(candidate.studySessions)
      ? candidate.studySessions.map((session) => ({
          ...session,
          durationSeconds: Number(session.durationSeconds),
        }))
      : [],
  };
}

export default function Home() {
  // Computed fresh every render — never stale if tab stays open overnight
  const todayIso = isoDate(new Date());

  // ── App state ─────────────────────────────────────────────────────────────
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [goals, setGoals] = useState<Goal[]>(() => defaultGoals());
  const [exams, setExams] = useState<Exam[]>([]);
  const [questionLogs, setQuestionLogs] = useState<QuestionLog[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [newTopicText, setNewTopicText] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedManualTopic, setSelectedManualTopic] = useState("");
  const [manualDate, setManualDate] = useState(() => addDays(new Date(), 5));
  const [examDraft, setExamDraft] = useState({ nome: "", acertos: 0, total: 0 });
  const [activeSection, setActiveSection] = useState<NavTarget>("dashboard");
  const [adminView, setAdminView] = useState(false);
  const [readOnlyUser, setReadOnlyUser] = useState<ReadOnlyUser | null>(null);
  const [notice, setNoticeState] = useState("Pronto para estudar.");
  const [feedback, setFeedback] = useState<AppFeedback | null>(null);
  const [mobileNavPortalReady, setMobileNavPortalReady] = useState(false);

  // ── Timer state ───────────────────────────────────────────────────────────
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerFocusOpen, setTimerFocusOpen] = useState(false);

  // ── Auth state ────────────────────────────────────────────────────────────
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  // ── Archive modal state ──────────────────────────────────────────────────
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [archivePassword, setArchivePassword] = useState("");
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveError, setArchiveError] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // ── Subject modal state ───────────────────────────────────────────────────
  const [subjectModal, setSubjectModal] = useState<{ open: boolean; subject?: Subject }>({ open: false });

  // ── Suggestions/admin state ───────────────────────────────────────────────
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [suggestionCategory, setSuggestionCategory] = useState("Melhoria de design");
  const [suggestionMessage, setSuggestionMessage] = useState("");
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminUsersTotal, setAdminUsersTotal] = useState(0);
  const [adminUsersPage, setAdminUsersPage] = useState(0);
  const [adminUsersSearch, setAdminUsersSearch] = useState("");
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [refreshingApp, setRefreshingApp] = useState(false);
  const currentAppVersionRef = useRef("");

  // ── Sync status ───────────────────────────────────────────────────────────
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackIdRef = useRef(0);

  // ── Remote sync state ─────────────────────────────────────────────────────
  const [remoteReady, setRemoteReady] = useState(false);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState("");
  const lastSyncedStateRef = useRef("");
  const latestStateRef = useRef<AppState | null>(null);
  const latestSerializedStateRef = useRef("");
  const pendingSyncRef = useRef(false);
  const syncInFlightRef = useRef(false);

  function setNotice(message: string, tone: FeedbackTone = feedbackToneFromMessage(message)) {
    setNoticeState(message);
    feedbackIdRef.current += 1;
    setFeedback({ id: feedbackIdRef.current, message, tone });
  }

  const closeFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

  // ── Timer tick ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  useScrollLock(timerFocusOpen);

  useEffect(() => {
    setMobileNavPortalReady(true);
  }, []);

  // ── App update detection ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function checkVersion() {
      try {
        const response = await fetch("/api/app-version", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { version?: string };
        if (!data.version || cancelled) return;
        if (currentAppVersionRef.current && currentAppVersionRef.current !== data.version) {
          setUpdateAvailable(true);
          return;
        }
        currentAppVersionRef.current ||= data.version;
      } catch {
        // Silent by design: update checks should never interrupt study flow.
      }
    }

    void checkVersion();
    const id = window.setInterval(checkVersion, 60_000);

    function checkWhenVisible() {
      if (document.visibilityState === "visible") {
        void checkVersion();
      }
    }

    function checkAfterPageShow() {
      void checkVersion();
    }

    document.addEventListener("visibilitychange", checkWhenVisible);
    window.addEventListener("focus", checkAfterPageShow);
    window.addEventListener("pageshow", checkAfterPageShow);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", checkWhenVisible);
      window.removeEventListener("focus", checkAfterPageShow);
      window.removeEventListener("pageshow", checkAfterPageShow);
    };
  }, []);

  // ── Service worker registration ───────────────────────────────────────────
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((registration) => {
      // A new SW installed and is waiting: surface the in-app banner.
      function onUpdateFound() {
        const sw = registration.installing;
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
          }
        });
      }
      registration.addEventListener("updatefound", onUpdateFound);

      // Also check for a SW that is already waiting (page refreshed mid-update).
      if (registration.waiting && navigator.serviceWorker.controller) {
        setUpdateAvailable(true);
      }
    }).catch(() => {
      // SW registration failures are silent — the app works without it.
    });

    // When the active SW changes (new SW took control), reload to pick up fresh assets.
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  }, []);

  // ── Auth init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const supabase = getSupabaseBrowserClient();
      const urlMarksPasswordRecovery =
        window.location.hash.includes("type=recovery") || window.location.search.includes("type=recovery");

      supabase.auth
        .getSession()
        .then(({ data }) => {
          if (urlMarksPasswordRecovery && data.session) {
            setAuthMode("reset");
            setAuthPassword("");
            setAuthMessage("Digite sua nova senha para concluir a recuperação.");
          } else if (urlMarksPasswordRecovery) {
            setAuthMode("forgot");
            setAuthError("Link de recuperação expirado ou inválido. Solicite um novo e-mail.");
          }
          setSession(data.session);
        })
        .catch((err: unknown) => {
          setAuthError(err instanceof Error ? err.message : "Não foi possível carregar a sessão.");
        })
        .finally(() => setAuthReady(true));

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => {
        if (event === "PASSWORD_RECOVERY") {
          if (next) {
            setAuthMode("reset");
            setAuthPassword("");
            setAuthError("");
            setAuthMessage("Digite sua nova senha para concluir a recuperação.");
          } else {
            setAuthMode("forgot");
            setAuthError("Link de recuperação expirado ou inválido. Solicite um novo e-mail.");
          }
        }
        setSession(next);
        setAuthReady(true);
      });

      return () => subscription.unsubscribe();
    } catch (err) {
      queueMicrotask(() => {
        setAuthReady(true);
        setAuthError(err instanceof Error ? err.message : "Erro ao configurar autenticação.");
      });
    }
  }, []);

  // ── Load remote data on login ─────────────────────────────────────────────
  useEffect(() => {
    if (!session) {
      setRemoteReady(false);
      setRemoteError("");
      setIsAdmin(false);
      setAdminView(false);
      setReadOnlyUser(null);
      setSuggestions([]);
      setAdminUsers([]);
      setAdminUsersTotal(0);
      setAdminUsersPage(0);
      setAdminUsersSearch("");
      lastSyncedStateRef.current = "";
      return;
    }

    let cancelled = false;
    const supabase = getSupabaseBrowserClient();

    async function load() {
      setRemoteLoading(true);
      setRemoteReady(false);
      setRemoteError("");
      try {
        const remote = await loadRemoteState(supabase, session!.user.id);
        if (cancelled) return;
        setSubjects(remote.subjects);
        setTopics(remote.topics);
        setReviews(remote.reviews);
        setSchedule(remote.schedule);
        setGoals(remote.goals);
        setExams(remote.exams);
        setQuestionLogs(remote.questionLogs);
        setStudySessions(remote.studySessions);
        setSelectedSubject(remote.subjects[0]?.id ?? "");
        setSelectedManualTopic(remote.topics[0]?.id ?? "");
        lastSyncedStateRef.current = serializeAppState(remote);
        setNotice("Dados carregados com segurança.");
        setRemoteReady(true);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Não foi possível carregar dados.";
        setRemoteError(msg);
        setNotice(msg);
      } finally {
        if (!cancelled) setRemoteLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [session]);

  // ── Admin access check ────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    const supabase = getSupabaseBrowserClient();

    async function checkAdmin() {
      try {
        const { data, error } = await supabase
          .from("app_admins")
          .select("user_id")
          .eq("user_id", session!.user.id)
          .maybeSingle();
        if (cancelled) return;
        if (error) {
          setIsAdmin(false);
          return;
        }
        setIsAdmin(Boolean(data));
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    }

    void checkAdmin();
    return () => { cancelled = true; };
  }, [session]);

  // ── Debounced sync ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session || !remoteReady) return;
    if (readOnlyUser) {
      setSyncStatus("idle");
      return;
    }

    const state: AppState = { subjects, topics, reviews, schedule, goals, exams, questionLogs, studySessions };
    const serialized = serializeAppState(state);
    latestStateRef.current = state;
    latestSerializedStateRef.current = serialized;

    if (serialized === lastSyncedStateRef.current) {
      setSyncStatus("idle");
      return;
    }

    setSyncStatus("pending");

    async function runSync() {
      if (!session || !latestStateRef.current) return;
      if (syncInFlightRef.current) { pendingSyncRef.current = true; return; }

      const stateToSave = latestStateRef.current;
      const serializedToSave = latestSerializedStateRef.current;
      const supabase = getSupabaseBrowserClient();
      syncInFlightRef.current = true;
      setSyncStatus("saving");

      try {
        await saveRemoteState(supabase, session.user.id, stateToSave);
        lastSyncedStateRef.current = serializedToSave;
        setRemoteError("");
        setSyncStatus("saved");
        if (savedTimeoutRef.current) window.clearTimeout(savedTimeoutRef.current);
        savedTimeoutRef.current = setTimeout(() => setSyncStatus("idle"), 2000);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Não foi possível salvar seus dados.";
        setRemoteError(msg);
        setNotice(msg);
        setSyncStatus("error");
      } finally {
        syncInFlightRef.current = false;
        if (pendingSyncRef.current || latestSerializedStateRef.current !== lastSyncedStateRef.current) {
          pendingSyncRef.current = false;
          void runSync();
        }
      }
    }

    const id = window.setTimeout(() => void runSync(), SYNC_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [subjects, topics, reviews, schedule, goals, exams, questionLogs, studySessions, session, remoteReady, readOnlyUser]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const topicById = useMemo(
    () => Object.fromEntries(topics.map((t) => [t.id, t])),
    [topics],
  );
  const subjectById = useMemo(
    () => Object.fromEntries(subjects.map((s) => [s.id, s])),
    [subjects],
  );

  const completedTopics = topics.filter((t) => t.status === "Revisado").length;
  const generalProgress = pct(completedTopics, topics.length);
  const pendingToday = reviews.filter((r) => !r.concluida && r.dataAgendada <= todayIso);
  const overdueCount = pendingToday.filter((r) => r.dataAgendada < todayIso).length;
  const questionGoal = goals.find((g) => g.tipo === "questões") ?? { id: "", tipo: "questões" as const, valorObjetivo: 0, valorAtual: 0, dataReferencia: todayIso };
  const hourGoal = goals.find((g) => g.tipo === "horas") ?? { id: "", tipo: "horas" as const, valorObjetivo: 0, valorAtual: 0, dataReferencia: todayIso };
  const avgExam = Math.round(
    exams.reduce((sum, e) => sum + (e.acertos / e.total) * 100, 0) / exams.length,
  );

  const nextExam = [...(schedule.provas ?? [])]
    .filter((p) => p.data >= todayIso)
    .sort((a, b) => a.data.localeCompare(b.data))[0];

  const sectionTitle: Record<NavTarget, string> = {
    dashboard: "Hoje",
    edital: "Edital",
    revisoes: "Revisões",
    cronograma: "Plano",
    simulados: "Dados",
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  function applyAppState(state: AppState) {
    setSubjects(state.subjects);
    setTopics(state.topics);
    setReviews(state.reviews);
    setSchedule(state.schedule);
    setGoals(state.goals);
    setExams(state.exams);
    setQuestionLogs(state.questionLogs);
    setStudySessions(state.studySessions);
    setSelectedSubject(state.subjects[0]?.id ?? "");
    setSelectedManualTopic(state.topics[0]?.id ?? "");
  }

  function preventReadOnlyAction() {
    if (!readOnlyUser) return false;
    setNotice("Modo leitura ativo. Saia da visualização do usuário para editar seus dados.");
    return true;
  }

  async function viewUserApp(user: AdminUser) {
    if (!session || !isAdmin) return;
    setAdminLoading(true);
    setAdminError("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.rpc("admin_get_user_state", {
        p_target_user_id: user.id,
      });
      if (error) throw error;
      const state = normalizeAdminAppState(data);
      setReadOnlyUser({ id: user.id, email: user.email || user.id });
      applyAppState(state);
      setAdminView(false);
      setActiveSection("dashboard");
      setNotice(`Visualizando ${user.email || user.id} em modo leitura.`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : "Não foi possível abrir o app do usuário.");
    } finally {
      setAdminLoading(false);
    }
  }

  async function exitReadOnlyMode() {
    if (!session) return;
    setRemoteLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const state = await loadRemoteState(supabase, session.user.id);
      setReadOnlyUser(null);
      applyAppState(state);
      lastSyncedStateRef.current = serializeAppState(state);
      setNotice("Visualização encerrada. Seus dados foram restaurados.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Não foi possível restaurar seus dados.");
    } finally {
      setRemoteLoading(false);
    }
  }

  function scheduleReviews(topic: Topic) {
    const base = new Date(`${todayIso}T12:00:00`);
    const dayOffsets = [1, 7, 21, 30];
    const diffOffsets = topic.dificuldade === "Difícil" ? [3, 10, 17] : topic.dificuldade === "Médio" ? [7, 21] : [14];

    const spaced = dayOffsets.map((days) => ({
      id: crypto.randomUUID(),
      topicoId: topic.id,
      dataAgendada: addDays(base, days),
      concluida: false,
      tipo: String(days) as ReviewType,
    }));
    const byDifficulty = diffOffsets.map((days) => ({
      id: crypto.randomUUID(),
      topicoId: topic.id,
      dataAgendada: addDays(base, days),
      concluida: false,
      tipo: "dificuldade" as ReviewType,
    }));

    setReviews((current) => [
      ...current.filter((r) => r.topicoId !== topic.id || r.concluida),
      ...spaced,
      ...byDifficulty,
    ]);
  }

  function updateTopicStatus(topicId: string, status: TopicStatus, options?: { silent?: boolean }) {
    if (preventReadOnlyAction()) return;
    const current = topics.find((t) => t.id === topicId);
    if (!current) return;
    const next = { ...current, status, estudadoEm: status === "Não Estudado" ? undefined : todayIso };
    setTopics((ts) => ts.map((t) => (t.id === topicId ? next : t)));
    if (status === "Questões Feitas" || status === "Revisado") scheduleReviews(next);
    if (!options?.silent) {
      setNotice(`Status de "${current.titulo}" atualizado para ${status}.`);
    }
  }

  function updateTopicDifficulty(topicId: string, difficulty: Difficulty) {
    if (preventReadOnlyAction()) return;
    const topic = topics.find((t) => t.id === topicId);
    setTopics((ts) => ts.map((t) => (t.id === topicId ? { ...t, dificuldade: difficulty } : t)));
    setNotice(`Dificuldade${topic ? ` de "${topic.titulo}"` : ""} atualizada para ${difficulty}.`);
  }

  function addTopicsFromText() {
    if (preventReadOnlyAction()) return;
    const lines = newTopicText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setNotice("Cole pelo menos um tópico antes de adicionar.");
      return;
    }
    if (!selectedSubject) {
      setNotice("Selecione uma matéria antes de adicionar tópicos.");
      return;
    }
    setTopics((ts) => [
      ...ts,
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

  function addManualReview() {
    if (preventReadOnlyAction()) return;
    if (!selectedManualTopic) {
      setNotice("Escolha um tópico para agendar a revisão.");
      return;
    }
    if (!manualDate) {
      setNotice("Escolha uma data para a revisão.");
      return;
    }
    setReviews((rs) => [
      ...rs,
      { id: crypto.randomUUID(), topicoId: selectedManualTopic, dataAgendada: manualDate, concluida: false, tipo: "manual" },
    ]);
    setNotice("Revisão manual agendada.");
  }

  function rescheduleReview(reviewId: string, days: number) {
    if (preventReadOnlyAction()) return;
    setReviews((rs) =>
      rs.map((r) => {
        if (r.id !== reviewId) return r;
        const baseIso = r.dataAgendada < todayIso ? todayIso : r.dataAgendada;
        return { ...r, dataAgendada: addDays(new Date(baseIso + "T12:00:00"), days) };
      }),
    );
    setNotice(`Revisão adiada em ${days} dia${days !== 1 ? "s" : ""}.`);
  }

  function completeReview(reviewId: string) {
    if (preventReadOnlyAction()) return;
    setReviews((rs) => rs.map((r) => (r.id === reviewId ? { ...r, concluida: true } : r)));
    setNotice("Revisão concluída.");
  }

  function addExam() {
    if (preventReadOnlyAction()) return;
    if (!examDraft.nome.trim()) {
      setNotice("Preencha o nome do simulado.");
      return;
    }
    if (examDraft.total <= 0) {
      setNotice("Total de questões deve ser maior que zero.");
      return;
    }
    if (examDraft.acertos > examDraft.total) {
      setNotice("Acertos não podem ser maiores que o total de questões.");
      return;
    }
    setExams((es) => [
      { id: crypto.randomUUID(), nome: examDraft.nome.trim(), acertos: examDraft.acertos, total: examDraft.total, data: todayIso },
      ...es,
    ]);
    setExamDraft({ nome: "", acertos: 0, total: 0 });
    setNotice("Simulado salvo.");
  }

  function closeConfirmDialog() {
    setConfirmDialog(null);
  }

  function confirmPendingAction() {
    const action = confirmDialog?.onConfirm;
    setConfirmDialog(null);
    action?.();
  }

  function deleteTopic(topicId: string) {
    if (preventReadOnlyAction()) return;
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return;
    const reviewCount = reviews.filter((r) => r.topicoId === topicId).length;
    const questionLogCount = questionLogs.filter((log) => log.topicoId === topicId).length;
    const relatedEffects = [
      reviewCount > 0 ? `${reviewCount} revisão${reviewCount !== 1 ? "ões" : ""} vinculada${reviewCount !== 1 ? "s" : ""}` : "",
      questionLogCount > 0 ? `${questionLogCount} registro${questionLogCount !== 1 ? "s" : ""} de questões vinculado${questionLogCount !== 1 ? "s" : ""}` : "",
    ].filter(Boolean).join(" e ");
    setConfirmDialog({
      title: "Excluir tópico?",
      description: `Você vai excluir "${topic.titulo}".`,
      details: relatedEffects
        ? `${relatedEffects} serão removidos. Essa ação não pode ser desfeita.`
        : "Essa ação não pode ser desfeita.",
      confirmLabel: "Excluir tópico",
      onConfirm: () => confirmDeleteTopic(topicId),
    });
  }

  function confirmDeleteTopic(topicId: string) {
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return;
    const remainingTopics = topics.filter((t) => t.id !== topicId);
    setTopics(remainingTopics);
    setReviews((rs) => rs.filter((r) => r.topicoId !== topicId));
    setQuestionLogs((logs) => logs.filter((log) => log.topicoId !== topicId));
    if (selectedManualTopic === topicId) setSelectedManualTopic(remainingTopics[0]?.id ?? "");
    setNotice(`Tópico "${topic.titulo}" removido.`);
  }

  function deleteExam(examId: string) {
    if (preventReadOnlyAction()) return;
    const exam = exams.find((e) => e.id === examId);
    if (!exam) return;
    setConfirmDialog({
      title: "Excluir simulado?",
      description: `Você vai excluir "${exam.nome}".`,
      details: `${exam.acertos}/${exam.total} acertos registrados em ${exam.data}. Essa ação não pode ser desfeita.`,
      confirmLabel: "Excluir simulado",
      onConfirm: () => confirmDeleteExam(examId),
    });
  }

  function confirmDeleteExam(examId: string) {
    setExams((es) => es.filter((e) => e.id !== examId));
    setNotice("Simulado removido.");
  }

  function updateGoalObjective(tipo: "questões" | "horas", value: number) {
    if (preventReadOnlyAction()) return;
    if (value <= 0) return;
    setGoals((gs) => {
      const existing = gs.find((g) => g.tipo === tipo);
      if (!existing) {
        return [
          ...gs,
          {
            id: crypto.randomUUID(),
            tipo,
            valorObjetivo: value,
            valorAtual: 0,
            dataReferencia: todayIso,
          },
        ];
      }
      return gs.map((g) => (g.tipo === tipo ? { ...g, valorObjetivo: value } : g));
    });
    setNotice(`Meta de ${tipo} atualizada para ${value}.`);
  }

  function addExamDate(nome: string, data: string) {
    if (preventReadOnlyAction()) return;
    setSchedule((s) => ({
      ...s,
      provas: [...(s.provas ?? []), { id: crypto.randomUUID(), nome, data }],
    }));
    setNotice(`Prova "${nome}" adicionada.`);
  }

  function deleteExamDate(id: string) {
    if (preventReadOnlyAction()) return;
    setSchedule((s) => ({
      ...s,
      provas: (s.provas ?? []).filter((p) => p.id !== id),
    }));
    setNotice("Prova removida.");
  }

  function updateSemanal(day: string, ids: string[]) {
    if (preventReadOnlyAction()) return;
    setSchedule((sc) => ({ ...sc, semanal: { ...sc.semanal, [day]: ids } }));
    setNotice("Cronograma semanal atualizado.");
  }

  function addQuestionLog(data: { materiaId: string; topicoId: string; quantidade: number; acertos: number | null; data: string }) {
    if (preventReadOnlyAction()) return;
    const subject = subjects.find((s) => s.id === data.materiaId);
    const topic = topics.find((t) => t.id === data.topicoId && t.materiaId === data.materiaId);
    if (!subject || !topic) {
      setNotice("Escolha uma matéria e um tópico válidos.");
      return;
    }
    if (data.quantidade <= 0) {
      setNotice("Informe a quantidade de questões feitas.");
      return;
    }
    if (data.acertos !== null && (data.acertos < 0 || data.acertos > data.quantidade)) {
      setNotice("Acertos não podem ser maiores que a quantidade de questões.");
      return;
    }

    setQuestionLogs((logs) => [
      {
        id: crypto.randomUUID(),
        materiaId: data.materiaId,
        topicoId: data.topicoId,
        quantidade: data.quantidade,
        acertos: data.acertos,
        data: data.data,
      },
      ...logs,
    ]);

    if (data.data === todayIso) {
      setGoals((gs) => {
        const existing = gs.find((g) => g.tipo === "questões");
        if (!existing) {
          return [
            ...gs,
            {
              id: crypto.randomUUID(),
              tipo: "questões",
              valorObjetivo: data.quantidade,
              valorAtual: data.quantidade,
              dataReferencia: todayIso,
            },
          ];
        }
        return gs.map((g) =>
          g.tipo === "questões"
            ? { ...g, valorAtual: g.valorAtual + data.quantidade, dataReferencia: todayIso }
            : g,
        );
      });
    }

    if (topic.status === "Não Estudado" || topic.status === "Teoria Lida") {
      updateTopicStatus(topic.id, "Questões Feitas", { silent: true });
    }

    setNotice(`${data.quantidade} questão${data.quantidade !== 1 ? "ões" : ""} registrada${data.quantidade !== 1 ? "s" : ""} em ${subject.nome}.`);
  }

  function deleteStudySession(sessionId: string) {
    if (preventReadOnlyAction()) return;
    const target = studySessions.find((s) => s.id === sessionId);
    if (!target) return;
    setConfirmDialog({
      title: "Excluir sessão?",
      description: `Sessão de ${formatTimer(target.durationSeconds)} registrada em ${target.data}.`,
      details: target.data === todayIso
        ? "O tempo acumulado na meta diária de horas será ajustado. Essa ação não pode ser desfeita."
        : "Essa ação não pode ser desfeita.",
      confirmLabel: "Excluir sessão",
      onConfirm: () => confirmDeleteStudySession(sessionId),
    });
  }

  function confirmDeleteStudySession(sessionId: string) {
    const target = studySessions.find((s) => s.id === sessionId);
    if (!target) return;
    setStudySessions((ss) => ss.filter((s) => s.id !== sessionId));
    if (target.data === todayIso) {
      const sessionHours = Math.round((target.durationSeconds / 3600) * 100) / 100;
      setGoals((gs) =>
        gs.map((g) =>
          g.tipo === "horas"
            ? { ...g, valorAtual: Math.max(0, Math.round((g.valorAtual - sessionHours) * 100) / 100) }
            : g,
        ),
      );
    }
    setNotice("Sessão removida.");
  }

  function deleteQuestionLog(logId: string) {
    if (preventReadOnlyAction()) return;
    const log = questionLogs.find((q) => q.id === logId);
    if (!log) return;
    const subject = subjects.find((item) => item.id === log.materiaId);
    const topic = topics.find((item) => item.id === log.topicoId);
    setConfirmDialog({
      title: "Excluir registro de questões?",
      description: `Você vai excluir ${log.quantidade} questão${log.quantidade !== 1 ? "ões" : ""} de "${topic?.titulo ?? "tópico removido"}".`,
      details: `${subject?.nome ?? "Matéria removida"} · ${log.data}${log.acertos !== null ? ` · ${log.acertos} acerto${log.acertos !== 1 ? "s" : ""}` : ""}. Se for de hoje, a meta diária será ajustada.`,
      confirmLabel: "Excluir registro",
      onConfirm: () => confirmDeleteQuestionLog(logId),
    });
  }

  function confirmDeleteQuestionLog(logId: string) {
    const log = questionLogs.find((q) => q.id === logId);
    if (!log) return;
    setQuestionLogs((logs) => logs.filter((q) => q.id !== logId));
    if (log?.data === todayIso) {
      setGoals((gs) =>
        gs.map((g) =>
          g.tipo === "questões"
            ? { ...g, valorAtual: Math.max(0, g.valorAtual - log.quantidade), dataReferencia: todayIso }
            : g,
        ),
      );
    }
    setNotice("Registro de questões removido.");
  }

  async function submitSuggestion() {
    if (preventReadOnlyAction()) return;
    if (!session) return;
    const message = suggestionMessage.trim();
    if (message.length < 6) {
      setNotice("Escreva uma sugestão com mais detalhes antes de enviar.");
      return;
    }

    setSuggestionLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("sugestoes").insert({
        user_id: session.user.id,
        email: session.user.email ?? "",
        categoria: suggestionCategory,
        mensagem: message,
      });
      if (error) throw error;
      setSuggestionOpen(false);
      setSuggestionMessage("");
      setSuggestionCategory("Melhoria de design");
      setNotice("Sugestão enviada. Obrigado pelo feedback.");
      if (isAdmin) void loadAdminSuggestions();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Não foi possível enviar a sugestão.");
    } finally {
      setSuggestionLoading(false);
    }
  }

  async function loadAdminSuggestions() {
    if (!session || !isAdmin) return;
    setAdminLoading(true);
    setAdminError("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("sugestoes")
        .select("id,user_id,email,categoria,mensagem,status,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setSuggestions(((data ?? []) as SuggestionRow[]).map((row) => ({
        id: row.id,
        userId: row.user_id,
        email: row.email,
        categoria: row.categoria,
        mensagem: row.mensagem,
        status: row.status,
        createdAt: row.created_at,
      })));
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : "Não foi possível carregar sugestões.");
    } finally {
      setAdminLoading(false);
    }
  }

  async function loadAdminUsers(page = adminUsersPage, search = adminUsersSearch) {
    if (!session || !isAdmin) return;
    const safePage = Math.max(0, page);
    const safeSearch = search.trim();
    setAdminUsersLoading(true);
    setAdminError("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.rpc("admin_list_users", {
        p_limit: ADMIN_USERS_PAGE_SIZE,
        p_offset: safePage * ADMIN_USERS_PAGE_SIZE,
        p_search: safeSearch,
      });
      if (error) throw error;
      const rows = (data ?? []) as AdminUserRow[];
      setAdminUsers(rows.map((row) => ({
        id: row.id,
        email: row.email,
        createdAt: row.created_at,
        lastSignInAt: row.last_sign_in_at,
        bannedUntil: row.banned_until,
        isAdmin: row.is_admin,
      })));
      if (rows.length > 0) {
        setAdminUsersTotal(Number(rows[0].total_count));
      } else if (safePage === 0) {
        setAdminUsersTotal(0);
      }
      setAdminUsersPage(safePage);
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : "Não foi possível carregar usuários.");
    } finally {
      setAdminUsersLoading(false);
    }
  }

  function searchAdminUsers(value: string) {
    setAdminUsersSearch(value);
    void loadAdminUsers(0, value);
  }

  async function manageAdminUser(user: AdminUser, action: AdminUserAction) {
    if (!session || !isAdmin) return;
    const actionLabels: Record<AdminUserAction, string> = {
      block: "bloquear",
      unblock: "desbloquear",
      delete: "excluir",
      promote: "promover a admin",
    };
    const destructive = action === "block" || action === "delete";
    if (destructive) {
      setConfirmDialog({
        title: action === "delete" ? "Excluir conta?" : "Bloquear conta?",
        description: `Você vai ${actionLabels[action]} a conta ${user.email || user.id}.`,
        details: action === "delete"
          ? "Essa ação remove o acesso do usuário e não deve ser usada sem confirmação prévia."
          : "A conta ficará sem acesso até ser desbloqueada por um admin.",
        confirmLabel: action === "delete" ? "Excluir conta" : "Bloquear conta",
        onConfirm: () => {
          void confirmManageAdminUser(user, action);
        },
      });
      return;
    }

    await confirmManageAdminUser(user, action);
  }

  async function confirmManageAdminUser(user: AdminUser, action: AdminUserAction) {
    const actionLabels: Record<AdminUserAction, string> = {
      block: "bloquear",
      unblock: "desbloquear",
      delete: "excluir",
      promote: "promover a admin",
    };
    setAdminUsersLoading(true);
    setAdminError("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.rpc("admin_manage_user", {
        p_target_user_id: user.id,
        p_action: action,
      });
      if (error) throw error;
      setNotice(`Usuário ${actionLabels[action]} com sucesso.`);
      void loadAdminUsers(adminUsersPage, adminUsersSearch);
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : "Não foi possível executar a ação.");
      setAdminUsersLoading(false);
    }
  }

  async function updateSuggestionStatus(id: string, status: SuggestionStatus) {
    setSuggestions((items) => items.map((item) => (item.id === id ? { ...item, status } : item)));
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("sugestoes").update({ status }).eq("id", id);
      if (error) throw error;
      setNotice("Status da sugestão atualizado.");
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : "Não foi possível atualizar o status.");
      setNotice(err instanceof Error ? err.message : "Não foi possível atualizar o status.");
      void loadAdminSuggestions();
    }
  }

  function openAdminView() {
    setAdminView(true);
    void loadAdminSuggestions();
    void loadAdminUsers(0, adminUsersSearch);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function refreshAdminData() {
    void loadAdminSuggestions();
    void loadAdminUsers(adminUsersPage, adminUsersSearch);
    setNotice("Atualizando dados administrativos.", "info");
  }

  async function refreshAppVersion() {
    if (refreshingApp) return;
    setRefreshingApp(true);

    try {
      if ("serviceWorker" in navigator) {
        // Tell the waiting SW to take control immediately.
        const registration = await navigator.serviceWorker.getRegistration("/");
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
          // controllerchange listener in the SW useEffect will reload the page.
          return;
        }
        // No waiting SW — force-check for updates then reload.
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.update()));
      }

      if ("caches" in window) {
        const cacheNames = await window.caches.keys();
        await Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)));
      }
    } finally {
      const refreshUrl = new URL(window.location.href);
      refreshUrl.searchParams.set("refresh", String(Date.now()));
      window.location.replace(refreshUrl.toString());
    }
  }

  function addSubject(data: { nome: string; peso: number; cor: string; topicos: string[] }) {
    if (preventReadOnlyAction()) return;
    const newSubject: Subject = { id: crypto.randomUUID(), nome: data.nome, peso: data.peso, cor: data.cor };
    setSubjects((ss) => [...ss, newSubject]);
    setSelectedSubject(newSubject.id);
    if (data.topicos.length > 0) {
      setTopics((ts) => [
        ...ts,
        ...data.topicos.map((titulo) => ({
          id: crypto.randomUUID(),
          materiaId: newSubject.id,
          titulo: titulo.replace(/^[-*0-9. ]+/, ""),
          status: "Não Estudado" as TopicStatus,
          dificuldade: "Médio" as Difficulty,
        })),
      ]);
    }
    setSubjectModal({ open: false });
    const topMsg = data.topicos.length > 0 ? ` com ${data.topicos.length} tópico${data.topicos.length !== 1 ? "s" : ""}` : "";
    setNotice(`Matéria "${data.nome}" criada${topMsg}.`);
  }

  function importReadyEdital(edital: ReadyEdital) {
    if (preventReadOnlyAction()) return;

    const importedSubjects: Subject[] = edital.subjects.map((subject) => ({
      id: crypto.randomUUID(),
      nome: subject.nome,
      peso: subject.peso,
      cor: subject.cor,
    }));
    const importedTopics: Topic[] = importedSubjects.flatMap((subject, subjectIndex) =>
      edital.subjects[subjectIndex].topicos.map((titulo) => ({
        id: crypto.randomUUID(),
        materiaId: subject.id,
        titulo,
        status: "Não Estudado" as TopicStatus,
        dificuldade: edital.subjects[subjectIndex].dificuldade ?? ("Médio" as Difficulty),
      })),
    );

    setSubjects((items) => [...items, ...importedSubjects]);
    setTopics((items) => [...items, ...importedTopics]);
    setSelectedSubject(importedSubjects[0]?.id ?? "");
    setSelectedManualTopic(importedTopics[0]?.id ?? "");
    setSchedule((current) => ({
      ...current,
      ciclos: [...current.ciclos, ...importedSubjects.map((subject) => subject.id)],
    }));
    setNotice(
      `${edital.title} importado com ${importedSubjects.length} matéria${importedSubjects.length !== 1 ? "s" : ""} e ${importedTopics.length} tópico${importedTopics.length !== 1 ? "s" : ""}.`,
    );
  }

  function updateSubject(id: string, data: { nome: string; peso: number; cor: string; topicos: string[] }) {
    if (preventReadOnlyAction()) return;
    setSubjects((ss) => ss.map((s) => (s.id === id ? { ...s, ...data } : s)));
    setSubjectModal({ open: false });
    setNotice(`Matéria "${data.nome}" atualizada.`);
  }

  function deleteSubject(subjectId: string) {
    if (preventReadOnlyAction()) return;
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;
    const topicsInSubject = topics.filter((t) => t.materiaId === subjectId);
    const reviewCount = reviews.filter((r) => topicsInSubject.some((topic) => topic.id === r.topicoId)).length;
    const questionLogCount = questionLogs.filter((log) => log.materiaId === subjectId).length;

    setConfirmDialog({
      title: "Excluir matéria?",
      description: `Você vai excluir "${subject.nome}".`,
      details: [
        `${topicsInSubject.length} tópico${topicsInSubject.length !== 1 ? "s" : ""}`,
        `${reviewCount} revisão${reviewCount !== 1 ? "ões" : ""}`,
        `${questionLogCount} registro${questionLogCount !== 1 ? "s" : ""} de questões`,
        "serão removidos. Essa ação não pode ser desfeita.",
      ].join(" "),
      confirmLabel: "Excluir matéria",
      onConfirm: () => confirmDeleteSubject(subjectId),
    });
  }

  function confirmDeleteSubject(subjectId: string) {
    const subject = subjects.find((s) => s.id === subjectId);
    const topicsInSubject = topics.filter((t) => t.materiaId === subjectId);
    const topicIds = new Set(topicsInSubject.map((t) => t.id));
    const label = subject?.nome ?? "matéria";
    const remainingSubjects = subjects.filter((s) => s.id !== subjectId);
    const remainingTopics = topics.filter((t) => t.materiaId !== subjectId);

    setSubjects(remainingSubjects);
    setTopics(remainingTopics);
    setReviews((rs) => rs.filter((r) => !topicIds.has(r.topicoId)));
    setQuestionLogs((logs) => logs.filter((log) => log.materiaId !== subjectId));
    setSchedule((sc) => ({
      ...sc,
      ciclos: sc.ciclos.filter((id) => id !== subjectId),
      semanal: Object.fromEntries(
        Object.entries(sc.semanal).map(([day, ids]) => [day, ids.filter((id) => id !== subjectId)]),
      ),
    }));

    // Reset stale selectors to avoid orphan references
    if (selectedSubject === subjectId) {
      setSelectedSubject(remainingSubjects[0]?.id ?? "");
    }
    if (topicIds.has(selectedManualTopic)) {
      setSelectedManualTopic(remainingTopics[0]?.id ?? "");
    }

    setNotice(`Matéria "${label}" excluída.`);
  }

  function openArchiveModal() {
    if (preventReadOnlyAction()) return;
    setArchivePassword("");
    setArchiveError("");
    setArchiveModalOpen(true);
  }

  function closeArchiveModal() {
    if (archiveLoading) return;
    setArchiveModalOpen(false);
    setArchivePassword("");
    setArchiveError("");
  }

  function archiveAll() {
    setTopics([]);
    setReviews([]);
    setGoals([]);
    setExams([]);
    setQuestionLogs([]);
    setSchedule(defaultSchedule);
    // Reset selectors — topics no longer exist
    setSelectedManualTopic("");
    setNotice("Edital arquivado. Dados principais foram limpos.");
  }

  async function confirmArchiveAll() {
    if (preventReadOnlyAction()) return;

    const email = session?.user.email;
    if (!email) {
      setArchiveError("Não foi possível confirmar a senha porque sua conta não tem e-mail.");
      return;
    }
    if (!archivePassword.trim()) {
      setArchiveError("Digite sua senha para confirmar.");
      return;
    }

    setArchiveLoading(true);
    setArchiveError("");
    try {
      const verifier = getSupabasePasswordVerifierClient();
      const { error } = await verifier.auth.signInWithPassword({
        email,
        password: archivePassword,
      });
      if (error) throw error;

      archiveAll();
      setArchiveModalOpen(false);
      setArchivePassword("");
      setArchiveError("");
    } catch {
      setArchiveError("Senha inválida. Confira a senha da sua conta e tente novamente.");
    } finally {
      setArchiveLoading(false);
    }
  }

  function openFocusTimer() {
    setTimerFocusOpen(true);
    setTimerRunning(true);
    setNotice("Modo foco iniciado.");
  }

  function toggleTimer() {
    setTimerRunning((running) => {
      const next = !running;
      setNotice(next ? "Cronômetro iniciado." : `Cronômetro pausado em ${formatTimer(timerSeconds)}.`);
      return next;
    });
  }

  function resetTimer() {
    setTimerRunning(false);
    setTimerSeconds(0);
    setNotice("Cronômetro reiniciado.");
  }

  function closeFocusTimer() {
    setTimerFocusOpen(false);
    setNotice(`Sessão em ${formatTimer(timerSeconds)}.`);
  }

  function finishSession({ topicId, reviewId }: { topicId?: string; reviewId?: string }) {
    if (preventReadOnlyAction()) return;
    setTimerFocusOpen(false);
    setTimerRunning(false);

    const sessionHours = Math.round((timerSeconds / 3600) * 100) / 100;
    const timeStr = formatTimer(timerSeconds);
    const topic = topicId ? topicById[topicId] : undefined;
    const review = reviewId ? reviews.find((r) => r.id === reviewId) : undefined;
    const reviewTopic = review ? topicById[review.topicoId] : undefined;
    const sessionTopic = topic ?? reviewTopic;
    const sessionSubject = sessionTopic ? subjectById[sessionTopic.materiaId] : undefined;

    if (timerSeconds > 0) {
      setGoals((gs) =>
        gs.map((g) =>
          g.tipo === "horas"
            ? { ...g, valorAtual: Math.round((g.valorAtual + sessionHours) * 100) / 100 }
            : g,
        ),
      );
      setStudySessions((sessions) => [
        {
          id: crypto.randomUUID(),
          tipo: topicId ? "topico" : reviewId ? "revisao" : "livre",
          data: todayIso,
          endedAt: new Date().toISOString(),
          durationSeconds: timerSeconds,
          materiaId: sessionSubject?.id,
          materiaNome: sessionSubject?.nome,
          topicoId: sessionTopic?.id,
          topicoTitulo: sessionTopic?.titulo,
          reviewId,
        },
        ...sessions,
      ]);
    }

    if (reviewId) {
      completeReview(reviewId);
    }

    if (topicId) {
      setTopics((ts) =>
        ts.map((t) =>
          t.id === topicId ? { ...t, estudadoEm: t.estudadoEm ?? todayIso } : t,
        ),
      );
      const label = topic?.titulo ?? "tópico";
      setNotice(`${timeStr} registrado — ${label}.`);
    } else if (reviewId) {
      setNotice(`${timeStr} registrado · revisão "${reviewTopic?.titulo ?? ""}" concluída.`);
    } else {
      setNotice(`Sessão de ${timeStr} registrada.`);
    }
  }

  function changeAuthMode(next: AuthMode) {
    setAuthMode(next);
    setAuthError("");
    setAuthMessage("");
    if (authMode === "reset" && next !== "reset") {
      void getSupabaseBrowserClient().auth.signOut();
      setSession(null);
      setAuthPassword("");
    }
  }

  async function submitAuth() {
    setAuthError("");
    setAuthMessage("");
    const email = authEmail.trim();
    if (authMode === "forgot") {
      if (!email) { setAuthError("Informe seu e-mail para recuperar a senha."); return; }
      setAuthLoading(true);
      try {
        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setAuthMessage("Enviamos um link de recuperação para seu e-mail.");
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : "Não foi possível enviar o e-mail de recuperação.");
      } finally {
        setAuthLoading(false);
      }
      return;
    }

    if (authMode === "reset") {
      if (!authPassword) { setAuthError("Digite sua nova senha."); return; }
      if (authPassword.length < 6) { setAuthError("A senha precisa ter pelo menos 6 caracteres."); return; }
      setAuthLoading(true);
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session) {
          setAuthMode("forgot");
          setAuthPassword("");
          setAuthError("Sua sessão de recuperação expirou. Solicite um novo link por e-mail.");
          return;
        }

        const { error } = await supabase.auth.updateUser({ password: authPassword });
        if (error) throw error;
        await supabase.auth.signOut();
        setSession(null);
        setAuthPassword("");
        setAuthMode("login");
        setAuthMessage("Senha atualizada. Entre novamente com a nova senha.");
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : "Não foi possível atualizar a senha.");
      } finally {
        setAuthLoading(false);
      }
      return;
    }

    if (!email || !authPassword) { setAuthError("Preencha e-mail e senha."); return; }
    if (authPassword.length < 6) { setAuthError("A senha precisa ter pelo menos 6 caracteres."); return; }
    setAuthLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: authPassword,
          options: { data: { name: authName.trim() } },
        });
        if (error) throw error;
        if (!data.session) { setAuthMessage("Conta criada. Confirme seu e-mail para entrar."); return; }
        setSession(data.session);
        setNotice("Conta criada com sucesso.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: authPassword,
        });
        if (error) throw error;
        setSession(data.session);
        setNotice("Login realizado com sucesso.");
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Não foi possível autenticar.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function signOut() {
    try {
      await getSupabaseBrowserClient().auth.signOut();
      setSession(null);
      setAuthPassword("");
      setNotice("Sessão encerrada.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Não foi possível sair.");
    }
  }

  function scrollToSection(target: NavTarget) {
    setAdminView(false);
    setActiveSection(target);
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openMobileSection(target: NavTarget) {
    setAdminView(false);
    setActiveSection(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function navigateFromDashboard(target: NavTarget) {
    if (window.matchMedia("(min-width: 1280px)").matches) {
      scrollToSection(target);
      return;
    }
    openMobileSection(target);
  }

  const feedbackToast = <AppFeedbackToast feedback={feedback} onClose={closeFeedback} />;

  // ── Loading & auth gates ──────────────────────────────────────────────────
  if (!authReady) {
    return (
      <main className="flex min-h-dvh w-full items-center justify-center bg-[#F0F2F5] text-[#1877F2]">
        <Loader2 className="h-7 w-7 animate-spin" aria-label="Carregando" />
        {feedbackToast}
      </main>
    );
  }

  if (authMode === "reset") {
    return (
      <>
        <AuthScreen
          mode={authMode}
          email={authEmail}
          password={authPassword}
          name={authName}
          loading={authLoading}
          error={authError}
          message={authMessage}
          onModeChange={changeAuthMode}
          onEmailChange={setAuthEmail}
          onPasswordChange={setAuthPassword}
          onNameChange={setAuthName}
          onSubmit={submitAuth}
        />
        {feedbackToast}
      </>
    );
  }

  if (!session) {
    return (
      <>
        <AuthScreen
          mode={authMode}
          email={authEmail}
          password={authPassword}
          name={authName}
          loading={authLoading}
          error={authError}
          message={authMessage}
          onModeChange={changeAuthMode}
          onEmailChange={setAuthEmail}
          onPasswordChange={setAuthPassword}
          onNameChange={setAuthName}
          onSubmit={submitAuth}
        />
        {feedbackToast}
      </>
    );
  }

  if (!remoteReady || remoteLoading) {
    return (
      <main className="flex min-h-dvh w-full items-center justify-center bg-[#F0F2F5] text-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin" aria-label="Carregando dados" />
          <p className="text-sm font-semibold text-slate-500">Carregando seus dados</p>
          {remoteError && (
            <p role="alert" className="max-w-xs text-center text-xs font-medium text-rose-600">
              {remoteError}
            </p>
          )}
        </div>
        {feedbackToast}
      </main>
    );
  }

  const mobileNavItems = [
    { icon: HomeIcon, label: "Início", target: "dashboard" as NavTarget, action: () => openMobileSection("dashboard") },
    { icon: ClipboardList, label: "Edital", target: "edital" as NavTarget, action: () => openMobileSection("edital") },
    { icon: RotateCcw, label: "Revisar", target: "revisoes" as NavTarget, action: () => openMobileSection("revisoes") },
    { icon: CalendarDays, label: "Plano", target: "cronograma" as NavTarget, action: () => openMobileSection("cronograma") },
    { icon: BarChart3, label: "Dados", target: "simulados" as NavTarget, action: () => openMobileSection("simulados") },
  ];
  const hideMobileBottomNav =
    adminView ||
    timerFocusOpen ||
    subjectModal.open ||
    suggestionOpen ||
    archiveModalOpen ||
    Boolean(confirmDialog);

  const mobileBottomNav = mobileNavPortalReady
    ? createPortal(
        <nav
          aria-label="Navegação mobile"
          className={`${hideMobileBottomNav ? "hidden" : "grid"} mobile-bottom-nav grid-cols-5 overflow-hidden border-t border-white/70 bg-white/[0.92] px-2 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-14px_34px_rgba(15,23,42,0.14)] backdrop-blur-xl xl:hidden`}
        >
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.target;
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-1 text-[10px] font-bold transition sm:text-[11px] ${
                  active
                    ? "bg-blue-50 text-[#1877F2] shadow-sm ring-1 ring-blue-100"
                    : "text-slate-500 hover:bg-slate-100 hover:text-[#1877F2]"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </nav>,
        document.body,
      )
    : null;

  return (
    <main className="min-h-dvh w-full max-w-full bg-[#F0F2F5] text-[#111827]">
      {subjectModal.open && (
        <SubjectModal
          subject={subjectModal.subject}
          onSave={(data) =>
            subjectModal.subject
              ? updateSubject(subjectModal.subject.id, data)
              : addSubject(data)
          }
          onClose={() => setSubjectModal({ open: false })}
        />
      )}

      {timerFocusOpen && (
        <FocusTimer
          timerRunning={timerRunning}
          timerSeconds={timerSeconds}
          hourGoal={hourGoal}
          questionGoal={questionGoal}
          pendingTodayCount={pendingToday.length}
          subjects={subjects}
          topics={topics}
          pendingReviews={pendingToday}
          topicById={topicById}
          onToggle={toggleTimer}
          onReset={resetTimer}
          onClose={closeFocusTimer}
          onFinishSession={finishSession}
        />
      )}

      {feedbackToast}

      <SuggestionModal
        open={suggestionOpen}
        categoria={suggestionCategory}
        mensagem={suggestionMessage}
        loading={suggestionLoading}
        onCategoryChange={setSuggestionCategory}
        onMessageChange={setSuggestionMessage}
        onSubmit={submitSuggestion}
        onClose={() => setSuggestionOpen(false)}
      />

      <ArchiveEditalModal
        open={archiveModalOpen}
        counts={{
          topics: topics.length,
          reviews: reviews.length,
          goals: goals.length,
          exams: exams.length,
          questionLogs: questionLogs.length,
        }}
        password={archivePassword}
        loading={archiveLoading}
        error={archiveError}
        onPasswordChange={setArchivePassword}
        onSubmit={confirmArchiveAll}
        onClose={closeArchiveModal}
      />

      <ConfirmDialog
        open={Boolean(confirmDialog)}
        title={confirmDialog?.title ?? ""}
        description={confirmDialog?.description ?? ""}
        details={confirmDialog?.details}
        confirmLabel={confirmDialog?.confirmLabel}
        onConfirm={confirmPendingAction}
        onClose={closeConfirmDialog}
      />

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-white/10 bg-[linear-gradient(180deg,#0F172A_0%,#102A5C_58%,#1877F2_140%)] p-3 text-white shadow-2xl shadow-blue-950/20 xl:block">
        <div className="mb-8 flex items-center gap-3 px-2 py-3">
          <StudlikeLogo size={40} className="rounded-xl shadow-lg shadow-blue-950/25 ring-1 ring-white/15" />
          <div>
            <p className="text-sm font-bold">Studlike</p>
            <p className="text-xs font-medium text-blue-100/60">Plano de estudos</p>
          </div>
        </div>
        <nav aria-label="Navegação principal">
          <NavButton icon={HomeIcon} label="Dashboard" active={activeSection === "dashboard"} onClick={() => scrollToSection("dashboard")} />
          <NavButton icon={ClipboardList} label="Edital" active={activeSection === "edital"} onClick={() => scrollToSection("edital")} />
          <NavButton icon={RotateCcw} label="Revisões" active={activeSection === "revisoes"} onClick={() => scrollToSection("revisoes")} />
          <NavButton icon={CalendarDays} label="Cronograma" active={activeSection === "cronograma"} onClick={() => scrollToSection("cronograma")} />
          <NavButton icon={BarChart3} label="Simulados" active={activeSection === "simulados"} onClick={() => scrollToSection("simulados")} />
        </nav>
        <button
          type="button"
          onClick={openArchiveModal}
          aria-label="Arquivar edital atual"
          className="absolute bottom-4 left-3 right-3 flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/20 hover:bg-white/[0.16] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          <Archive className="h-4 w-4" aria-hidden="true" />
          <span className="hidden xl:inline">Arquivar edital</span>
        </button>
      </aside>

      {/* Main content */}
      <section className="w-full max-w-full overflow-x-hidden pb-[calc(5.5rem+env(safe-area-inset-bottom))] xl:ml-64 xl:w-auto xl:pb-0">
        {updateAvailable && (
          <div className="sticky top-0 z-30 border-b border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 shadow-sm md:px-6 xl:px-8">
            <div className="mx-auto flex max-w-[1600px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold">
                Nova versão disponível. Atualize para receber as melhorias.
              </p>
              <button
                type="button"
                aria-label="Recarregar aplicativo"
                onClick={refreshAppVersion}
                className="flex h-10 w-fit items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white ring-1 ring-emerald-600/20 hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Recarregar app
              </button>
            </div>
          </div>
        )}
        <header className="sticky top-0 z-20 w-full border-b border-white/70 bg-white/[0.82] px-4 py-3 shadow-sm shadow-slate-900/5 backdrop-blur-xl md:px-6 md:py-4 xl:px-8">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <StudlikeLogo size={40} className="shrink-0 rounded-xl xl:hidden" />
                <div className="min-w-0">
                  <p className="bg-gradient-to-r from-[#1877F2] via-[#1B74E4] to-[#0F172A] bg-clip-text text-[11px] font-bold uppercase tracking-[0.14em] text-transparent">
                    {adminView ? "Admin" : readOnlyUser ? "Modo leitura" : sectionTitle[activeSection]}
                  </p>
                  <h1 className="mt-0.5 truncate text-xl font-semibold tracking-normal text-slate-950 sm:text-2xl md:text-3xl">
                    {adminView ? "Área admin" : readOnlyUser ? readOnlyUser.email : "Studlike"}
                  </h1>
                </div>
              </div>
              <p className="mt-2 hidden text-sm leading-6 text-slate-500 xl:block">
                Alertas, edital verticalizado e metas do dia em uma tela.
              </p>
              <p className="mt-1 truncate text-xs font-medium text-slate-400 sm:mt-2">
                {session.user.email}
              </p>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {/* Sync status indicator */}
              {syncStatus !== "idle" && (
                <span
                  aria-live="polite"
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold transition ${
                    syncStatus === "saving" || syncStatus === "pending"
                      ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
                      : syncStatus === "saved"
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                      : "bg-rose-50 text-rose-700 ring-1 ring-rose-100"
                  }`}
                >
                  {(syncStatus === "saving" || syncStatus === "pending") && (
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                  )}
                  {syncStatus === "saved" && <Check className="h-3 w-3" aria-hidden="true" />}
                  {syncStatus === "saving" ? "Salvando…" : syncStatus === "pending" ? "Aguardando…" : syncStatus === "saved" ? "Salvo" : "Erro ao salvar"}
                </span>
              )}

              <button
                type="button"
                onClick={() => setSuggestionOpen(true)}
                disabled={Boolean(readOnlyUser)}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1877F2] px-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-[#1B74E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
                <span className="truncate">Sugerir melhoria</span>
              </button>

              <button
                type="button"
                onClick={openArchiveModal}
                disabled={Boolean(readOnlyUser)}
                aria-label="Arquivar edital atual"
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-900/5 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-40 xl:hidden"
              >
                <Archive className="h-4 w-4" aria-hidden="true" />
                <span className="truncate">Arquivar edital</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={adminView ? () => setAdminView(false) : openAdminView}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-900/5 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                >
                  {adminView ? <AppWindow className="h-4 w-4" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
                  <span className="truncate">{adminView ? "Voltar ao app" : "Admin"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={openFocusTimer}
                aria-label="Abrir modo foco"
                className="hidden h-11 items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-4 text-sm font-bold text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 sm:flex"
              >
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
                <span className="truncate">
                  {timerRunning ? `Foco ${formatTimer(timerSeconds)}` : "Iniciar foco"}
                </span>
              </button>

              <button
                type="button"
                onClick={refreshAppVersion}
                disabled={refreshingApp}
                aria-label="Atualizar aplicativo"
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm shadow-slate-900/5 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:cursor-wait disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${refreshingApp ? "animate-spin" : ""}`} aria-hidden="true" />
                <span className="truncate">Atualizar</span>
              </button>

              <button
                type="button"
                onClick={signOut}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm shadow-slate-900/5 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sair
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1600px] space-y-5 overflow-x-hidden p-4 md:space-y-6 md:p-6 xl:p-8">
          {readOnlyUser && !adminView && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-4">
              <div>
                <p className="text-sm font-bold">Visualização em modo leitura</p>
                <p className="mt-1 text-sm text-blue-700">
                  Você está vendo o app de {readOnlyUser.email}. Alterações e salvamento estão bloqueados.
                </p>
              </div>
              <button
                type="button"
                onClick={exitReadOnlyMode}
                className="mt-3 flex h-10 items-center justify-center rounded-xl bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800 sm:mt-0"
              >
                Voltar para meus dados
              </button>
            </div>
          )}

          {adminView ? (
            <ErrorBoundary label="Admin">
              <AdminPanel
                suggestions={suggestions}
                users={adminUsers}
                usersTotal={adminUsersTotal}
                usersPage={adminUsersPage}
                usersPageSize={ADMIN_USERS_PAGE_SIZE}
                usersSearch={adminUsersSearch}
                loading={adminLoading}
                usersLoading={adminUsersLoading}
                error={adminError}
                onBack={() => setAdminView(false)}
                onRefresh={refreshAdminData}
                onStatusChange={updateSuggestionStatus}
                onUsersPageChange={loadAdminUsers}
                onUsersSearchChange={searchAdminUsers}
                onUserAction={manageAdminUser}
                onViewUser={viewUserApp}
                currentUserId={session.user.id}
              />
            </ErrorBoundary>
          ) : (
            <>
              <ErrorBoundary label="Dashboard">
                <Dashboard
                  topics={topics}
                  subjects={subjects}
                  reviews={{ pendingCount: pendingToday.length, overdueCount }}
                  questionGoal={questionGoal}
                  avgExam={avgExam}
                  generalProgress={generalProgress}
                  timerRunning={timerRunning}
                  timerLabel={formatTimer(timerSeconds)}
                  studySessions={studySessions}
                  notice={notice}
                  activeSection={activeSection}
                  onOpenFocusTimer={openFocusTimer}
                  onNavigate={navigateFromDashboard}
                  onDeleteSession={deleteStudySession}
                  nextExam={nextExam}
                />
              </ErrorBoundary>

              <ErrorBoundary label="Edital">
                <Edital
                  subjects={subjects}
                  topics={topics}
                  newTopicText={newTopicText}
                  selectedSubject={selectedSubject}
                  activeSection={activeSection}
                  onTopicTextChange={setNewTopicText}
                  onSubjectChange={setSelectedSubject}
                  onStatusChange={updateTopicStatus}
                  onDifficultyChange={updateTopicDifficulty}
                  onAddTopics={addTopicsFromText}
                  onDeleteTopic={deleteTopic}
                  onAddSubject={() => {
                    if (preventReadOnlyAction()) return;
                    setSubjectModal({ open: true });
                  }}
                  onEditSubject={(subject) => {
                    if (preventReadOnlyAction()) return;
                    setSubjectModal({ open: true, subject });
                  }}
                  onDeleteSubject={deleteSubject}
                  onImportReadyEdital={importReadyEdital}
                />
              </ErrorBoundary>

              {(activeSection === "edital" || activeSection === "revisoes") && (
                <ErrorBoundary label="Revisões">
                  <Reviews
                    reviews={reviews}
                    topics={topicById}
                    subjects={subjectById}
                    todayIso={todayIso}
                    activeSection={activeSection}
                    onComplete={completeReview}
                    onReschedule={rescheduleReview}
                  />
                </ErrorBoundary>
              )}

              <section
                className={`${
                  activeSection === "cronograma" || activeSection === "simulados" ? "grid" : "hidden"
                } gap-5 xl:grid 2xl:grid-cols-2`}
              >
                <ErrorBoundary label="Cronograma">
                  <Schedule
                    schedule={schedule}
                    subjects={subjects}
                    subjectById={subjectById}
                    activeSection={activeSection}
                    onModeChange={(mode: PlanningMode) => {
                      if (preventReadOnlyAction()) return;
                      setSchedule((s) => ({ ...s, modo: mode }));
                      setNotice(`Planejamento alterado para ${mode === "semanal" ? "semanal" : "ciclos"}.`);
                    }}
                    onHorasChange={(h: number) => {
                      if (preventReadOnlyAction()) return;
                      setSchedule((s) => ({ ...s, horasDia: h }));
                      setNotice(`Meta diária atualizada para ${h} hora${h !== 1 ? "s" : ""}.`);
                    }}
                    onUpdateSemanal={updateSemanal}
                    onAddExamDate={addExamDate}
                    onDeleteExamDate={deleteExamDate}
                  />
                </ErrorBoundary>

                <ErrorBoundary label="Simulados">
                  <Exams
                    subjects={subjects}
                    topics={topics}
                    exams={exams}
                    questionLogs={questionLogs}
                    goals={goals}
                    examDraft={examDraft}
                    selectedManualTopic={selectedManualTopic}
                    manualDate={manualDate}
                    activeSection={activeSection}
                    onExamDraftChange={setExamDraft}
                    onAddExam={addExam}
                    onDeleteExam={deleteExam}
                    onManualTopicChange={setSelectedManualTopic}
                    onManualDateChange={setManualDate}
                    onAddManualReview={addManualReview}
                    onUpdateGoalObjective={updateGoalObjective}
                    onAddQuestionLog={addQuestionLog}
                    onDeleteQuestionLog={deleteQuestionLog}
                  />
                </ErrorBoundary>
              </section>
            </>
          )}
        </div>
      </section>

      {mobileBottomNav}
    </main>
  );
}

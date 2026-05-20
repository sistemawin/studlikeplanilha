"use client";

import {
  Archive,
  AppWindow,
  BarChart3,
  CalendarDays,
  Check,
  BookOpenText,
  CircleEllipsis,
  ClipboardList,
  HomeIcon,
  House,
  Loader2,
  Maximize2,
  MessageSquarePlus,
  NotebookPen,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { StudlikeLogo } from "@/components/ui/StudlikeLogo";
import { AppBrand } from "@/components/ui/AppBrand";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentProps } from "react";
import { createPortal } from "react-dom";
import { getSupabaseBrowserClient, getSupabasePasswordVerifierClient } from "@/services/supabase/client";
import { loadRemoteState, serializeAppState } from "@/services/supabase/sync";
import { syncAppState } from "@/services/sync/coordinator";
import { persistLocally, loadPersisted, loadLastPersisted } from "@/services/persistence/local";
import { hasPendingSync } from "@/services/queue/syncQueue";
import { addDays, feedbackToneFromMessage, formatTimer, isoDate, pct } from "@/lib/utils";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useTimerStore } from "@/store/timer";
import { useAuthState } from "@/hooks/useAuthState";
import { useAdminActions } from "@/hooks/useAdminActions";
import { useReadyEditals } from "@/hooks/useReadyEditals";
import { useStudyActions } from "@/hooks/useStudyActions";
import { useTimerController } from "@/hooks/useTimerController";
import { useSubjectActions } from "@/hooks/useSubjectActions";
import { useTopicActions } from "@/hooks/useTopicActions";
import { useTopicMutations } from "@/hooks/useTopicMutations";
import { replaceOfficialReadyEdital } from "@/services/supabase/readyEditals";
import { defaultGoals, defaultSchedule } from "@/lib/seed";
import type {
  AppState,
  ConfirmDialogState,
  Goal,
  Exam,
  NavTarget,
  PlanningMode,
  QuestionLog,
  ReadOnlyUser,
  Review,
  StudySession,
  Subject,
  SyncStatus,
  Topic,
} from "@/types";
import type { ReadyEdital } from "@/lib/readyEditals";
import { AuthScreen } from "@/features/auth/components/AuthScreen";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { NavButton } from "@/components/ui/NavButton";
import { SubjectModal } from "@/features/subjects/components/SubjectModal";
import { Dashboard } from "@/features/dashboard/components/Dashboard";
import { Edital } from "@/features/subjects/components/Edital";
import { Reviews } from "@/features/revisions/components/Reviews";
import { Schedule } from "@/features/planner/components/Schedule";
import { Exams } from "@/features/statistics/components/Exams";
import { FocusTimer } from "@/features/timer/components/FocusTimer";
import { SuggestionModal } from "@/features/admin/components/SuggestionModal";
import { ArchiveEditalModal } from "@/features/subjects/components/ArchiveEditalModal";
import { AdminPanel } from "@/features/admin/components/AdminPanel";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AppFeedbackToast, type AppFeedback } from "@/components/shared/AppFeedbackToast";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";

const SYNC_DEBOUNCE_MS = 700;
const DAY_KEYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const SECTION_TITLE: Record<string, string> = {
  dashboard: "Hoje",
  edital: "Edital",
  revisoes: "Revisões",
  cronograma: "Plano",
  simulados: "Dados",
};

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
  const [readOnlyUser, setReadOnlyUser] = useState<ReadOnlyUser | null>(null);
  const [notice, setNoticeState] = useState("Pronto para estudar.");
  const [feedback, setFeedback] = useState<AppFeedback | null>(null);
  const [mobileNavPortalReady, setMobileNavPortalReady] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  // ── Timer state (Zustand) ─────────────────────────────────────────────────
  const timerRunning = useTimerStore((s) => s.running);
  const timerSeconds = useTimerStore((s) => s.seconds);
  const timerFocusOpen = useTimerStore((s) => s.focusOpen);
  const timerDefaultSubjectId = useTimerStore((s) => s.defaultSubjectId);
  const timerDefaultTopicId = useTimerStore((s) => s.defaultTopicId);

  // ── Auth state (hook) ─────────────────────────────────────────────────────
  const {
    session,
    authReady,
    authMode,
    authEmail, setAuthEmail,
    authPassword, setAuthPassword,
    authName, setAuthName,
    authLoading,
    authError,
    authMessage,
    changeAuthMode,
    submitAuth,
  } = useAuthState(setNotice);

  const {
    readyEditals,
    readyEditalsLoading,
    readyEditalsError,
    reloadReadyEditals,
  } = useReadyEditals(Boolean(session));

  // ── Archive modal state ──────────────────────────────────────────────────
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [archivePassword, setArchivePassword] = useState("");
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveError, setArchiveError] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [pendingReadyEdital, setPendingReadyEdital] = useState<ReadyEdital | null>(null);
  const [replaceReadyEditalLoading, setReplaceReadyEditalLoading] = useState(false);
  const [replaceReadyEditalError, setReplaceReadyEditalError] = useState("");

  // ── Subject modal state ───────────────────────────────────────────────────
  const [subjectModal, setSubjectModal] = useState<{ open: boolean; subject?: Subject }>({ open: false });

  // ── Suggestion modal state ────────────────────────────────────────────────
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [suggestionCategory, setSuggestionCategory] = useState("Melhoria de design");
  const [suggestionMessage, setSuggestionMessage] = useState("");
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  // ── Admin state (hook) ────────────────────────────────────────────────────
  const {
    isAdmin,
    adminView, setAdminView,
    suggestions,
    adminUsers,
    adminUsersTotal,
    adminUsersPage,
    adminUsersSearch,
    adminLoading,
    adminUsersLoading,
    adminError,
    ADMIN_USERS_PAGE_SIZE,
    loadAdminSuggestions,
    loadAdminUsers,
    searchAdminUsers,
    manageAdminUser,
    updateSuggestionStatus,
    openAdminView,
    refreshAdminData,
    viewUserApp,
  } = useAdminActions({
    session,
    setNotice,
    setConfirmDialog,
    applyAppState,
    setReadOnlyUser,
    setActiveSection,
  });

  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [refreshingApp, setRefreshingApp] = useState(false);
  const currentAppVersionRef = useRef("");

  // ── Modal visibility for hideMobileBottomNav ──────────────────────────────
  const [sessionHistoryOpen, setSessionHistoryOpen] = useState(false);
  const [reviewFocusModeOpen, setReviewFocusModeOpen] = useState(false);

  // ── Reminder state ────────────────────────────────────────────────────────
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("20:00");

  // ── Sync status ───────────────────────────────────────────────────────────
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [isOnlineState, setIsOnlineState] = useState(
    () => (typeof navigator !== "undefined" ? navigator.onLine : true),
  );
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackIdRef = useRef(0);

  // ── Remote sync state ─────────────────────────────────────────────────────
  const [remoteReady, setRemoteReady] = useState(false);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState("");
  const [offlineUserId, setOfflineUserId] = useState<string | null>(null);
  const lastSyncedStateRef = useRef("");
  const latestStateRef = useRef<AppState | null>(null);
  const latestSerializedStateRef = useRef("");
  const pendingSyncRef = useRef(false);
  const syncInFlightRef = useRef(false);

  function setNotice(message: string, tone = feedbackToneFromMessage(message)) {
    setNoticeState(message);
    feedbackIdRef.current += 1;
    setFeedback({ id: feedbackIdRef.current, message, tone });
  }

  const closeFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

  function bootFromPersisted(userId: string, state: AppState, message: string) {
    applyAppState(state);
    setOfflineUserId(userId);
    setRemoteError("");
    setRemoteLoading(false);
    setRemoteReady(true);
    lastSyncedStateRef.current = "";
    latestStateRef.current = state;
    latestSerializedStateRef.current = serializeAppState(state);
    setNotice(message);
  }

  function retryOfflineBoot() {
    const persisted = loadLastPersisted();
    if (persisted) {
      bootFromPersisted(persisted.userId, persisted.state, "Você está offline. Usando dados locais.");
      return;
    }
    window.location.reload();
  }

  // ── Load reminder prefs from localStorage (SSR-safe: must be in effect) ──
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage unavailable on SSR; effect is the correct pattern
    setReminderEnabled(localStorage.getItem("studlike_reminder_enabled") === "true");
    setReminderTime(localStorage.getItem("studlike_reminder_time") || "20:00");
  }, []);

  // ── Fire reminder notification ────────────────────────────────────────────
  useEffect(() => {
    if (!reminderEnabled || !remoteReady || typeof Notification === "undefined") return;
    const lastShown = localStorage.getItem("studlike_reminder_last_date");
    if (lastShown === todayIso) return;
    const now = new Date();
    const [h, m] = reminderTime.split(":").map(Number);
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    if (now < target) return;
    const pendingCount = reviews.filter((r) => !r.concluida && r.dataAgendada <= todayIso).length;
    if (pendingCount === 0) return;

    function showNotification() {
      new Notification("StudLike Foco — Revisões pendentes", {
        body: `Você tem ${pendingCount} revisão${pendingCount !== 1 ? "ões" : ""} pendente${pendingCount !== 1 ? "s" : ""} para hoje.`,
        icon: "/icon-192.png",
        tag: "studlike-review-reminder",
      });
      localStorage.setItem("studlike_reminder_last_date", todayIso);
    }

    if (Notification.permission === "granted") {
      showNotification();
    } else if (Notification.permission === "default") {
      void Notification.requestPermission().then((permission) => {
        if (permission === "granted") showNotification();
      });
    }
  }, [reminderEnabled, reminderTime, reviews, remoteReady, todayIso]);

  function updateReminderEnabled(value: boolean) {
    setReminderEnabled(value);
    localStorage.setItem("studlike_reminder_enabled", String(value));
    if (value && typeof Notification !== "undefined" && Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }

  function updateReminderTime(value: string) {
    setReminderTime(value);
    localStorage.setItem("studlike_reminder_time", value);
  }

  // ── Timer tick ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => useTimerStore.getState().increment(), 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  useScrollLock(timerFocusOpen);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- document.body unavailable on SSR; effect is the correct pattern
    setMobileNavPortalReady(true);
  }, []);

  // ── Online / offline detection ────────────────────────────────────────────
  useEffect(() => {
    function handleOnline() { setIsOnlineState(true); }
    function handleOffline() { setIsOnlineState(false); }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ── Offline-first boot ───────────────────────────────────────────────────
  useEffect(() => {
    if (session || offlineUserId || remoteReady) return;

    let cancelled = false;
    function tryLoadLocal(message: string) {
      const persisted = loadLastPersisted();
      if (cancelled || !persisted) return false;
      bootFromPersisted(persisted.userId, persisted.state, message);
      return true;
    }

    if (!isOnlineState) {
      tryLoadLocal("Você está offline. Usando dados locais.");
    }

    const timeoutId = window.setTimeout(() => {
      tryLoadLocal("Conexão instável. Usando dados locais.");
    }, 6000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [session, offlineUserId, remoteReady, isOnlineState]);

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

  // ── Load remote data on login ─────────────────────────────────────────────
  useEffect(() => {
    if (!session) {
      if (offlineUserId) return;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on logout is intentional
      setRemoteReady(false);
      setRemoteError("");
      setReadOnlyUser(null);
      lastSyncedStateRef.current = "";
      // clearPersisted() is intentionally NOT called here.
      // It is only called from the profile logout flow so that offline data survives
      // whenever session becomes null for non-logout reasons (token refresh
      // failure, getSession() timeout, etc.).
      return;
    }

    let cancelled = false;
    const supabase = getSupabaseBrowserClient();
    const userId = session.user.id;

    async function load() {
      if (offlineUserId === userId) {
        const localState = loadPersisted(userId);
        if (localState) {
          applyAppState(localState);
          lastSyncedStateRef.current = "";
          latestStateRef.current = localState;
          latestSerializedStateRef.current = serializeAppState(localState);
          setOfflineUserId(null);
          setRemoteReady(true);
          setRemoteLoading(false);
          setRemoteError("");
          setNotice("Conexão restaurada. Sincronizando dados locais.");
          return;
        }
      }

      setRemoteLoading(true);
      setRemoteReady(false);
      setRemoteError("");
      try {
        const remote = await loadRemoteState(supabase, userId);
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
        persistLocally(userId, remote);
        setOfflineUserId(null);
        lastSyncedStateRef.current = serializeAppState(remote);
        setNotice("Dados carregados com segurança.");
        setRemoteReady(true);
      } catch (err) {
        if (cancelled) return;
        // Remote unavailable: try local fallback so the user can work offline
        const localState = loadPersisted(userId);
        if (localState) {
          setSubjects(localState.subjects);
          setTopics(localState.topics);
          setReviews(localState.reviews);
          setSchedule(localState.schedule);
          setGoals(localState.goals);
          setExams(localState.exams);
          setQuestionLogs(localState.questionLogs);
          setStudySessions(localState.studySessions);
          setSelectedSubject(localState.subjects[0]?.id ?? "");
          setSelectedManualTopic(localState.topics[0]?.id ?? "");
          lastSyncedStateRef.current = ""; // force sync when online
          setRemoteReady(true);
          setNotice("Sem conexão. Usando dados locais. Sincronizando quando reconectar.");
        } else {
          const msg = err instanceof Error ? err.message : "Não foi possível carregar dados.";
          setRemoteError(msg);
          setNotice(msg);
        }
      } finally {
        if (!cancelled) setRemoteLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [session, offlineUserId]);

  // ── Debounced sync ────────────────────────────────────────────────────────
  // isOnlineState is in deps so the effect re-fires on reconnect, triggering
  // a sync flush when there are unsynced changes (lastSyncedStateRef stale).
  useEffect(() => {
    const syncUserId = session?.user.id ?? offlineUserId;
    if (!syncUserId || !remoteReady) return;
    if (readOnlyUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- guard: no sync in read-only mode
      setSyncStatus("idle");
      return;
    }

    const state: AppState = { subjects, topics, reviews, schedule, goals, exams, questionLogs, studySessions };
    const serialized = serializeAppState(state);
    latestStateRef.current = state;
    latestSerializedStateRef.current = serialized;

    const hasUnsyncedChanges = serialized !== lastSyncedStateRef.current;
    const hasPending = session ? hasPendingSync(session.user.id) : false;

    if (!hasUnsyncedChanges && !hasPending) {
      setSyncStatus("idle");
      return;
    }

    if (!session || !isOnlineState) {
      persistLocally(syncUserId, state);
      setSyncStatus("pending");
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
        const result = await syncAppState(supabase, session.user.id, stateToSave);

        if (result.status === "synced") {
          lastSyncedStateRef.current = serializedToSave;
          setRemoteError("");
          setSyncStatus("saved");
          if (savedTimeoutRef.current) window.clearTimeout(savedTimeoutRef.current);
          savedTimeoutRef.current = setTimeout(() => setSyncStatus("idle"), 2000);
        } else if (result.status === "queued") {
          setSyncStatus("pending");
        } else {
          const msg = result.error.message;
          setRemoteError(msg);
          setNotice(msg);
          setSyncStatus("error");
        }
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
  }, [subjects, topics, reviews, schedule, goals, exams, questionLogs, studySessions, session, offlineUserId, remoteReady, readOnlyUser, isOnlineState]);

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
  const completedReviewsCount = reviews.filter((r) => r.concluida).length;
  const totalQuestionsLogged = questionLogs.reduce((sum, q) => sum + q.quantidade, 0);
  const questionGoal = goals.find((g) => g.tipo === "questões") ?? { id: "", tipo: "questões" as const, valorObjetivo: 0, valorAtual: 0, dataReferencia: todayIso };
  const hourGoal = goals.find((g) => g.tipo === "horas") ?? { id: "", tipo: "horas" as const, valorObjetivo: 0, valorAtual: 0, dataReferencia: todayIso };
  const currentUserId = session?.user.id ?? offlineUserId ?? "";
  const currentUserEmail = session?.user.email ?? (offlineUserId ? "Modo offline" : "");
  const currentUserMetadata = (session?.user.user_metadata ?? {}) as Record<string, unknown>;
  const currentUserName =
    typeof currentUserMetadata.name === "string" && currentUserMetadata.name.trim()
      ? currentUserMetadata.name.trim()
      : typeof currentUserMetadata.full_name === "string" && currentUserMetadata.full_name.trim()
      ? currentUserMetadata.full_name.trim()
      : "";
  const currentUserAvatar =
    typeof currentUserMetadata.avatar_url === "string" && currentUserMetadata.avatar_url.trim()
      ? currentUserMetadata.avatar_url.trim()
      : typeof currentUserMetadata.picture === "string" && currentUserMetadata.picture.trim()
      ? currentUserMetadata.picture.trim()
      : "";
  const avgExam = Math.round(
    exams.reduce((sum, e) => sum + (e.acertos / e.total) * 100, 0) / exams.length,
  );

  const nextExam = [...(schedule.provas ?? [])]
    .filter((p) => p.data >= todayIso)
    .sort((a, b) => a.data.localeCompare(b.data))[0];

  const next7DaysIso = addDays(new Date(), 7);
  const upcomingReviewCount = reviews.filter(
    (r) => !r.concluida && r.dataAgendada > todayIso && r.dataAgendada <= next7DaysIso,
  ).length;

  const todayDayKey = DAY_KEYS[(new Date().getDay() + 6) % 7];
  const todayPlan: Subject[] =
    schedule.modo === "semanal"
      ? ((schedule.semanal[todayDayKey] ?? []).map((id) => subjectById[id]).filter(Boolean) as Subject[])
      : (() => {
          if (schedule.ciclos.length === 0) return [];
          const distinctDays = new Set(studySessions.map((s) => s.data)).size;
          const pos = distinctDays % schedule.ciclos.length;
          const subject = subjectById[schedule.ciclos[pos]];
          return subject ? [subject] : [];
        })();

  const sevenDaysAgo = addDays(new Date(), -7);
  const recentStudiedCount = topics.filter(
    (t) => t.estudadoEm && t.estudadoEm >= sevenDaysAgo,
  ).length;
  const remainingUnstudied = topics.filter((t) => t.status === "Não Estudado").length;
  const weeksToFinish =
    recentStudiedCount > 0 && remainingUnstudied > 0
      ? Math.ceil(remainingUnstudied / recentStudiedCount)
      : null;

  const homeNotice = (() => {
    if (overdueCount > 0) return `${overdueCount} revisão${overdueCount !== 1 ? "ões" : ""} atrasada${overdueCount !== 1 ? "s" : ""} — prioridade máxima.`;
    if (pendingToday.length > 0) return `${pendingToday.length} revisão${pendingToday.length !== 1 ? "ões" : ""} para hoje.`;
    if (upcomingReviewCount > 0) return `${upcomingReviewCount} revisão${upcomingReviewCount !== 1 ? "ões" : ""} nos próximos 7 dias.`;
    if (todayPlan.length > 0) return `Plano de hoje: ${todayPlan.map((s) => s.nome).join(", ")}.`;
    if (weeksToFinish !== null) return `Ritmo atual: ~${weeksToFinish} semana${weeksToFinish !== 1 ? "s" : ""} para concluir o edital.`;
    return notice;
  })();

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

  function requestReplaceReadyEdital(edital: ReadyEdital) {
    if (preventReadOnlyAction()) return;
    if (!session) {
      setNotice("Entre na sua conta para importar editais oficiais.");
      return;
    }
    setReplaceReadyEditalError("");
    setPendingReadyEdital(edital);
  }

  function closeReplaceReadyEditalDialog() {
    if (replaceReadyEditalLoading) return;
    setPendingReadyEdital(null);
    setReplaceReadyEditalError("");
  }

  async function confirmReplaceReadyEdital() {
    if (!pendingReadyEdital) return;
    if (!session) {
      setNotice("Entre na sua conta para substituir editais oficiais.");
      return;
    }

    const edital = pendingReadyEdital;
    const supabase = getSupabaseBrowserClient();
    setReplaceReadyEditalLoading(true);
    setReplaceReadyEditalError("");
    try {
      setSyncStatus("saving");
      await replaceOfficialReadyEdital(supabase, edital.id);
      const remote = await loadRemoteState(supabase, session.user.id);
      applyAppState(remote);
      persistLocally(session.user.id, remote);
      setOfflineUserId(null);
      lastSyncedStateRef.current = serializeAppState(remote);
      latestStateRef.current = remote;
      latestSerializedStateRef.current = lastSyncedStateRef.current;
      setRemoteReady(true);
      setRemoteError("");
      setSyncStatus("saved");
      setPendingReadyEdital(null);
      setNotice("Edital substituído com sucesso.");
      if (savedTimeoutRef.current) window.clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = setTimeout(() => setSyncStatus("idle"), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível substituir o edital oficial.";
      setSyncStatus("error");
      setRemoteError(message);
      setReplaceReadyEditalError(message);
      setNotice(message);
    } finally {
      setReplaceReadyEditalLoading(false);
    }
  }

  // ── Topic actions (hook) ──────────────────────────────────────────────────
  const { updateTopicStatus, updateTopicDifficulty, moveTopic, editTopicTitle } = useTopicActions({
    topics, subjects, todayIso,
    setTopics, setReviews, setQuestionLogs,
    setNotice, preventReadOnlyAction,
  });

  // ── Study actions (hook) ──────────────────────────────────────────────────
  const {
    completeReview,
    addManualReview,
    rescheduleReview,
    completeAllTodayReviews,
    autoOrganizeCiclo,
    addExamDate,
    deleteExamDate,
    updateSemanal,
    addExam,
    deleteExam,
    addManualSession,
    deleteStudySession,
    addQuestionLog,
    deleteQuestionLog,
    updateGoalObjective,
  } = useStudyActions({
    reviews, subjects, topics, exams, questionLogs, studySessions,
    selectedManualTopic, manualDate, examDraft, todayIso,
    setReviews, setGoals, setExams, setQuestionLogs, setStudySessions, setSchedule, setExamDraft,
    setNotice, setConfirmDialog, preventReadOnlyAction, updateTopicStatus,
  });

  // ── Timer controller (hook) ───────────────────────────────────────────────
  const {
    openFocusTimer,
    openFocusTimerWithSubject,
    openFocusTimerWithTopic,
    toggleTimer,
    resetTimer,
    closeFocusTimer,
    finishSession,
  } = useTimerController({
    reviews, topicById, subjectById, todayIso,
    setGoals, setStudySessions, setTopics,
    setNotice, preventReadOnlyAction, completeReview,
  });

  // ── Subject actions (hook) ────────────────────────────────────────────────
  const {
    addSubject,
    updateSubject,
    deleteSubject,
  } = useSubjectActions({
    subjects, topics, reviews, questionLogs,
    selectedSubject, selectedManualTopic,
    setSubjects, setTopics, setReviews, setQuestionLogs, setSchedule,
    setSelectedSubject, setSelectedManualTopic, setSubjectModal,
    setNotice, setConfirmDialog, preventReadOnlyAction,
  });

  // ── Topic mutations (hook) ────────────────────────────────────────────────
  const { addTopicsFromText, deleteTopic } = useTopicMutations({
    topics, reviews, questionLogs,
    setTopics, setReviews, setQuestionLogs,
    setNewTopicText, setSelectedManualTopic,
    setNotice, setConfirmDialog, preventReadOnlyAction,
  });

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

  function closeConfirmDialog() {
    setConfirmDialog(null);
  }

  function confirmPendingAction() {
    const action = confirmDialog?.onConfirm;
    setConfirmDialog(null);
    action?.();
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
    setNotice("Edital apagado. Dados principais foram limpos.");
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


  function scrollToSection(target: NavTarget) {
    setAdminView(false);
    setActiveSection(target);
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openMobileSection(target: NavTarget) {
    setAdminView(false);
    setMobileMoreOpen(false);
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

  function openAddSubjectModal() {
    if (preventReadOnlyAction()) return;
    setSubjectModal({ open: true });
  }

  function openEditSubjectModal(subject: Subject) {
    if (preventReadOnlyAction()) return;
    setSubjectModal({ open: true, subject });
  }

  function handleModeChange(mode: PlanningMode) {
    if (preventReadOnlyAction()) return;
    setSchedule((s) => ({ ...s, modo: mode }));
    setNotice(`Planejamento alterado para ${mode === "semanal" ? "semanal" : "ciclos"}.`);
  }

  function handleHorasChange(h: number) {
    if (preventReadOnlyAction()) return;
    setSchedule((s) => ({ ...s, horasDia: h }));
    setNotice(`Meta diária atualizada para ${h} hora${h !== 1 ? "s" : ""}.`);
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

  if (!session && !offlineUserId && !isOnlineState) {
    return (
      <main className="flex min-h-dvh w-full items-center justify-center bg-[#F0F2F5] px-4 text-slate-950">
        <div className="w-full max-w-sm rounded-2xl border border-white bg-white p-5 text-center shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/5">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1877F2]">Você está offline</p>
          <h1 className="mt-2 text-xl font-bold text-slate-950">Não encontramos dados salvos neste dispositivo</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Entre online ao menos uma vez para salvar seus dados locais e usar o StudLike Foco sem conexão.
          </p>
          <button
            type="button"
            onClick={retryOfflineBoot}
            className="mt-4 h-11 rounded-xl bg-[#1877F2] px-4 text-sm font-bold text-white shadow-sm hover:bg-[#1B74E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            Tentar novamente
          </button>
        </div>
        {feedbackToast}
      </main>
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
    { icon: House, label: "Início", target: "dashboard" as NavTarget, action: () => openMobileSection("dashboard") },
    { icon: NotebookPen, label: "Edital", target: "edital" as NavTarget, action: () => openMobileSection("edital") },
    { icon: BookOpenText, label: "Revisar", target: "revisoes" as NavTarget, action: () => openMobileSection("revisoes") },
    { icon: CalendarDays, label: "Plano", target: "cronograma" as NavTarget, action: () => openMobileSection("cronograma") },
  ];
  const hideMobileBottomNav =
    adminView ||
    timerFocusOpen ||
    subjectModal.open ||
    suggestionOpen ||
    archiveModalOpen ||
    Boolean(pendingReadyEdital) ||
    Boolean(confirmDialog) ||
    sessionHistoryOpen ||
    reviewFocusModeOpen;

  const mobileBottomNav = mobileNavPortalReady
    ? createPortal(
        <>
          {!hideMobileBottomNav && mobileMoreOpen && (
            <div className="fixed bottom-[calc(6.35rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-[92%] max-w-md -translate-x-1/2 rounded-[24px] border border-white/40 bg-white/75 p-2 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] backdrop-blur-xl xl:hidden">
              <button
                type="button"
                onClick={() => openMobileSection("simulados")}
                aria-current={activeSection === "simulados" ? "page" : undefined}
                className={`flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-semibold transition ${
                  activeSection === "simulados"
                    ? "text-[#1877F2]"
                    : "text-slate-500 hover:bg-white/50 hover:text-[#1877F2]"
                }`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${activeSection === "simulados" ? "bg-blue-50/70" : ""}`}>
                  <BarChart3 size={22} strokeWidth={1.5} aria-hidden="true" />
                </span>
                <span className="min-w-0 truncate">Dados</span>
              </button>
            </div>
          )}

          <nav
            aria-label="Navegação mobile"
            className={`${hideMobileBottomNav ? "hidden" : "grid"} mobile-bottom-nav fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-1/2 h-[72px] w-[92%] max-w-md -translate-x-1/2 grid-cols-5 overflow-hidden rounded-[24px] border border-white/40 bg-white/75 px-2 py-2 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] backdrop-blur-xl xl:hidden`}
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
                  className={`flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl px-0.5 py-1.5 transition ${
                    active
                      ? "text-[#1877F2]"
                      : "text-slate-400 hover:text-[#1877F2]"
                  }`}
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full transition ${active ? "bg-blue-50/70" : "bg-transparent"}`}>
                    <Icon size={22} strokeWidth={1.6} aria-hidden="true" />
                  </span>
                  <span className={`w-full truncate whitespace-nowrap text-center text-[10px] leading-none tracking-normal ${active ? "font-semibold" : "font-medium"}`}>{item.label}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setMobileMoreOpen((open) => !open)}
              aria-expanded={mobileMoreOpen}
              aria-label="Abrir mais opções"
              className={`flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl px-0.5 py-1.5 transition ${
                mobileMoreOpen || activeSection === "simulados"
                  ? "text-[#1877F2]"
                  : "text-slate-400 hover:text-[#1877F2]"
              }`}
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-full transition ${mobileMoreOpen || activeSection === "simulados" ? "bg-blue-50/70" : "bg-transparent"}`}>
                <CircleEllipsis size={22} strokeWidth={1.6} aria-hidden="true" />
              </span>
              <span className={`w-full truncate whitespace-nowrap text-center text-[10px] leading-none tracking-normal ${mobileMoreOpen || activeSection === "simulados" ? "font-semibold" : "font-medium"}`}>Mais</span>
            </button>
          </nav>
        </>,
        document.body,
      )
    : null;

  const dashboardProps: ComponentProps<typeof Dashboard> = {
    topics,
    subjects,
    reviews: { pendingCount: pendingToday.length, overdueCount, totalCompleted: completedReviewsCount },
    questionGoal,
    avgExam,
    generalProgress,
    timerRunning,
    timerLabel: formatTimer(timerSeconds),
    studySessions,
    notice: homeNotice,
    activeSection,
    onOpenFocusTimer: openFocusTimer,
    onStudySubject: openFocusTimerWithSubject,
    onStudyTopic: openFocusTimerWithTopic,
    onNavigate: navigateFromDashboard,
    onDeleteSession: deleteStudySession,
    onAddManualSession: addManualSession,
    nextExam,
    todayPlan,
    examCount: exams.length,
    totalQuestionsLogged,
    historyOpen: sessionHistoryOpen,
    onHistoryOpenChange: setSessionHistoryOpen,
  };

  const editalProps: ComponentProps<typeof Edital> = {
    subjects,
    topics,
    newTopicText,
    selectedSubject,
    activeSection,
    onTopicTextChange: setNewTopicText,
    onSubjectChange: setSelectedSubject,
    onStatusChange: updateTopicStatus,
    onDifficultyChange: updateTopicDifficulty,
    onAddTopics: () => addTopicsFromText(newTopicText, selectedSubject),
    onDeleteTopic: (topicId: string) => deleteTopic(topicId, selectedManualTopic),
    onEditTopic: editTopicTitle,
    onMoveTopic: moveTopic,
    onAddSubject: openAddSubjectModal,
    onEditSubject: openEditSubjectModal,
    onDeleteSubject: deleteSubject,
    readyEditals,
    readyEditalsLoading,
    readyEditalsError,
    onRetryReadyEditals: reloadReadyEditals,
    onImportReadyEdital: requestReplaceReadyEdital,
  };

  const scheduleProps: ComponentProps<typeof Schedule> = {
    schedule,
    subjects,
    subjectById,
    activeSection,
    onModeChange: handleModeChange,
    onHorasChange: handleHorasChange,
    onUpdateSemanal: updateSemanal,
    onAddExamDate: addExamDate,
    onDeleteExamDate: deleteExamDate,
    onAutoOrganizeCiclo: autoOrganizeCiclo,
    reminderEnabled,
    reminderTime,
    onReminderEnabledChange: updateReminderEnabled,
    onReminderTimeChange: updateReminderTime,
  };

  const examsProps: ComponentProps<typeof Exams> = {
    subjects,
    topics,
    exams,
    questionLogs,
    goals,
    examDraft,
    selectedManualTopic,
    manualDate,
    activeSection,
    onExamDraftChange: setExamDraft,
    onAddExam: addExam,
    onDeleteExam: deleteExam,
    onManualTopicChange: setSelectedManualTopic,
    onManualDateChange: setManualDate,
    onAddManualReview: addManualReview,
    onUpdateGoalObjective: updateGoalObjective,
    onAddQuestionLog: addQuestionLog,
    onDeleteQuestionLog: deleteQuestionLog,
    reviews,
    todayIso,
    studySessions,
    onDifficultyChange: updateTopicDifficulty,
  };

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
          defaultSubjectId={timerDefaultSubjectId}
          defaultTopicId={timerDefaultTopicId}
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

      <ConfirmDialog
        open={Boolean(pendingReadyEdital)}
        title="Substituir edital atual?"
        description="Ao adicionar este edital, seu plano atual será substituído. As matérias, tópicos, progresso e revisões do edital anterior serão apagados para manter apenas um edital ativo por vez."
        details={[
          "Também serão removidos cronograma, ciclos, questões e sessões de estudo vinculadas ao edital anterior.",
          "Simulados e metas configuradas serão preservados; o progresso diário das metas será reiniciado.",
          replaceReadyEditalError ? `Erro: ${replaceReadyEditalError}` : "",
        ].filter(Boolean).join("\n\n")}
        confirmLabel="Substituir edital"
        cancelLabel="Cancelar"
        loading={replaceReadyEditalLoading}
        onConfirm={() => { void confirmReplaceReadyEdital(); }}
        onClose={closeReplaceReadyEditalDialog}
      />

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-white/70 bg-white/[0.92] p-3 text-slate-950 shadow-2xl shadow-slate-950/10 backdrop-blur-xl xl:block">
        <div className="mb-6 rounded-2xl bg-slate-50 px-3 py-3.5 ring-1 ring-slate-900/5">
          <AppBrand logoSize={44} showSubtitle />
        </div>
        <nav aria-label="Navegação principal" className="space-y-2">
          <NavButton icon={HomeIcon} label="Início" active={activeSection === "dashboard"} onClick={() => scrollToSection("dashboard")} />
          <NavButton icon={ClipboardList} label="Edital" active={activeSection === "edital"} onClick={() => scrollToSection("edital")} />
          <NavButton icon={RotateCcw} label="Revisar" active={activeSection === "revisoes"} onClick={() => scrollToSection("revisoes")} />
          <NavButton icon={CalendarDays} label="Plano" active={activeSection === "cronograma"} onClick={() => scrollToSection("cronograma")} />
          <NavButton icon={BarChart3} label="Dados" active={activeSection === "simulados"} onClick={() => scrollToSection("simulados")} />
        </nav>
        <button
          type="button"
          onClick={openArchiveModal}
          aria-label="Apagar edital atual"
          className="absolute bottom-4 left-3 right-3 flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 shadow-sm shadow-slate-900/5 transition hover:bg-slate-100 hover:text-[#1877F2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          <Archive className="h-4 w-4" aria-hidden="true" />
          <span className="hidden xl:inline">Apagar edital</span>
        </button>
      </aside>

      {/* Main content */}
      <section className="min-w-0 w-full max-w-full overflow-x-hidden pb-[calc(7rem+env(safe-area-inset-bottom))] xl:ml-64 xl:w-auto xl:pb-0">
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
          <div className="mx-auto flex max-w-[1600px] flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <StudlikeLogo size={44} className="shrink-0 rounded-xl shadow-sm shadow-slate-900/10 ring-1 ring-slate-900/5 xl:hidden" />
                  <div className="min-w-0">
                    <p className="bg-gradient-to-r from-[#1877F2] via-[#1B74E4] to-[#0F172A] bg-clip-text text-[11px] font-bold uppercase tracking-[0.16em] text-transparent">
                      {adminView ? "Admin" : readOnlyUser ? "Modo leitura" : SECTION_TITLE[activeSection]}
                    </p>
                    <h1 className="mt-0.5 truncate text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                      {adminView ? "Área admin" : readOnlyUser ? readOnlyUser.email : "StudLike Foco"}
                    </h1>
                  </div>
                </div>
                <p className="mt-2 hidden text-sm leading-6 text-slate-500 xl:block">
                  Alertas, edital verticalizado e metas do dia em uma tela.
                </p>
                <p className="mt-1 truncate text-xs font-medium text-slate-400 sm:mt-2">
                  {currentUserEmail}
                </p>
              </div>
              <Link
                href="/profile"
                aria-label="Abrir perfil e conta"
                className="mt-0.5 shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
              >
                <ProfileAvatar
                  name={currentUserName}
                  email={currentUserEmail}
                  avatarUrl={currentUserAvatar}
                  sizeClass="h-10 w-10 md:h-11 md:w-11 text-sm"
                />
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
                aria-label="Apagar edital atual"
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-900/5 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-40 xl:hidden"
              >
                <Archive className="h-4 w-4" aria-hidden="true" />
                <span className="truncate">Apagar edital</span>
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

            </div>
          </div>
        </header>

        <div className="mx-auto min-w-0 w-full max-w-[1600px] space-y-5 overflow-x-hidden p-4 md:space-y-6 md:p-6 xl:p-8">
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
                currentUserId={currentUserId}
              />
            </ErrorBoundary>
          ) : (
            <>
              <ErrorBoundary label="Dashboard">
                <Dashboard {...dashboardProps} />
              </ErrorBoundary>

              <ErrorBoundary label="Edital">
                <Edital {...editalProps} />
              </ErrorBoundary>

              {(activeSection === "edital" || activeSection === "revisoes") && (
                <ErrorBoundary label="Revisões">
                  <Reviews
                    reviews={reviews}
                    topics={topicById}
                    subjects={subjectById}
                    todayIso={todayIso}
                    activeSection={activeSection}
                    focusModeOpen={reviewFocusModeOpen}
                    onFocusModeOpenChange={setReviewFocusModeOpen}
                    onComplete={completeReview}
                    onReschedule={rescheduleReview}
                    onCompleteAll={completeAllTodayReviews}
                  />
                </ErrorBoundary>
              )}

              <section
                className={`${
                  activeSection === "cronograma" || activeSection === "simulados" ? "grid" : "hidden"
                } min-w-0 w-full max-w-full gap-5 overflow-hidden xl:grid 2xl:grid-cols-2`}
              >
                <ErrorBoundary label="Cronograma">
                  <Schedule {...scheduleProps} />
                </ErrorBoundary>

                <ErrorBoundary label="Simulados">
                  <Exams {...examsProps} />
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

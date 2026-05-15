"use client";

import {
  Archive,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  ClipboardList,
  HomeIcon,
  ListChecks,
  Loader2,
  LogOut,
  Maximize2,
  RotateCcw,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { loadRemoteState, saveRemoteState, serializeAppState } from "@/lib/sync";
import { addDays, formatTimer, isoDate, pct } from "@/lib/utils";
import { goalsSeed, scheduleSeed, subjectsSeed, topicsSeed } from "@/lib/seed";
import type {
  AppState,
  AuthMode,
  Difficulty,
  Goal,
  MockExam,
  NavTarget,
  PlanningMode,
  Review,
  ReviewType,
  Subject,
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

const SYNC_DEBOUNCE_MS = 700;

export default function Home() {
  // Computed fresh every render — never stale if tab stays open overnight
  const todayIso = isoDate(new Date());

  // ── App state ─────────────────────────────────────────────────────────────
  const [subjects, setSubjects] = useState<Subject[]>(subjectsSeed);
  const [topics, setTopics] = useState<Topic[]>(topicsSeed);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [schedule, setSchedule] = useState(scheduleSeed);
  const [goals, setGoals] = useState<Goal[]>(goalsSeed);
  const [exams, setExams] = useState<MockExam[]>([]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [newTopicText, setNewTopicText] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(subjectsSeed[0].id);
  const [selectedManualTopic, setSelectedManualTopic] = useState(topicsSeed[0].id);
  const [manualDate, setManualDate] = useState(() => addDays(new Date(), 5));
  const [examDraft, setExamDraft] = useState({ nome: "", acertos: 0, total: 0 });
  const [activeSection, setActiveSection] = useState<NavTarget>("dashboard");
  const [notice, setNotice] = useState("Pronto para estudar.");

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

  // ── Subject modal state ───────────────────────────────────────────────────
  const [subjectModal, setSubjectModal] = useState<{ open: boolean; subject?: Subject }>({ open: false });

  // ── Remote sync state ─────────────────────────────────────────────────────
  const [remoteReady, setRemoteReady] = useState(false);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState("");
  const lastSyncedStateRef = useRef("");
  const latestStateRef = useRef<AppState | null>(null);
  const latestSerializedStateRef = useRef("");
  const pendingSyncRef = useRef(false);
  const syncInFlightRef = useRef(false);

  // ── Timer tick ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  // ── Auth init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const supabase = getSupabaseBrowserClient();
      supabase.auth
        .getSession()
        .then(({ data }) => setSession(data.session))
        .catch((err: unknown) => {
          setAuthError(err instanceof Error ? err.message : "Não foi possível carregar a sessão.");
        })
        .finally(() => setAuthReady(true));

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
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
        setSelectedSubject(remote.subjects[0]?.id ?? "");
        setSelectedManualTopic(remote.topics[0]?.id ?? "");
        lastSyncedStateRef.current = serializeAppState(remote);
        setNotice("Dados carregados do Supabase.");
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

  // ── Debounced sync ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session || !remoteReady) return;

    const state: AppState = { subjects, topics, reviews, schedule, goals, exams };
    const serialized = serializeAppState(state);
    latestStateRef.current = state;
    latestSerializedStateRef.current = serialized;

    if (serialized === lastSyncedStateRef.current) return;

    async function runSync() {
      if (!session || !latestStateRef.current) return;
      if (syncInFlightRef.current) { pendingSyncRef.current = true; return; }

      const stateToSave = latestStateRef.current;
      const serializedToSave = latestSerializedStateRef.current;
      const supabase = getSupabaseBrowserClient();
      syncInFlightRef.current = true;

      try {
        await saveRemoteState(supabase, session.user.id, stateToSave);
        lastSyncedStateRef.current = serializedToSave;
        setRemoteError("");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Não foi possível salvar no Supabase.";
        setRemoteError(msg);
        setNotice(msg);
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
  }, [subjects, topics, reviews, schedule, goals, exams, session, remoteReady]);

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
  const questionGoal = goals.find((g) => g.tipo === "questões") ?? goalsSeed[0];
  const hourGoal = goals.find((g) => g.tipo === "horas") ?? goalsSeed[1];
  const avgExam = Math.round(
    exams.reduce((sum, e) => sum + (e.acertos / e.total) * 100, 0) / exams.length,
  );

  const sectionTitle: Record<NavTarget, string> = {
    dashboard: "Hoje",
    edital: "Edital",
    revisoes: "Revisões",
    cronograma: "Plano",
    simulados: "Dados",
  };

  // ── Actions ───────────────────────────────────────────────────────────────
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

  function updateTopicStatus(topicId: string, status: TopicStatus) {
    const current = topics.find((t) => t.id === topicId);
    if (!current) return;
    const next = { ...current, status, estudadoEm: status === "Não Estudado" ? undefined : todayIso };
    setTopics((ts) => ts.map((t) => (t.id === topicId ? next : t)));
    if (status === "Questões Feitas" || status === "Revisado") scheduleReviews(next);
  }

  function updateTopicDifficulty(topicId: string, difficulty: Difficulty) {
    setTopics((ts) => ts.map((t) => (t.id === topicId ? { ...t, dificuldade: difficulty } : t)));
  }

  function addTopicsFromText() {
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

  function completeReview(reviewId: string) {
    setReviews((rs) => rs.map((r) => (r.id === reviewId ? { ...r, concluida: true } : r)));
    setNotice("Revisão concluída.");
  }

  function addExam() {
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

  function registerQuestions() {
    setGoals((gs) =>
      gs.map((g) => (g.tipo === "questões" ? { ...g, valorAtual: g.valorAtual + 10 } : g)),
    );
    setNotice("10 questões registradas.");
  }

  function addSubject(data: { nome: string; peso: number; cor: string }) {
    const newSubject: Subject = { id: crypto.randomUUID(), ...data };
    setSubjects((ss) => [...ss, newSubject]);
    setSelectedSubject(newSubject.id);
    setSubjectModal({ open: false });
    setNotice(`Matéria "${data.nome}" criada.`);
  }

  function updateSubject(id: string, data: { nome: string; peso: number; cor: string }) {
    setSubjects((ss) => ss.map((s) => (s.id === id ? { ...s, ...data } : s)));
    setSubjectModal({ open: false });
    setNotice(`Matéria "${data.nome}" atualizada.`);
  }

  function deleteSubject(subjectId: string) {
    const subject = subjects.find((s) => s.id === subjectId);
    const topicsInSubject = topics.filter((t) => t.materiaId === subjectId);
    const topicIds = new Set(topicsInSubject.map((t) => t.id));
    const label = subject?.nome ?? "matéria";
    const confirmed = window.confirm(
      `Excluir "${label}"? ${topicsInSubject.length > 0 ? `${topicsInSubject.length} tópico${topicsInSubject.length !== 1 ? "s" : ""} e suas revisões serão removidos. ` : ""}Essa ação não pode ser desfeita.`,
    );
    if (!confirmed) return;

    const remainingSubjects = subjects.filter((s) => s.id !== subjectId);
    const remainingTopics = topics.filter((t) => t.materiaId !== subjectId);

    setSubjects(remainingSubjects);
    setTopics(remainingTopics);
    setReviews((rs) => rs.filter((r) => !topicIds.has(r.topicoId)));
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

  function archiveAll() {
    const ok = window.confirm("Arquivar o edital atual? Isso limpa tópicos, revisões, metas e simulados.");
    if (!ok) return;
    setTopics([]);
    setReviews([]);
    setGoals([
      { id: crypto.randomUUID(), tipo: "questões", valorObjetivo: 50, valorAtual: 0 },
      { id: crypto.randomUUID(), tipo: "horas", valorObjetivo: 4, valorAtual: 0 },
    ]);
    setExams([]);
    // Reset selectors — topics no longer exist
    setSelectedManualTopic("");
    setNotice("Edital arquivado. Dados principais foram limpos.");
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

  async function submitAuth() {
    setAuthError("");
    setAuthMessage("");
    if (!authEmail.trim() || !authPassword) { setAuthError("Preencha e-mail e senha."); return; }
    if (authPassword.length < 6) { setAuthError("A senha precisa ter pelo menos 6 caracteres."); return; }
    setAuthLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
          options: { data: { name: authName.trim() } },
        });
        if (error) throw error;
        if (!data.session) { setAuthMessage("Conta criada. Confirme seu e-mail para entrar."); return; }
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
    setActiveSection(target);
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openMobileSection(target: NavTarget) {
    setActiveSection(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Loading & auth gates ──────────────────────────────────────────────────
  if (!authReady) {
    return (
      <main className="flex min-h-dvh w-full items-center justify-center bg-[#f7f7f8] text-blue-700">
        <Loader2 className="h-7 w-7 animate-spin" aria-label="Carregando" />
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
        onModeChange={(next) => { setAuthMode(next); setAuthError(""); setAuthMessage(""); }}
        onEmailChange={setAuthEmail}
        onPasswordChange={setAuthPassword}
        onNameChange={setAuthName}
        onSubmit={submitAuth}
      />
    );
  }

  if (!remoteReady || remoteLoading) {
    return (
      <main className="flex min-h-dvh w-full items-center justify-center bg-[#f7f7f8] text-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin" aria-label="Carregando dados" />
          <p className="text-sm font-semibold text-slate-600">Carregando dados do Supabase</p>
          {remoteError && (
            <p role="alert" className="max-w-xs text-center text-xs font-medium text-rose-600">
              {remoteError}
            </p>
          )}
        </div>
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

  return (
    <main className="min-h-dvh w-full max-w-full overflow-x-hidden bg-[#f7f7f8] text-slate-950">
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
          onToggle={toggleTimer}
          onReset={resetTimer}
          onClose={closeFocusTimer}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-20 border-r border-slate-900 bg-[#050505] p-3 text-white shadow-xl shadow-slate-900/10 lg:block xl:w-64">
        <div className="mb-8 flex items-center gap-3 px-2 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-950 shadow-sm">
            <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="hidden xl:block">
            <p className="text-sm font-semibold">Studlike</p>
            <p className="text-xs text-slate-400">Plano de estudos</p>
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
          onClick={archiveAll}
          aria-label="Arquivar edital atual"
          className="absolute bottom-4 left-3 right-3 flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          <Archive className="h-4 w-4" aria-hidden="true" />
          <span className="hidden xl:inline">Arquivar edital</span>
        </button>
      </aside>

      {/* Main content */}
      <section className="w-full max-w-full overflow-x-hidden pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:ml-20 lg:w-auto lg:pb-0 xl:ml-64">
        <header className="sticky top-0 z-20 w-full border-b border-slate-200 bg-white/92 px-4 py-3 shadow-sm shadow-slate-900/5 backdrop-blur-xl md:px-8 md:py-4">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white lg:hidden">
                  <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
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
                aria-label="Abrir modo foco"
                className="hidden h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm shadow-slate-900/15 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 sm:flex"
              >
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
                <span className="truncate">
                  {timerRunning ? `Foco ${formatTimer(timerSeconds)}` : "Iniciar foco"}
                </span>
              </button>
              <button
                onClick={registerQuestions}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
              >
                <ListChecks className="h-4 w-4" aria-hidden="true" />
                <span className="truncate">Questões</span>
              </button>
              <button
                onClick={signOut}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sair
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-7xl space-y-5 overflow-x-hidden p-4 md:space-y-6 md:p-8">
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
              notice={notice}
              activeSection={activeSection}
              onOpenFocusTimer={openFocusTimer}
              onNavigate={openMobileSection}
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
              onAddSubject={() => setSubjectModal({ open: true })}
              onEditSubject={(subject) => setSubjectModal({ open: true, subject })}
              onDeleteSubject={deleteSubject}
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
              />
            </ErrorBoundary>
          )}

          <section
            className={`${
              activeSection === "cronograma" || activeSection === "simulados" ? "grid" : "hidden"
            } gap-5 lg:grid xl:grid-cols-2`}
          >
            <ErrorBoundary label="Cronograma">
              <Schedule
                schedule={schedule}
                subjects={subjects}
                subjectById={subjectById}
                activeSection={activeSection}
                onModeChange={(mode: PlanningMode) => setSchedule((s) => ({ ...s, modo: mode }))}
                onHorasChange={(h: number) => setSchedule((s) => ({ ...s, horasDia: h }))}
              />
            </ErrorBoundary>

            <ErrorBoundary label="Simulados">
              <Exams
                subjects={subjects}
                topics={topics}
                exams={exams}
                goals={goals}
                examDraft={examDraft}
                selectedManualTopic={selectedManualTopic}
                manualDate={manualDate}
                activeSection={activeSection}
                onExamDraftChange={setExamDraft}
                onAddExam={addExam}
                onManualTopicChange={setSelectedManualTopic}
                onManualDateChange={setManualDate}
                onAddManualReview={addManualReview}
              />
            </ErrorBoundary>
          </section>
        </div>
      </section>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Navegação mobile"
        className="fixed inset-x-0 bottom-0 z-30 grid w-full grid-cols-5 overflow-hidden border-t border-slate-200 bg-white/96 px-2 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden"
      >
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.target;
          return (
            <button
              key={item.label}
              onClick={item.action}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-1 text-[10px] font-bold transition sm:text-[11px] ${
                active
                  ? "bg-slate-950 text-white shadow-sm shadow-slate-900/15"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </main>
  );
}

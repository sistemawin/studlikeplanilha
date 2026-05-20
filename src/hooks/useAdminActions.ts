"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/services/supabase/client";
import { validateSchedule } from "@/services/supabase/sync";
import { defaultGoals, defaultSchedule } from "@/lib/seed";
import type {
  AdminUser,
  AdminUserAction,
  AdminUserRow,
  AppState,
  ConfirmDialogState,
  NavTarget,
  ReadOnlyUser,
  Suggestion,
  SuggestionRow,
  SuggestionStatus,
} from "@/types";

const ADMIN_USERS_PAGE_SIZE = 20;

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

type Deps = {
  session: Session | null;
  setNotice: (message: string) => void;
  setConfirmDialog: (dialog: ConfirmDialogState | null) => void;
  applyAppState: (state: AppState) => void;
  setReadOnlyUser: (user: ReadOnlyUser | null) => void;
  setActiveSection: (section: NavTarget) => void;
};

export function useAdminActions({
  session,
  setNotice,
  setConfirmDialog,
  applyAppState,
  setReadOnlyUser,
  setActiveSection,
}: Deps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminView, setAdminView] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminUsersTotal, setAdminUsersTotal] = useState(0);
  const [adminUsersPage, setAdminUsersPage] = useState(0);
  const [adminUsersSearch, setAdminUsersSearch] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminError, setAdminError] = useState("");

  // ── Reset on logout ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset admin state on logout is intentional
      setIsAdmin(false);
      setAdminView(false);
      setSuggestions([]);
      setAdminUsers([]);
      setAdminUsersTotal(0);
      setAdminUsersPage(0);
      setAdminUsersSearch("");
    }
  }, [session]);

  // ── Check admin access ─────────────────────────────────────────────────────
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
        if (error) { setIsAdmin(false); return; }
        setIsAdmin(Boolean(data));
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    }

    void checkAdmin();
    return () => { cancelled = true; };
  }, [session]);

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
        name: row.name ?? undefined,
        username: row.username ?? undefined,
        avatarUrl: row.avatar_url ?? undefined,
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

  function manageAdminUser(user: AdminUser, action: AdminUserAction) {
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
        onConfirm: () => { void confirmManageAdminUser(user, action); },
      });
      return;
    }
    void confirmManageAdminUser(user, action);
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
    setNotice("Atualizando dados administrativos.");
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
      setReadOnlyUser({
        id: user.id,
        email: user.email || user.id,
        name: user.name,
        username: user.username,
        avatarUrl: user.avatarUrl,
      });
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

  return {
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
  };
}

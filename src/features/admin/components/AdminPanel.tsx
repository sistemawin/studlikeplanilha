import { ArrowLeft, Ban, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Eye, RefreshCw, Search, ShieldCheck, Trash2, User, UserCog, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { AdminUser, Suggestion, SuggestionStatus } from "@/types";

type Props = {
  suggestions: Suggestion[];
  users: AdminUser[];
  usersTotal: number;
  usersPage: number;
  usersPageSize: number;
  usersSearch: string;
  loading: boolean;
  usersLoading: boolean;
  error: string;
  onBack: () => void;
  onRefresh: () => void;
  onStatusChange: (id: string, status: SuggestionStatus) => void;
  onUsersPageChange: (page: number) => void;
  onUsersSearchChange: (value: string) => void;
  onUserAction: (user: AdminUser, action: "block" | "unblock" | "delete" | "promote") => void;
  onViewUser: (user: AdminUser) => void;
  currentUserId: string;
};

const STATUS_OPTIONS: SuggestionStatus[] = ["nova", "lida", "planejada", "resolvida", "arquivada"];

function statusLabel(status: SuggestionStatus) {
  const labels: Record<SuggestionStatus, string> = {
    nova: "Nova",
    lida: "Lida",
    planejada: "Planejada",
    resolvida: "Resolvida",
    arquivada: "Arquivada",
  };
  return labels[status];
}

function formatDate(value: string | null) {
  if (!value) return "Nunca";
  if (value === "infinity") return "Bloqueado";
  return new Date(value).toLocaleString("pt-BR");
}

function isUserBlocked(user: AdminUser) {
  if (!user.bannedUntil) return false;
  if (user.bannedUntil === "infinity") return true;
  return new Date(user.bannedUntil).getTime() > Date.now();
}

export function AdminPanel({
  suggestions,
  users,
  usersTotal,
  usersPage,
  usersPageSize,
  usersSearch,
  loading,
  usersLoading,
  error,
  onBack,
  onRefresh,
  onStatusChange,
  onUsersPageChange,
  onUsersSearchChange,
  onUserAction,
  onViewUser,
  currentUserId,
}: Props) {
  const [usersCollapsed, setUsersCollapsed] = useState(false);
  const [searchDraft, setSearchDraft] = useState(usersSearch);
  const openCount = suggestions.filter((item) => item.status === "nova").length;
  const totalPages = Math.max(1, Math.ceil(usersTotal / usersPageSize));
  const pageStart = usersTotal === 0 ? 0 : usersPage * usersPageSize + 1;
  const pageEnd = Math.min(usersTotal, (usersPage + 1) * usersPageSize);
  const hasPreviousUsersPage = usersPage > 0 && !usersLoading;
  const hasNextUsersPage = usersPage + 1 < totalPages && !usersLoading;

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-white bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.07)] ring-1 ring-slate-900/5 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1877F2] text-white shadow-lg shadow-blue-600/20">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="bg-gradient-to-r from-[#1877F2] via-[#1B74E4] to-[#0F172A] bg-clip-text text-[11px] font-bold uppercase tracking-[0.16em] text-transparent">Admin</p>
              <h2 className="text-xl font-semibold text-slate-950">Painel geral</h2>
              <p className="text-sm text-slate-500">
                {usersTotal} usuário{usersTotal !== 1 ? "s" : ""} · {suggestions.length} sugest{suggestions.length === 1 ? "ão" : "ões"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onRefresh}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Atualizar
            </button>
            <button
              onClick={onBack}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#1877F2] px-3 text-sm font-bold text-white hover:bg-[#1B74E4]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              App
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </p>
      )}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Users className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Usuários cadastrados</h3>
              <p className="text-sm text-slate-500">
                {usersLoading
                  ? "Carregando página..."
                  : `${pageStart}-${pageEnd} de ${usersTotal}`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setUsersCollapsed((collapsed) => !collapsed)}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              {usersCollapsed ? <ChevronDown className="h-4 w-4" aria-hidden="true" /> : <ChevronUp className="h-4 w-4" aria-hidden="true" />}
              {usersCollapsed ? "Expandir" : "Minimizar"}
            </button>
            <button
              type="button"
              onClick={() => onUsersPageChange(usersPage - 1)}
              disabled={!hasPreviousUsersPage}
              aria-label="Página anterior de usuários"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="min-w-20 text-center text-sm font-semibold text-slate-600">
              {usersPage + 1}/{totalPages}
            </span>
            <button
              type="button"
              onClick={() => onUsersPageChange(usersPage + 1)}
              disabled={!hasNextUsersPage}
              aria-label="Próxima página de usuários"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {!usersCollapsed && (
          <div className="border-b border-slate-100 p-4 sm:p-5">
            <label className="block">
              <span className="sr-only">Pesquisar usuário</span>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <input
                    type="search"
                    value={searchDraft}
                    onChange={(event) => setSearchDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") onUsersSearchChange(searchDraft);
                    }}
                    placeholder="Pesquisar por e-mail ou ID"
                    className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onUsersSearchChange(searchDraft)}
                  className="flex h-11 items-center justify-center rounded-xl bg-[#1877F2] px-4 text-sm font-bold text-white hover:bg-[#1B74E4]"
                >
                  Pesquisar
                </button>
                {usersSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchDraft("");
                      onUsersSearchChange("");
                    }}
                    className="flex h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </label>
          </div>
        )}

        {!usersCollapsed && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 sm:px-5">E-mail</th>
                <th scope="col" className="px-4 py-3 sm:px-5">Criado em</th>
                <th scope="col" className="px-4 py-3 sm:px-5">Último acesso</th>
                <th scope="col" className="px-4 py-3 sm:px-5">Status</th>
                <th scope="col" className="px-4 py-3 sm:px-5">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usersLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-5 text-sm font-medium text-slate-500 sm:px-5">
                    Carregando usuários...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-5 text-sm font-medium text-slate-500 sm:px-5">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const blocked = isUserBlocked(user);
                  const isCurrentUser = user.id === currentUserId;

                  return (
                    <tr key={user.id} className="align-top">
                      <td className="max-w-[260px] break-words px-4 py-3 font-semibold text-slate-900 sm:px-5">
                        {user.email || "Sem e-mail"}
                        {user.name && (
                          <span className="mt-1 block text-xs font-semibold text-slate-600">{user.name}</span>
                        )}
                        {user.username && (
                          <span className="mt-0.5 block text-xs font-medium text-slate-400">@{user.username}</span>
                        )}
                        <span className="mt-1 block font-mono text-xs font-medium text-slate-400">{user.id}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 sm:px-5">{formatDate(user.createdAt)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 sm:px-5">{formatDate(user.lastSignInAt)}</td>
                      <td className="px-4 py-3 sm:px-5">
                        <div className="flex flex-wrap gap-2">
                          <span className={`rounded-lg px-2 py-1 text-xs font-bold ${blocked ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                            {blocked ? "Bloqueado" : "Ativo"}
                          </span>
                          {user.isAdmin && (
                            <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                              Admin
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        <div className="flex min-w-[310px] flex-wrap gap-2">
                          <Link
                            href={`/profile?userId=${encodeURIComponent(user.id)}`}
                            className="flex h-9 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100"
                          >
                            <User className="h-3.5 w-3.5" aria-hidden="true" />
                            Ver perfil
                          </Link>
                          <button
                            type="button"
                            onClick={() => onViewUser(user)}
                            disabled={usersLoading}
                            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                            Ver app
                          </button>
                          <button
                            type="button"
                            onClick={() => onUserAction(user, blocked ? "unblock" : "block")}
                            disabled={usersLoading || isCurrentUser}
                            className={`flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 ${
                              blocked
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                            }`}
                          >
                            <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                            {blocked ? "Desbloquear" : "Bloquear"}
                          </button>
                          <button
                            type="button"
                            onClick={() => onUserAction(user, "delete")}
                            disabled={usersLoading || isCurrentUser}
                            className="flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Excluir
                          </button>
                          <button
                            type="button"
                            onClick={() => onUserAction(user, "promote")}
                            disabled={usersLoading || user.isAdmin}
                            className="flex h-9 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <UserCog className="h-3.5 w-3.5" aria-hidden="true" />
                            {user.isAdmin ? "Admin" : "Promover"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        )}
      </section>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Sugestões dos usuários</h3>
            <p className="text-sm text-slate-500">
              {suggestions.length} enviada{suggestions.length !== 1 ? "s" : ""} · {openCount} nova{openCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {loading ? (
          <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm font-medium text-slate-500">
            Carregando sugestões...
          </p>
        ) : suggestions.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm font-medium text-slate-500">
            Nenhuma sugestão recebida ainda.
          </p>
        ) : (
          suggestions.map((suggestion) => (
            <article key={suggestion.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                      {suggestion.categoria}
                    </span>
                    <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                      {statusLabel(suggestion.status)}
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">
                    {suggestion.mensagem}
                  </p>
                  <p className="mt-3 text-xs font-medium text-slate-400">
                    {suggestion.email} · {new Date(suggestion.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
                <label className="sr-only" htmlFor={`suggestion-status-${suggestion.id}`}>
                  Status da sugestão
                </label>
                <select
                  id={`suggestion-status-${suggestion.id}`}
                  value={suggestion.status}
                  onChange={(e) => onStatusChange(suggestion.id, e.target.value as SuggestionStatus)}
                  className="h-10 shrink-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{statusLabel(status)}</option>
                  ))}
                </select>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

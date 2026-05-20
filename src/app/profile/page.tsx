"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Camera, Loader2, LogOut, ShieldAlert, Trash2 } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";
import { AppBrand } from "@/components/ui/AppBrand";
import { getSupabaseBrowserClient } from "@/services/supabase/client";
import { clearPersisted } from "@/services/persistence/local";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { ProfileField } from "@/features/profile/components/ProfileField";
import { AccountAction } from "@/features/profile/components/AccountAction";
import { uploadUserAvatar } from "@/features/profile/services/avatarUpload";

function formatDate(value?: string | null) {
  if (!value) return "Não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function metadataValue(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

type AdminProfile = {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl: string;
  createdAt: string;
  lastSignInAt: string;
  plan: string;
  status: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewedUserId = searchParams.get("userId")?.trim() ?? "";
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [adminProfileLoading, setAdminProfileLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const isViewingAnotherProfile = Boolean(viewedUserId && viewedUserId !== session?.user.id);

  useEffect(() => {
    let alive = true;
    const supabase = getSupabaseBrowserClient();

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!alive) return;
        if (sessionError) throw sessionError;
        setSession(data.session);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Não foi possível carregar seu perfil.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (alive) setSession(nextSession);
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session || !isViewingAnotherProfile) {
      setAdminProfile(null);
      return;
    }

    let alive = true;
    const supabase = getSupabaseBrowserClient();
    setAdminProfileLoading(true);
    setError("");

    void (async () => {
      try {
        const { data, error: profileError } = await supabase
          .rpc("admin_get_user_profile", { p_target_user_id: viewedUserId });
        if (!alive) return;
        if (profileError) throw profileError;
        const row = data as {
          id?: string;
          email?: string;
          name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
          last_sign_in_at?: string | null;
          plan?: string | null;
          banned_until?: string | null;
          is_admin?: boolean | null;
          error?: string;
        } | null;
        if (!row || row.error) throw new Error(row?.error || "Perfil não encontrado.");
        setAdminProfile({
          id: row.id ?? viewedUserId,
          email: row.email || "E-mail não informado",
          name: row.name || "Nome não informado",
          username: row.username || "Não informado",
          avatarUrl: row.avatar_url || "",
          createdAt: formatDate(row.created_at),
          lastSignInAt: formatDate(row.last_sign_in_at),
          plan: row.plan || "Conta gratuita",
          status: row.banned_until && row.banned_until !== "infinity" && new Date(row.banned_until).getTime() <= Date.now()
            ? row.is_admin ? "Admin" : "Ativo"
            : row.banned_until ? "Bloqueado" : row.is_admin ? "Admin" : "Ativo",
        });
      } catch (err: unknown) {
        if (!alive) return;
        setAdminProfile(null);
        setError(err instanceof Error ? err.message : "Não foi possível carregar o perfil do usuário.");
      } finally {
        if (alive) setAdminProfileLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [session, isViewingAnotherProfile, viewedUserId]);

  const profile = useMemo(() => {
    if (adminProfile) {
      return {
        name: adminProfile.name,
        email: adminProfile.email,
        username: adminProfile.username,
        avatarUrl: adminProfile.avatarUrl,
        createdAt: adminProfile.createdAt,
        plan: adminProfile.plan,
        id: adminProfile.id,
        lastSignInAt: adminProfile.lastSignInAt,
        status: adminProfile.status,
      };
    }

    const user = session?.user;
    const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const name = metadataValue(metadata, ["name", "full_name", "display_name"]);
    const username = metadataValue(metadata, ["username", "user_name", "preferred_username"]);
    const avatarUrl = metadataValue(metadata, ["avatar_url", "picture"]);

    return {
      name: name || "Nome não informado",
      email: user?.email ?? "E-mail não informado",
      username: username || "Não informado",
      avatarUrl,
      createdAt: formatDate(user?.created_at),
      plan: metadataValue(metadata, ["plan", "account_type"]) || "Conta gratuita",
      id: user?.id ?? "Não informado",
      lastSignInAt: "Não informado",
      status: "Ativo",
    };
  }, [adminProfile, session]);

  useEffect(() => {
    if (adminProfile) {
      setName(adminProfile.name === "Nome não informado" ? "" : adminProfile.name);
      setUsername(adminProfile.username === "Não informado" ? "" : adminProfile.username);
      return;
    }

    const metadata = (session?.user.user_metadata ?? {}) as Record<string, unknown>;
    const nextName = metadataValue(metadata, ["name", "full_name", "display_name"]);
    const nextUsername = metadataValue(metadata, ["username", "user_name", "preferred_username"]);

    setName(nextName);
    setUsername(nextUsername);
  }, [adminProfile, session]);

  function showAvatarMessage() {
    if (isViewingAnotherProfile) return;
    setError("");
    setMessage("");
    avatarInputRef.current?.click();
  }

  async function changeAvatar(file: File | undefined) {
    if (!file || !session || isViewingAnotherProfile) return;

    setAvatarUploading(true);
    setError("");
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      const avatarUrl = await uploadUserAvatar(supabase, session.user.id, file);
      const { data, error: updateError } = await supabase.auth.updateUser({
        data: {
          ...session.user.user_metadata,
          avatar_url: avatarUrl,
        },
      });

      if (updateError) throw updateError;
      if (data.user) {
        setSession((current) => current ? { ...current, user: data.user } : current);
      }
      setMessage("Foto atualizada com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar a foto.");
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  async function signOut() {
    setSigningOut(true);
    setError("");
    try {
      clearPersisted();
      const { error: signOutError } = await getSupabaseBrowserClient().auth.signOut();
      if (signOutError) throw signOutError;
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível sair.");
    } finally {
      setSigningOut(false);
    }
  }

  async function handleUpdateProfile() {
    if (!session || isViewingAnotherProfile) return;

    const trimmedName = name.trim();
    const trimmedUsername = username.trim();
    const supabase = getSupabaseBrowserClient();

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({ id: session.user.id, name: trimmedName, username: trimmedUsername }, { onConflict: "id" });

      if (profileError) throw profileError;

      const { data, error: userError } = await supabase.auth.updateUser({
        data: {
          ...session.user.user_metadata,
          name: trimmedName,
          username: trimmedUsername,
        },
      });

      if (userError) throw userError;
      if (data.user) {
        setSession((current) => current ? { ...current, user: data.user } : current);
      }
      setMessage("Perfil atualizado com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar seu perfil.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F0F2F5] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-white/70 bg-white/[0.86] px-4 py-3 shadow-sm shadow-slate-900/5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Voltar"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm shadow-slate-900/5 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <AppBrand logoSize={36} showSubtitle={false} />
          <span className="h-10 w-10" aria-hidden="true" />
        </div>
      </header>

      <section className="mx-auto flex max-w-2xl flex-col px-4 py-7 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <div className="text-center">
          <div className="flex justify-center">
            <ProfileAvatar
              name={profile.name}
              email={profile.email}
              avatarUrl={profile.avatarUrl}
            />
          </div>
          <button
            type="button"
            onClick={showAvatarMessage}
            disabled={avatarUploading || !session || isViewingAnotherProfile}
            className="mt-3 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-[#1877F2] hover:text-[#1B74E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            <Camera size={14} strokeWidth={1.6} aria-hidden="true" />
            {isViewingAnotherProfile ? "Perfil em modo leitura" : avatarUploading ? "Enviando..." : "Alterar foto"}
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => { void changeAvatar(event.target.files?.[0]); }}
          />
          <h1 className="mt-4 text-xl font-bold leading-7 text-slate-800">
            {name.trim() || profile.name}
          </h1>
          <p className="mt-1 text-sm font-normal leading-5 text-slate-400">
            {profile.email}
          </p>
        </div>

        {(message || error) && (
          <div
            className={`mt-4 rounded-2xl px-4 py-3 text-sm font-semibold leading-5 ${
              error
                ? "bg-rose-50 text-rose-700 ring-1 ring-rose-100"
                : "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
            }`}
          >
            {error || message}
          </div>
        )}

        {loading || adminProfileLoading ? (
          <div className="mt-4 rounded-2xl border border-white bg-white p-5 text-sm font-semibold text-slate-500 shadow-sm">
            Carregando perfil…
          </div>
        ) : !session ? (
          <div className="mt-4 rounded-2xl border border-white bg-white p-5 text-center shadow-sm">
            <p className="text-sm font-bold text-slate-950">Sessão não encontrada</p>
            <p className="mt-1 text-sm font-medium text-slate-500">Entre novamente para acessar sua conta.</p>
            <button
              type="button"
              onClick={() => router.replace("/")}
              className="mt-4 h-10 rounded-xl bg-[#1877F2] px-4 text-sm font-bold text-white hover:bg-[#1B74E4]"
            >
              Voltar para login
            </button>
          </div>
        ) : isViewingAnotherProfile && !adminProfile ? (
          <div className="mt-4 rounded-2xl border border-white bg-white p-5 text-center shadow-sm">
            <p className="text-sm font-bold text-slate-950">Perfil indisponível</p>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Não foi possível carregar os dados deste usuário no modo admin.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 rounded-3xl border border-slate-100/80 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <div className="border-b border-slate-100 py-3.5">
                <label className="mb-1 block text-[10px] font-bold uppercase leading-4 tracking-wider text-slate-400" htmlFor="profile-name">
                  Nome
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={isViewingAnotherProfile}
                  placeholder="Digite seu nome"
                  className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:font-normal placeholder:italic placeholder:text-slate-400 disabled:text-slate-700 focus:outline-none"
                />
              </div>
              <ProfileField label="E-mail" value={profile.email} />
              <div className="border-b border-slate-100 py-3.5">
                <label className="mb-1 block text-[10px] font-bold uppercase leading-4 tracking-wider text-slate-400" htmlFor="profile-username">
                  Username
                </label>
                <input
                  id="profile-username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  disabled={isViewingAnotherProfile}
                  placeholder="Digite seu username"
                  className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:font-normal placeholder:italic placeholder:text-slate-400 disabled:text-slate-700 focus:outline-none"
                />
              </div>
              {isViewingAnotherProfile && <ProfileField label="ID do usuário" value={profile.id} />}
              <ProfileField label="Criada em" value={profile.createdAt} />
              {isViewingAnotherProfile && <ProfileField label="Último acesso" value={profile.lastSignInAt} />}
              {isViewingAnotherProfile && <ProfileField label="Status" value={profile.status} />}
              <ProfileField label="Plano" value={profile.plan} />
              {!isViewingAnotherProfile && (
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => { void handleUpdateProfile(); }}
                  disabled={isSaving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-slate-800 disabled:cursor-wait disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {isSaving ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
              )}
            </div>

            {!isViewingAnotherProfile && (
            <div className="mt-6 rounded-3xl border border-slate-100/80 bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <AccountAction
                icon={<LogOut size={20} strokeWidth={1.6} aria-hidden="true" />}
                title={signingOut ? "Saindo…" : "Sair do app"}
                description="Encerra sua sessão neste dispositivo."
                disabled={signingOut}
                onClick={() => { void signOut(); }}
              />
              <AccountAction
                icon={<Trash2 size={20} strokeWidth={1.6} aria-hidden="true" />}
                title="Apagar conta"
                description="Ação permanente. Exige confirmação forte e backend dedicado."
                tone="danger"
                onClick={() => {
                  setMessage("");
                  setError("");
                  setDeleteOpen((value) => !value);
                }}
              />
            </div>
            )}

            {!isViewingAnotherProfile && deleteOpen && (
              <div className="mt-3 rounded-2xl border border-rose-100 bg-white p-4 shadow-sm shadow-slate-900/[0.03] ring-1 ring-rose-950/[0.03]">
                <div className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                    <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-rose-700">Exclusão permanente</p>
                    <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                      Esta ação precisa remover Supabase Auth, dados relacionais e storage de forma transacional. A interface está preparada, mas a exclusão definitiva ficará desativada até existir uma função segura no backend.
                    </p>
                  </div>
                </div>
                <label className="mt-4 block text-xs font-bold uppercase tracking-[0.08em] text-slate-400" htmlFor="delete-confirmation">
                  Digite APAGAR para confirmar
                </label>
                <input
                  id="delete-confirmation"
                  value={deleteConfirmation}
                  onChange={(event) => setDeleteConfirmation(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-950 outline-none focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                />
                <button
                  type="button"
                  disabled={deleteConfirmation !== "APAGAR"}
                  onClick={() => setError("Exclusão de conta ainda não está disponível com segurança.")}
                  className="mt-3 h-10 w-full rounded-xl bg-rose-600 px-4 text-sm font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-200"
                >
                  Apagar conta definitivamente
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

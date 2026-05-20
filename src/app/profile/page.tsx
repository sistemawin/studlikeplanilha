"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Camera, LogOut, ShieldAlert, Trash2 } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
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

export default function ProfilePage() {
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

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

  const profile = useMemo(() => {
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
    };
  }, [session]);

  function showAvatarMessage() {
    setError("");
    setMessage("");
    avatarInputRef.current?.click();
  }

  async function changeAvatar(file: File | undefined) {
    if (!file || !session) return;

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
            disabled={avatarUploading || !session}
            className="mt-3 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-[#1877F2] hover:text-[#1B74E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            <Camera size={14} strokeWidth={1.6} aria-hidden="true" />
            {avatarUploading ? "Enviando..." : "Alterar foto"}
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => { void changeAvatar(event.target.files?.[0]); }}
          />
          <h1 className="mt-4 text-xl font-bold leading-7 text-slate-800">
            {profile.name}
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

        {loading ? (
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
        ) : (
          <>
            <div className="mt-6 rounded-3xl border border-slate-100/80 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <ProfileField label="Nome" value={profile.name} />
              <ProfileField label="E-mail" value={profile.email} />
              <ProfileField label="Username" value={profile.username} muted={profile.username === "Não informado"} />
              <ProfileField label="Criada em" value={profile.createdAt} />
              <ProfileField label="Plano" value={profile.plan} />
            </div>

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

            {deleteOpen && (
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

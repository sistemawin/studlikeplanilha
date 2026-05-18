"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/services/supabase/client";
import type { AuthMode } from "@/types";

type SetNotice = (message: string) => void;

export function useAuthState(setNotice: SetNotice) {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  // ── Auth init: subscribe to session changes ────────────────────────────────
  useEffect(() => {
    try {
      const supabase = getSupabaseBrowserClient();
      const urlMarksPasswordRecovery =
        window.location.hash.includes("type=recovery") || window.location.search.includes("type=recovery");
      const startsOffline = typeof navigator !== "undefined" && !navigator.onLine;

      // Timeout so getSession() never hangs forever when offline (e.g. Supabase
      // tries to refresh an expired token via network). 6 s is enough for slow
      // connections online; genuinely offline fetches fail within ~1 s on most OSes.
      let authReadySignaled = false;
      const signalAuthReady = () => {
        if (!authReadySignaled) {
          authReadySignaled = true;
          setAuthReady(true);
        }
      };
      const timeoutId = window.setTimeout(signalAuthReady, 6000);

      function restoreSession() {
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
          .finally(() => {
            window.clearTimeout(timeoutId);
            signalAuthReady();
          });
      }

      if (startsOffline) {
        window.clearTimeout(timeoutId);
        signalAuthReady();
      } else {
        restoreSession();
      }

      function restoreWhenOnline() {
        restoreSession();
      }

      window.addEventListener("online", restoreWhenOnline);

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
        // Ignore automatic SIGNED_OUT when offline: it is likely a failed token
        // refresh, not an intentional logout. Explicit logouts call setSession(null)
        // directly via signOut(), so ignoring this event is safe.
        if (event === "SIGNED_OUT" && !navigator.onLine) return;
        setSession(next);
        setAuthReady(true);
      });

      return () => {
        window.clearTimeout(timeoutId);
        window.removeEventListener("online", restoreWhenOnline);
        subscription.unsubscribe();
      };
    } catch (err) {
      queueMicrotask(() => {
        setAuthReady(true);
        setAuthError(err instanceof Error ? err.message : "Erro ao configurar autenticação.");
      });
    }
  }, []);

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
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: authPassword });
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

  return {
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
    signOut,
  };
}

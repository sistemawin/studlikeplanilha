import { Loader2, LockKeyhole, Mail, ShieldCheck, UserPlus } from "lucide-react";
import { StudlikeLogo } from "@/components/StudlikeLogo";
import type { AuthMode } from "@/types";

type Props = {
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
};

export function AuthScreen({
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
}: Props) {
  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";
  const isReset = mode === "reset";
  const title = isSignup ? "Criar conta" : isForgot ? "Recuperar senha" : isReset ? "Nova senha" : "Entrar na conta";
  const description = isSignup
    ? "Cadastre seu e-mail e senha para começar."
    : isForgot
      ? "Informe seu e-mail para receber o link de recuperação."
      : isReset
        ? "Digite uma nova senha para sua conta."
        : "Use seu e-mail e senha cadastrados.";
  const submitLabel = isSignup ? "Criar conta" : isForgot ? "Enviar link de recuperação" : isReset ? "Salvar nova senha" : "Entrar";

  return (
    <main className="flex min-h-dvh w-full max-w-full items-center justify-center overflow-x-hidden bg-[#090e1a] px-4 py-6 text-slate-950 sm:py-10">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/8 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="flex min-h-0 flex-col justify-between bg-slate-950 p-5 text-white sm:p-8 lg:min-h-[560px] lg:p-10">
          <div>
            <StudlikeLogo size={44} className="rounded-xl shadow-sm" />
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 lg:mt-8">
              Studlike
            </p>
            <h1 className="mt-2 max-w-md text-2xl font-semibold tracking-normal sm:mt-3 sm:text-4xl lg:text-5xl">
              Controle real do seu plano de estudos.
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-300 sm:mt-4 sm:text-base sm:leading-7">
              Login seguro para salvar matérias, tópicos, revisões e simulados por usuário.
            </p>
          </div>

          <div className="mt-6 hidden gap-3 text-sm text-slate-300 sm:grid lg:mt-0">
            {["Dados protegidos por usuário", "Dashboard com gráficos", "Revisões e simulados salvos"].map(
              (item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="font-medium">{item}</span>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="p-5 sm:p-6 md:p-10">
          <div className="mx-auto max-w-md">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600">Acesso</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {description}
            </p>

            <div className="mt-8 space-y-4">
              {isSignup && (
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Nome</span>
                  <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                    <UserPlus className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    <input
                      value={name}
                      onChange={(e) => onNameChange(e.target.value)}
                      placeholder="Seu nome"
                      autoComplete="name"
                      className="h-full flex-1 bg-transparent text-sm outline-none"
                    />
                  </div>
                </label>
              )}

              {!isReset && (
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">E-mail</span>
                  <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                    <Mail className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => onEmailChange(e.target.value)}
                      placeholder="voce@email.com"
                      autoComplete="email"
                      onKeyDown={(e) => { if (e.key === "Enter" && isForgot) onSubmit(); }}
                      className="h-full flex-1 bg-transparent text-sm outline-none"
                    />
                  </div>
                </label>
              )}

              {!isForgot && (
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">{isReset ? "Nova senha" : "Senha"}</span>
                  <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                    <LockKeyhole className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => onPasswordChange(e.target.value)}
                      placeholder="mínimo 6 caracteres"
                      autoComplete={isSignup || isReset ? "new-password" : "current-password"}
                      onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); }}
                      className="h-full flex-1 bg-transparent text-sm outline-none"
                    />
                  </div>
                </label>
              )}

              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => onModeChange("forgot")}
                  className="text-sm font-semibold text-blue-700 hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                >
                  Esqueci minha senha
                </button>
              )}

              {error && (
                <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {error}
                </p>
              )}
              {message && (
                <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                  {message}
                </p>
              )}

              <button
                onClick={onSubmit}
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {submitLabel}
              </button>
            </div>

            <button
              onClick={() => onModeChange(isSignup || isForgot || isReset ? "login" : "signup")}
              className="mt-6 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
            >
              {isSignup || isForgot || isReset ? "Voltar para login" : "Criar uma nova conta"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

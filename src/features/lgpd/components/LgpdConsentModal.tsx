import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { TermsAcceptanceBox } from "@/features/lgpd/components/TermsAcceptanceBox";

type Props = {
  checked: boolean;
  loading: boolean;
  error?: string;
  onCheckedChange: (checked: boolean) => void;
  onAccept: () => void;
};

export function LgpdConsentModal({
  checked,
  loading,
  error,
  onCheckedChange,
  onAccept,
}: Props) {
  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-[#F0F2F5] px-4 py-6 text-slate-950">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="lgpd-consent-title"
        className="w-full max-w-xl rounded-2xl border border-white bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.14)] ring-1 ring-slate-900/5 sm:p-7"
      >
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1877F2] ring-1 ring-blue-100">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600">
              Privacidade e segurança
            </p>
            <h1 id="lgpd-consent-title" className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Atualizamos nossos Termos de Uso e Política de Privacidade
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Para continuar usando o StudLike Foco, confirme que leu e concorda com as regras de uso e tratamento de dados pessoais.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm leading-6 text-slate-700">
          <p>
            Esta confirmação é obrigatória para manter seu acesso ao aplicativo.
          </p>
          <p>
            Se você já tinha conta antes desta atualização, precisa aceitar os termos vigentes antes de continuar navegando.
          </p>
        </div>

        <div className="mt-4">
          <TermsAcceptanceBox checked={checked} onCheckedChange={onCheckedChange} />
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={onAccept}
          disabled={!checked || loading}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1877F2] text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-[#1B74E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          )}
          Continuar
        </button>
      </section>
    </main>
  );
}

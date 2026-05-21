import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { TERMS_PATH, TERMS_VERSION } from "@/features/lgpd/constants";

type Props = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function TermsAcceptanceBox({ checked, onCheckedChange }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-[#F7F8FA] p-3">
      <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600">
        <p className="font-bold text-slate-900">Termos de Uso e Política de Privacidade</p>
        <p className="mt-2">
          Ao usar o StudLike Foco, você autoriza o tratamento dos dados necessários para criar sua conta,
          autenticar seu acesso, sincronizar matérias, tópicos, revisões, simulados, metas, cronogramas e
          sessões de estudo, além de manter a segurança, suporte e melhoria do aplicativo.
        </p>
        <p className="mt-2">
          Seus dados não serão vendidos. Podemos usar fornecedores de infraestrutura, autenticação,
          banco de dados, hospedagem e armazenamento para operar o serviço, sempre conforme as finalidades
          informadas e a legislação aplicável.
        </p>
        <p className="mt-2">
          Você pode solicitar acesso, correção, exclusão, portabilidade quando aplicável, informações sobre
          compartilhamento e revogação do consentimento pelos canais oficiais do StudLike Foco.
        </p>
        <p className="mt-2">
          Versão dos termos: {TERMS_VERSION}. Leia o documento completo antes de continuar.
        </p>
      </div>

      <label className="mt-3 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onCheckedChange(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-[#1877F2] accent-[#1877F2] focus:ring-[#1877F2]"
        />
        <span className="text-sm font-medium leading-6 text-slate-700">
          <span className="block font-bold text-slate-900">Consentimento obrigatório LGPD</span>
          Li e concordo com os{" "}
          <Link
            href={TERMS_PATH}
            target="_blank"
            className="inline-flex items-center gap-1 font-bold text-blue-700 hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            Termos de Uso e Política de Privacidade
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          .
        </span>
      </label>
    </div>
  );
}

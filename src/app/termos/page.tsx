import Link from "next/link";
import { AppBrand } from "@/components/ui/AppBrand";

const UPDATED_AT = "21 de maio de 2026";

const sections = [
  {
    title: "1. Identificacao e aceite",
    body: [
      "Estes Termos de Uso e Politica de Privacidade regulam o uso do StudLike Foco, aplicativo de organizacao de estudos, revisoes, simulados, cronogramas, metas e sessoes de foco.",
      "Ao criar conta, acessar ou continuar usando o aplicativo, voce declara que leu, compreendeu e concorda com estes termos. Se nao concordar, nao utilize o aplicativo.",
    ],
  },
  {
    title: "2. Dados pessoais tratados",
    body: [
      "Podemos tratar dados de cadastro e autenticacao, como nome, e-mail, identificador de usuario, senha criptografada gerenciada pelo provedor de autenticacao, foto/avatar quando enviada e registros tecnicos de acesso.",
      "Tambem tratamos dados inseridos por voce no uso do aplicativo, como materias, topicos, cronogramas, metas, revisoes, simulados, quantidade de questoes, desempenho, sessoes de estudo, preferencias, sugestoes enviadas e dados necessarios para suporte, seguranca e sincronizacao.",
      "Nao solicite nem registre no aplicativo dados sensiveis desnecessarios, como informacoes de saude, biometria, opiniao politica, religiao, origem racial ou etnica, salvo se isso for estritamente necessario para uma finalidade definida por voce.",
    ],
  },
  {
    title: "3. Finalidades do tratamento",
    body: [
      "Usamos dados pessoais para criar e autenticar contas, manter a seguranca do acesso, salvar e sincronizar seu plano de estudos, exibir dashboards, revisoes, historico e estatisticas, recuperar senha, prestar suporte, prevenir fraude, corrigir falhas, melhorar a experiencia e cumprir obrigacoes legais ou regulatorias.",
      "O tratamento pode ocorrer com base no consentimento, execucao de contrato ou procedimentos preliminares, cumprimento de obrigacao legal ou regulatoria, exercicio regular de direitos, protecao do credito quando aplicavel e legitimo interesse, sempre observados os direitos e liberdades fundamentais do titular.",
    ],
  },
  {
    title: "4. Compartilhamento e operadores",
    body: [
      "Para operar o aplicativo, podemos usar fornecedores de infraestrutura, banco de dados, autenticacao, hospedagem, monitoramento, e-mail e armazenamento. Esses terceiros atuam conforme instrucoes, contratos e controles compativeis com a LGPD.",
      "Nao vendemos seus dados pessoais. O compartilhamento podera ocorrer quando necessario para funcionamento do servico, cumprimento de lei, ordem de autoridade competente, protecao de direitos, prevencao de fraude ou seguranca da plataforma.",
    ],
  },
  {
    title: "5. Seguranca",
    body: [
      "Adotamos medidas tecnicas e administrativas razoaveis para proteger dados pessoais, incluindo controle de acesso por usuario, politicas de seguranca no banco de dados, autenticacao, restricao de permissoes e uso de provedores especializados.",
      "Nenhum sistema e absolutamente imune a incidentes. Caso ocorra incidente relevante de seguranca envolvendo dados pessoais, avaliaremos os riscos e adotaremos as comunicacoes e providencias exigidas pela legislacao aplicavel.",
    ],
  },
  {
    title: "6. Retencao e exclusao",
    body: [
      "Os dados sao mantidos enquanto sua conta estiver ativa, enquanto forem necessarios para as finalidades informadas ou enquanto houver obrigacao legal, regulatoria, contratual, fiscal, de auditoria, prevencao a fraude ou defesa de direitos.",
      "Voce pode solicitar exclusao da conta e dos dados pessoais, observadas hipoteses legais de conservacao. Dados anonimizados ou agregados podem ser mantidos para estatisticas e melhoria do produto, sem identificacao do titular.",
    ],
  },
  {
    title: "7. Direitos do titular",
    body: [
      "Nos termos da LGPD, voce pode solicitar confirmacao de tratamento, acesso, correcao, anonimização, bloqueio ou eliminacao de dados desnecessarios ou tratados em desconformidade, portabilidade quando regulamentada, informacoes sobre compartilhamento, revogacao do consentimento e revisao de decisoes automatizadas quando aplicavel.",
      "Para exercer direitos, use os canais oficiais de suporte do StudLike Foco e informe os dados necessarios para confirmarmos sua identidade e localizarmos sua conta.",
    ],
  },
  {
    title: "8. Responsabilidades do usuario",
    body: [
      "Voce e responsavel por manter a confidencialidade da senha, usar informacoes verdadeiras, nao compartilhar acesso, nao tentar burlar controles de seguranca e nao usar o aplicativo para fins ilicitos, abusivos, ofensivos ou que violem direitos de terceiros.",
      "O StudLike Foco e uma ferramenta de organizacao. Resultados em provas, concursos ou estudos dependem de fatores externos e nao sao garantidos pelo aplicativo.",
    ],
  },
  {
    title: "9. Alteracoes dos termos",
    body: [
      "Podemos atualizar estes termos para refletir mudancas legais, tecnicas, operacionais ou de produto. Quando a atualizacao for relevante, poderemos solicitar novo aceite antes da continuidade de uso.",
      "A versao vigente sera identificada pela data de atualizacao exibida nesta pagina.",
    ],
  },
  {
    title: "10. Contato",
    body: [
      "Solicitacoes sobre privacidade, protecao de dados, suporte ou exercicio de direitos devem ser enviadas pelo canal oficial de atendimento informado pelo StudLike Foco.",
      "Antes de publicar esta pagina em producao, preencha os dados do controlador, CNPJ/CPF quando aplicavel, endereco de contato e e-mail do encarregado ou canal de privacidade.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-dvh bg-[#F0F2F5] px-4 py-8 text-slate-950 sm:py-12">
      <article className="mx-auto max-w-3xl rounded-2xl border border-white bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/5 sm:p-8">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <AppBrand />
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-[#F7F8FA] px-4 text-sm font-bold text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            Voltar
          </Link>
        </div>

        <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600">
          Ultima atualizacao: {UPDATED_AT}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Termos de Uso e Politica de Privacidade
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-500">
          Este documento e um modelo operacional para o StudLike Foco. Ele deve ser revisado por advogado antes da publicacao definitiva, especialmente para preencher os dados do controlador, canais de atendimento e eventuais particularidades comerciais.
        </p>

        <div className="mt-8 space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
              <div className="mt-3 space-y-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-7 text-slate-600">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}

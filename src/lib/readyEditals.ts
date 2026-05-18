import type { Difficulty } from "@/types";

// ── Metadata types (optional on all editais — never break existing ones) ───────

export type EditalCategoria =
  | "policia"
  | "tribunal"
  | "fiscal"
  | "bancario"
  | "militar"
  | "enem"
  | "oab"
  | "geral";

export type EditalBadge =
  | "Novo"
  | "Mais estudado"
  | "Polícia"
  | "Tribunal"
  | "Bancário"
  | "ENEM"
  | "OAB"
  | "Militar"
  | "Fiscal";

export type EditalNivel = "Básico" | "Intermediário" | "Avançado";

// ── Core types ────────────────────────────────────────────────────────────────

export type ReadyEditalSubject = {
  nome: string;
  peso: number;
  cor: string;
  dificuldade?: Difficulty;
  topicos: string[];
};

export type ReadyEdital = {
  id: string;
  title: string;
  subtitle: string;
  banca: string;
  cargo: string;
  ano: number;
  fonte: string;
  sourceUrl: string;
  subjects: ReadyEditalSubject[];
  // Optional metadata — all new fields; existing editais without them still work.
  categoria?: EditalCategoria;
  badges?: EditalBadge[];
  popularidade?: number; // 1–100
  nivel?: EditalNivel;
  atualizadoEm?: string; // "YYYY-MM-DD"
  destaque?: boolean;
};

// ── Catalog ───────────────────────────────────────────────────────────────────

export const readyEditals: ReadyEdital[] = [

  // ── Guarda Municipal de Baturité CE 2026 ─────────────────────────────────────
  // Fonte verificada: Edital nº 03/BATURITÉ/CCV/UFC, 30 jan 2026 (FCPC / CCV-UFC)
  // Tópicos extraídos do edital oficial. SQL seed em: supabase/ready_editals_baturite.sql
  {
    id: "guarda-municipal-baturite-ce-2026",
    title: "Guarda Municipal de Baturité CE",
    subtitle: "Edital no 03/BATURITE/CCV/UFC, de 30 de janeiro de 2026",
    banca: "FCPC / CCV-UFC",
    cargo: "Guarda Municipal",
    ano: 2026,
    fonte: "Edital oficial publicado pela Prefeitura Municipal de Baturite",
    sourceUrl:
      "https://focoenem.com.br/wp-content/uploads/2026/02/concurso-gcm-baturite-oferece-20-vagas-imediatas-p-20260203-195757-125430.pdf",
    categoria: "policia",
    badges: ["Mais estudado", "Polícia"],
    popularidade: 87,
    nivel: "Intermediário",
    atualizadoEm: "2026-05-17",
    destaque: true,
    subjects: [
      {
        nome: "Lingua Portuguesa",
        peso: 2,
        cor: "bg-blue-500",
        topicos: [
          "Fatores de textualidade: coerencia, coesao, situacionalidade e intertextualidade",
          "Semantica: sinonimia, antonimia, hiponimia, hiperonimia, homonimia, paronimia e polissemia",
          "Ambiguidade, denotacao, conotacao, sentido proprio e figurado",
          "Informacoes implicitas, pressupostos e subentendidos",
          "Tipos e generos textuais",
          "Documentos oficiais: oficio, ata, atestado, certidao, edital, parecer, portaria, requerimento e relatorio",
          "Proposito comunicativo do texto",
          "Reescrita de frases e paragrafos",
          "Ortografia oficial, abreviacoes, siglas e simbolos",
          "Acentuacao, inclusive sinal indicativo de crase, e pontuacao",
          "Morfologia: elementos morficos e processos de formacao de palavras",
          "Classes de palavras: caracterizacao morfossintatica e emprego",
          "Flexao de nomes e verbos, uso dos pronomes e expressoes de tratamento",
          "Emprego das categorias nominais e verbais: genero, numero, tempo, modo, voz e aspecto",
          "Sintaxe: concordancia, regencia, termos da oracao, relacoes sintatico-semanticas e colocacao",
        ],
      },
      {
        nome: "Nocoes de Administracao Publica",
        peso: 3,
        cor: "bg-sky-500",
        topicos: [
          "Constituicao da Republica Federativa do Brasil de 1988",
          "Lei Organica do Municipio de Baturite",
          "Lei no 12.527/2011: Lei de Acesso a Informacao",
          "Lei no 13.709/2018: Lei Geral de Protecao de Dados Pessoais",
          "Lei no 14.681: Politica de Bem-Estar, Saude e Qualidade de Vida no Trabalho e Valorizacao dos Profissionais da Educacao",
          "Redacao Oficial: normas e principios segundo o Manual de Redacao da Presidencia da Republica",
          "Decreto no 9.758/2019",
          "Declaracao Universal dos Direitos Humanos (ONU, 1948)",
        ],
      },
      {
        nome: "Conhecimentos do Municipio de Baturite",
        peso: 4,
        cor: "bg-emerald-500",
        topicos: [
          "Formacao historica do municipio de Baturite e do territorio do Macico de Baturite",
          "Ocupacao indigena pre-colonial, povos originarios, territorialidades, modos de vida e processos de conflito e expropriacao",
          "Colonizacao portuguesa no interior do Ceara: sesmarias, frentes de ocupacao e formacao dos primeiros nucleos rurais e urbanos",
          "Origem do povoado de Baturite, etimologia do toponimo, elevacao a categoria de vila e de municipio",
          "Importancia historica de Baturite na organizacao territorial, economica e politica do Ceara, com destaque para o seculo XIX",
          "Economia historica: agricultura de subsistencia e de exportacao; introducao, expansao e declinio da cafeicultura no Macico de Baturite",
          "Impactos economicos, sociais, demograficos e ambientais do ciclo do cafe; estrutura fundiaria, trabalho escravizado, trabalho livre e organizacao social",
          "Transformacoes socioeconomicas posteriores e diversificacao das atividades produtivas",
          "Localizacao geografica e insercao regional de Baturite no Ceara; limites territoriais, distritos e relacoes regionais",
          "Relacao de Baturite com os municipios do Macico e com a Regiao Metropolitana de Fortaleza",
          "Relevo e geomorfologia do Macico de Baturite",
          "Altitudes, encostas e areas de fragilidade ambiental",
          "Clima serrano, regimes de precipitacao, temperaturas medias e microclimas",
          "Hidrografia, bacias, rios, nascentes e importancia estrategica dos recursos hidricos",
          "Cobertura vegetal e biodiversidade: remanescentes de Mata Atlantica no Ceara, fauna e flora",
          "Areas de preservacao e servicos ecossistemicos",
          "Dinamica populacional e geografia humana: distribuicao urbana e rural, estrutura demografica, fluxos migratorios e relacoes entre cidade e campo",
        ],
      },
      {
        nome: "Conhecimentos Especificos - Guarda Municipal",
        peso: 5,
        cor: "bg-indigo-500",
        dificuldade: "Difícil",
        topicos: [
          "Seguranca publica na Constituicao Federal: art. 144 e paragrafo 8",
          "Estatuto Geral das Guardas Municipais: Lei no 13.022/2014",
          "Principios, competencias e organizacao das guardas municipais",
          "Atuacao preventiva e comunitaria da Guarda Municipal",
          "Direitos humanos aplicados a seguranca publica",
          "Dignidade da pessoa humana, legalidade, proporcionalidade e razoabilidade no uso da forca",
          "Uso diferenciado e progressivo da forca",
          "Mediacao, negociacao e gestao de conflitos",
          "Nocoes de Direito Penal: fato tipico, ilicitude e culpabilidade",
          "Crimes contra a pessoa, o patrimonio e a administracao publica",
          "Nocoes de Direito Processual Penal: prisao em flagrante, provas e cadeia de custodia",
          "Legislacao de transito: Lei no 9.503/1997",
          "Nocoes de primeiros socorros",
          "Etica profissional do agente publico",
          "Responsabilidade civil, penal e administrativa do agente publico",
          "Politicas publicas de seguranca cidada e prevencao da violencia",
          "Legislacao municipal pertinente ao exercicio do cargo",
        ],
      },
    ],
  },

];

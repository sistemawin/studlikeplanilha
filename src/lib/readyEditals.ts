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
  // ── Guarda Municipal de Baturité CE ─────────────────────────────────────────
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

  // ── ENEM 2025 ────────────────────────────────────────────────────────────────
  {
    id: "enem-2025",
    title: "ENEM 2025",
    subtitle: "Exame Nacional do Ensino Médio — Edição 2025",
    banca: "INEP / MEC",
    cargo: "Candidato ao Ensino Superior",
    ano: 2025,
    fonte: "Matriz de Referência do ENEM — INEP/MEC",
    sourceUrl: "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem",
    categoria: "enem",
    badges: ["ENEM", "Mais estudado"],
    popularidade: 94,
    nivel: "Básico",
    atualizadoEm: "2026-01-10",
    destaque: true,
    subjects: [
      {
        nome: "Linguagens, Códigos e Redação",
        peso: 3,
        cor: "bg-rose-500",
        topicos: [
          "Interpretação e compreensão de textos verbais e não verbais",
          "Gêneros textuais: narrativo, dissertativo, descritivo e injuntivo",
          "Figuras de linguagem: metáfora, metonímia, ironia, eufemismo",
          "Coesão e coerência textual",
          "Variação linguística, norma culta e linguagem informal",
          "Funções da linguagem: referencial, apelativa, emotiva, poética",
          "Literatura brasileira: Quinhentismo ao Modernismo",
          "Literatura portuguesa: Classicismo, Barroco e Romantismo",
          "Redação dissertativo-argumentativa: estrutura e proposta de intervenção",
          "Competências da redação ENEM",
          "Língua inglesa e espanhola: interpretação de textos",
          "Artes visuais, música e cinema como linguagens",
          "Tecnologias digitais de informação e comunicação",
        ],
      },
      {
        nome: "Ciências Humanas e suas Tecnologias",
        peso: 2,
        cor: "bg-amber-500",
        topicos: [
          "Pré-história, povos originários e primeiras civilizações",
          "Brasil colonial: escravidão, ciclos econômicos e resistência",
          "Revolução Industrial, capitalismo e movimento operário",
          "Imperialismo, colonialismo e Primeira Guerra Mundial",
          "Revolução Russa e totalitarismos do século XX",
          "Segunda Guerra Mundial e Holocausto",
          "Guerra Fria, geopolítica e ordem mundial bipolar",
          "Brasil República: da Proclamação ao período contemporâneo",
          "Globalização, neoliberalismo e desigualdades",
          "Formação do território brasileiro e regiões geoeconômicas",
          "Urbanização, metropolização e problemas urbanos",
          "Questão ambiental: biomas, recursos hídricos e mudanças climáticas",
          "Filosofia: ética, política, teoria do conhecimento",
          "Sociologia: instituições, movimentos sociais e cultura",
          "Direitos humanos, cidadania e democracia",
        ],
      },
      {
        nome: "Ciências da Natureza e suas Tecnologias",
        peso: 2,
        cor: "bg-emerald-500",
        topicos: [
          "Matéria e energia: estados físicos e transformações",
          "Ligações químicas: iônica, covalente e metálica",
          "Reações químicas, estequiometria e balanceamento",
          "Soluções: concentração, diluição e misturas",
          "Termoquímica, equilíbrio químico e cinética",
          "Eletroquímica: pilhas, eletrólise e corrosão",
          "Genética: leis de Mendel e hereditariedade",
          "Evolução biológica: Darwin, teoria sintética e especiação",
          "Ecologia: cadeias alimentares, biomas e relações ecológicas",
          "Corpo humano: sistemas fisiológicos integrados",
          "Biotecnologia e engenharia genética",
          "Leis de Newton e dinâmica",
          "Energia mecânica, elétrica e térmica",
          "Ondas, som e óptica geométrica",
        ],
      },
      {
        nome: "Matemática e suas Tecnologias",
        peso: 2,
        cor: "bg-violet-500",
        topicos: [
          "Conjuntos numéricos: naturais, inteiros, racionais e reais",
          "Funções do 1o e 2o graus, exponencial e logarítmica",
          "Progressões aritméticas e geométricas",
          "Geometria plana: perímetro, área e polígonos",
          "Geometria espacial: volumes e áreas de sólidos",
          "Geometria analítica: ponto, reta e circunferência",
          "Trigonometria: seno, cosseno, tangente e aplicações",
          "Análise combinatória: combinações, permutações e arranjos",
          "Probabilidade e estatística descritiva",
          "Matemática financeira: juros simples e compostos",
          "Matrizes, determinantes e sistemas lineares",
          "Razão, proporção e porcentagem",
        ],
      },
    ],
  },

  // ── Polícia Civil CE ─────────────────────────────────────────────────────────
  {
    id: "policia-civil-ce-2024",
    title: "Polícia Civil do Ceará",
    subtitle: "Concurso Público para Investigador e Escrivão — 2024",
    banca: "CESPE / CEBRASPE",
    cargo: "Investigador de Polícia",
    ano: 2024,
    fonte: "Edital de abertura publicado pela SSPDS-CE",
    sourceUrl: "https://www.sspds.ce.gov.br",
    categoria: "policia",
    badges: ["Polícia", "Novo"],
    popularidade: 79,
    nivel: "Avançado",
    atualizadoEm: "2026-03-15",
    destaque: false,
    subjects: [
      {
        nome: "Língua Portuguesa",
        peso: 2,
        cor: "bg-blue-500",
        topicos: [
          "Compreensão e interpretação de textos",
          "Tipologia e gêneros textuais",
          "Ortografia e acentuação gráfica oficial",
          "Morfologia: classes de palavras e emprego",
          "Sintaxe: concordância nominal e verbal",
          "Regência nominal e verbal; colocação pronominal",
          "Crase e pontuação",
          "Semântica: sinonímia, antonímia e polissemia",
          "Coesão e coerência textual",
          "Redação oficial: memorando, ofício e ata",
        ],
      },
      {
        nome: "Direito Constitucional",
        peso: 3,
        cor: "bg-indigo-500",
        topicos: [
          "Princípios fundamentais da República Federativa do Brasil",
          "Direitos e garantias fundamentais",
          "Direitos sociais e coletivos",
          "Organização do Estado: União, Estados, Municípios e DF",
          "Organização dos Poderes Executivo, Legislativo e Judiciário",
          "Segurança pública: art. 144 da CF/88",
          "Controle de constitucionalidade",
          "Defesa do Estado e das instituições democráticas",
          "Ordem econômica, social e ambiental na CF/88",
        ],
      },
      {
        nome: "Direito Penal",
        peso: 4,
        cor: "bg-red-500",
        dificuldade: "Difícil",
        topicos: [
          "Princípios do direito penal: legalidade, retroatividade, proporcionalidade",
          "Lei penal no tempo e no espaço",
          "Teoria do crime: fato típico, ilicitude e culpabilidade",
          "Excludentes de ilicitude: estado de necessidade e legítima defesa",
          "Excludentes de culpabilidade: coação e erro",
          "Tentativa, desistência voluntária e arrependimento eficaz",
          "Concurso de pessoas e comunicabilidade de circunstâncias",
          "Concurso de crimes: material, formal e continuado",
          "Crimes contra a vida: homicídio doloso e culposo",
          "Crimes contra a integridade física: lesão corporal e ameaça",
          "Crimes contra o patrimônio: furto, roubo, extorsão e estelionato",
          "Crimes contra a administração pública: peculato e corrupção",
          "Lei de Drogas: Lei 11.343/2006",
          "Estatuto do Desarmamento: Lei 10.826/2003",
          "ECA: crimes e infrações administrativas",
        ],
      },
      {
        nome: "Direito Processual Penal",
        peso: 3,
        cor: "bg-purple-500",
        dificuldade: "Difícil",
        topicos: [
          "Inquérito policial: instauração, procedimentos e arquivamento",
          "Ação penal pública e privada",
          "Prisão em flagrante: modalidades e formalidades",
          "Prisão preventiva e temporária: requisitos e prazo",
          "Habeas corpus e liberdade provisória",
          "Prova: conceito, princípios e meios legais",
          "Cadeia de custódia e prova ilícita",
          "Busca e apreensão",
          "Reconhecimento de pessoas e coisas",
          "Sentença penal, recursos e revisão criminal",
        ],
      },
      {
        nome: "Ética e Legislação Policial",
        peso: 2,
        cor: "bg-slate-600",
        topicos: [
          "Ética e deontologia policial",
          "Estatuto dos Servidores Públicos do Ceará",
          "Lei de Organização Básica da Polícia Civil do Ceará",
          "Uso proporcional e progressivo da força policial",
          "Direitos humanos na atividade policial",
          "Prevenção e combate à tortura: Lei 9.455/1997",
          "Improbidade administrativa: Lei 8.429/1992",
          "Lei de Acesso à Informação: Lei 12.527/2011",
          "LGPD na segurança pública: Lei 13.709/2018",
        ],
      },
    ],
  },

  // ── Banco do Brasil ──────────────────────────────────────────────────────────
  {
    id: "banco-brasil-escriturario-2023",
    title: "Banco do Brasil",
    subtitle: "Concurso Público para Escriturário — Agente Comercial",
    banca: "CESGRANRIO",
    cargo: "Escriturário (Agente Comercial)",
    ano: 2023,
    fonte: "Edital de abertura n. 01/2023 — Banco do Brasil S.A.",
    sourceUrl: "https://www.bb.com.br/concurso",
    categoria: "bancario",
    badges: ["Bancário", "Novo"],
    popularidade: 72,
    nivel: "Intermediário",
    atualizadoEm: "2026-02-28",
    destaque: false,
    subjects: [
      {
        nome: "Língua Portuguesa",
        peso: 2,
        cor: "bg-sky-500",
        topicos: [
          "Compreensão e interpretação de textos corporativos",
          "Gêneros textuais do ambiente bancário: e-mail, relatório e memorando",
          "Ortografia, acentuação e pontuação",
          "Concordância nominal e verbal",
          "Regência verbal, nominal e crase",
          "Colocação pronominal",
          "Semântica: sinonímia, antonímia e figuras de linguagem",
          "Redação clara e objetiva",
        ],
      },
      {
        nome: "Matemática Financeira e Raciocínio Lógico",
        peso: 3,
        cor: "bg-amber-500",
        topicos: [
          "Juros simples: conceitos, fórmulas e aplicações",
          "Juros compostos: montante, taxa e prazo",
          "Desconto simples (por fora) e composto (por dentro)",
          "Séries de pagamentos e anuidades",
          "Taxas equivalentes, nominais e efetivas",
          "Sistemas de amortização: SAC e Tabela Price",
          "Lógica proposicional: conectivos e tabela-verdade",
          "Silogismos, inferências lógicas e deduções",
          "Sequências numéricas e raciocínio quantitativo",
          "Probabilidade e estatística descritiva básica",
        ],
      },
      {
        nome: "Conhecimentos Bancários",
        peso: 4,
        cor: "bg-emerald-500",
        topicos: [
          "Sistema Financeiro Nacional: estrutura e funcionamento",
          "Banco Central do Brasil: funções e instrumentos de política monetária",
          "Conselho Monetário Nacional: competências",
          "Produtos bancários: conta corrente, poupança e CDB",
          "Crédito: modalidades de financiamento e garantias",
          "Cartão de crédito e débito: operacionalização",
          "Câmbio: conceitos e operações internacionais",
          "Prevenção à lavagem de dinheiro: Lei 9.613/1998 e regulamentação BACEN",
          "LGPD no setor financeiro: Lei 13.709/2018",
          "Open Banking e Open Finance",
          "PIX: funcionamento, limites e segurança",
          "Tesouro Direto, LCI, LCA e fundos de investimento",
          "ESG e sustentabilidade no setor bancário",
        ],
      },
      {
        nome: "Atualidades do Mercado Financeiro",
        peso: 2,
        cor: "bg-violet-500",
        topicos: [
          "Cenário econômico brasileiro: PIB, inflação e taxa SELIC",
          "Política monetária e fiscal: instrumentos e efeitos",
          "Mercado de capitais: ações, debêntures e fundos",
          "Fintechs, bancos digitais e transformação digital no setor",
          "Criptoativos e regulação do Banco Central",
          "Educação financeira e inclusão bancária",
          "Tendências do setor financeiro global",
        ],
      },
      {
        nome: "Tecnologia da Informação",
        peso: 2,
        cor: "bg-rose-500",
        topicos: [
          "Segurança da informação: confidencialidade, integridade e disponibilidade",
          "Fraudes bancárias digitais: phishing, engenharia social e smishing",
          "Senhas, autenticação multifator e boas práticas",
          "Excel: funções financeiras, tabelas dinâmicas e gráficos",
          "Sistemas operacionais: Windows e conceitos de Linux",
          "Internet: protocolos HTTP/HTTPS, navegadores e e-mail",
          "Backup, recuperação de dados e armazenamento em nuvem",
          "Redes de computadores: conceitos básicos e Wi-Fi",
        ],
      },
    ],
  },
];

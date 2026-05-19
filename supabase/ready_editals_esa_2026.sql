-- ESA — Escola de Sargentos das Armas
-- Concurso de Admissão ao CFGS — Área Geral — 2026
-- Edital Nº 1/SCA, de 26 de março de 2026
-- Fonte: Diário Oficial da União, Edição 59, Seção 3, Página 26, de 27/03/2026
-- Conteúdo programático extraído da Seção 7 "RELAÇÃO DOS ASSUNTOS DO EXAME INTELECTUAL"
-- Páginas 69–78 do edital oficial
-- URL: https://www.in.gov.br/en/web/dou/-/edital-n-1/sca-de-26-de-marco-de-2026-695927260
-- Matérias (Área Geral): Matemática (22 tópicos), Português (9 tópicos),
--   História do Brasil (15 tópicos), Geografia do Brasil (4 tópicos), Inglês (6 tópicos)
-- Total: 5 matérias · 56 tópicos
-- Nota (Área Geral): (NM + NQOP + NHGB + NI) / 4
--   NM=14q · NQOP=14q · NHGB=12q (6 Hist + 6 Geo) · NI=10q · Redação=eliminatória

-- ── Edital ────────────────────────────────────────────────────────────────────

insert into public.editais_prontos (
  id,
  titulo,
  subtitulo,
  banca,
  cargo,
  ano,
  fonte,
  source_url,
  categoria,
  badges,
  popularidade,
  nivel,
  atualizado_em,
  destaque,
  publicado
) values (
  'esa-cfgs-area-geral-2026',
  'ESA — Sargentos do Exército (Área Geral)',
  'Edital Nº 1/SCA, de 26 de março de 2026 — Área Geral',
  'ESA / DECEx — Exército Brasileiro',
  'Sargento do Exército Brasileiro (CFGS)',
  2026,
  'Diário Oficial da União, Edição 59, Seção 3, Página 26, de 27/03/2026',
  'https://www.in.gov.br/en/web/dou/-/edital-n-1/sca-de-26-de-marco-de-2026-695927260',
  'militar',
  array['Novo', 'Militar'],
  70,
  'Avançado',
  date '2026-05-18',
  true,
  true
) on conflict (id) do update set
  titulo       = excluded.titulo,
  subtitulo    = excluded.subtitulo,
  banca        = excluded.banca,
  cargo        = excluded.cargo,
  ano          = excluded.ano,
  fonte        = excluded.fonte,
  source_url   = excluded.source_url,
  categoria    = excluded.categoria,
  badges       = excluded.badges,
  popularidade = excluded.popularidade,
  nivel        = excluded.nivel,
  atualizado_em = excluded.atualizado_em,
  destaque     = excluded.destaque,
  publicado    = excluded.publicado,
  updated_at   = now();

-- ── Matérias ──────────────────────────────────────────────────────────────────

insert into public.editais_prontos_materias (
  id,
  edital_id,
  nome,
  peso,
  cor,
  dificuldade_padrao,
  ordem
) values
  ('esa-2026-matematica',  'esa-cfgs-area-geral-2026', 'Matemática',           14, 'bg-blue-500',   'Difícil', 1),
  ('esa-2026-portugues',   'esa-cfgs-area-geral-2026', 'Português',            14, 'bg-purple-500', 'Médio',   2),
  ('esa-2026-historia',    'esa-cfgs-area-geral-2026', 'História do Brasil',    6, 'bg-amber-500',  'Médio',   3),
  ('esa-2026-geografia',   'esa-cfgs-area-geral-2026', 'Geografia do Brasil',   6, 'bg-emerald-500','Médio',   4),
  ('esa-2026-ingles',      'esa-cfgs-area-geral-2026', 'Inglês',               10, 'bg-indigo-500', 'Médio',   5)
on conflict (id) do update set
  edital_id          = excluded.edital_id,
  nome               = excluded.nome,
  peso               = excluded.peso,
  cor                = excluded.cor,
  dificuldade_padrao = excluded.dificuldade_padrao,
  ordem              = excluded.ordem;

-- ── Tópicos ───────────────────────────────────────────────────────────────────

delete from public.editais_prontos_topicos
where materia_id in (
  'esa-2026-matematica',
  'esa-2026-portugues',
  'esa-2026-historia',
  'esa-2026-geografia',
  'esa-2026-ingles'
);

insert into public.editais_prontos_topicos (
  id,
  materia_id,
  titulo,
  dificuldade,
  ordem
) values

  -- ── MATEMÁTICA (22 tópicos — Seção 7a, p. 69–72) ────────────────────────
  ('esa-2026-matematica-001', 'esa-2026-matematica', 'Noções de Conjuntos',                              'Médio',  1),
  ('esa-2026-matematica-002', 'esa-2026-matematica', 'Conjunto dos Números',                             'Médio',  2),
  ('esa-2026-matematica-003', 'esa-2026-matematica', 'Funções',                                          'Médio',  3),
  ('esa-2026-matematica-004', 'esa-2026-matematica', 'Função Linear, Função Afim e Função Quadrática',   'Médio',  4),
  ('esa-2026-matematica-005', 'esa-2026-matematica', 'Função Modular',                                   'Médio',  5),
  ('esa-2026-matematica-006', 'esa-2026-matematica', 'Função Exponencial',                               'Médio',  6),
  ('esa-2026-matematica-007', 'esa-2026-matematica', 'Função Logarítmica',                               'Médio',  7),
  ('esa-2026-matematica-008', 'esa-2026-matematica', 'Trigonometria',                                    'Difícil',8),
  ('esa-2026-matematica-009', 'esa-2026-matematica', 'Contagem e Análise Combinatória',                  'Médio',  9),
  ('esa-2026-matematica-010', 'esa-2026-matematica', 'Probabilidade',                                    'Médio', 10),
  ('esa-2026-matematica-011', 'esa-2026-matematica', 'Matrizes, Determinantes e Sistemas Lineares',      'Difícil',11),
  ('esa-2026-matematica-012', 'esa-2026-matematica', 'Sequências Numéricas e Progressões',               'Médio', 12),
  ('esa-2026-matematica-013', 'esa-2026-matematica', 'Geometria Espacial de Posição',                    'Médio', 13),
  ('esa-2026-matematica-014', 'esa-2026-matematica', 'Geometria Espacial Métrica',                       'Difícil',14),
  ('esa-2026-matematica-015', 'esa-2026-matematica', 'Geometria Analítica Plana',                        'Difícil',15),
  ('esa-2026-matematica-016', 'esa-2026-matematica', 'Geometria Plana',                                  'Médio', 16),
  ('esa-2026-matematica-017', 'esa-2026-matematica', 'Polinômios',                                       'Médio', 17),
  ('esa-2026-matematica-018', 'esa-2026-matematica', 'Equações Polinomiais',                             'Difícil',18),
  ('esa-2026-matematica-019', 'esa-2026-matematica', 'Conjunto dos números complexos',                   'Difícil',19),
  ('esa-2026-matematica-020', 'esa-2026-matematica', 'Binômio de Newton',                                'Difícil',20),
  ('esa-2026-matematica-021', 'esa-2026-matematica', 'Noções de Estatística',                            'Médio', 21),
  ('esa-2026-matematica-022', 'esa-2026-matematica', 'Noções de Lógica',                                 'Médio', 22),

  -- ── PORTUGUÊS (9 tópicos — Seção 7b, p. 72–73) ──────────────────────────
  ('esa-2026-portugues-001', 'esa-2026-portugues', 'Leitura, interpretação e análise de textos', 'Médio', 1),
  ('esa-2026-portugues-002', 'esa-2026-portugues', 'Fonética, ortografia e pontuação',           'Médio', 2),
  ('esa-2026-portugues-003', 'esa-2026-portugues', 'Morfologia',                                 'Médio', 3),
  ('esa-2026-portugues-004', 'esa-2026-portugues', 'Morfossintaxe',                              'Médio', 4),
  ('esa-2026-portugues-005', 'esa-2026-portugues', 'Noções de versificação',                     'Médio', 5),
  ('esa-2026-portugues-006', 'esa-2026-portugues', 'Teoria da linguagem e semântica',            'Médio', 6),
  ('esa-2026-portugues-007', 'esa-2026-portugues', 'Introdução à literatura',                    'Médio', 7),
  ('esa-2026-portugues-008', 'esa-2026-portugues', 'Literatura brasileira',                      'Médio', 8),
  ('esa-2026-portugues-009', 'esa-2026-portugues', 'Redação',                                    'Médio', 9),

  -- ── HISTÓRIA DO BRASIL (15 tópicos — Seção 7c, p. 74–76) ───────────────
  -- c.1 Brasil Colônia
  ('esa-2026-historia-001', 'esa-2026-historia', 'Os povos indígenas brasileiros',                        'Médio',  1),
  ('esa-2026-historia-002', 'esa-2026-historia', 'Período pré-colonial',                                  'Médio',  2),
  ('esa-2026-historia-003', 'esa-2026-historia', 'Período Colonial - administração, economia e sociedade colonial', 'Médio',  3),
  ('esa-2026-historia-004', 'esa-2026-historia', 'Consolidação territorial',                              'Médio',  4),
  ('esa-2026-historia-005', 'esa-2026-historia', 'As Rebeliões Nativistas',                               'Médio',  5),
  ('esa-2026-historia-006', 'esa-2026-historia', 'Movimentos pró-independência no Brasil',                'Médio',  6),
  -- c.2 Brasil Império
  ('esa-2026-historia-007', 'esa-2026-historia', 'O Período Joanino',                                     'Médio',  7),
  ('esa-2026-historia-008', 'esa-2026-historia', 'A Independência do Brasil',                             'Médio',  8),
  ('esa-2026-historia-009', 'esa-2026-historia', 'O Primeiro Reinado',                                    'Médio',  9),
  ('esa-2026-historia-010', 'esa-2026-historia', 'Período Regencial',                                     'Médio', 10),
  ('esa-2026-historia-011', 'esa-2026-historia', 'O Segundo Reinado',                                     'Médio', 11),
  -- c.3 Brasil República
  ('esa-2026-historia-012', 'esa-2026-historia', 'A Primeira República',                                  'Médio', 12),
  ('esa-2026-historia-013', 'esa-2026-historia', 'A Era Vargas',                                          'Médio', 13),
  ('esa-2026-historia-014', 'esa-2026-historia', 'A República Brasileira entre 1945 e 1985',              'Médio', 14),
  ('esa-2026-historia-015', 'esa-2026-historia', 'A Nova República (de 1985 até os dias atuais)',          'Médio', 15),

  -- ── GEOGRAFIA DO BRASIL (4 tópicos — Seção 7d, p. 77) ──────────────────
  ('esa-2026-geografia-001', 'esa-2026-geografia', 'O Espaço Natural, Recursos Estratégicos e Impactos Ambientais', 'Médio', 1),
  ('esa-2026-geografia-002', 'esa-2026-geografia', 'O Espaço Econômico',                                            'Médio', 2),
  ('esa-2026-geografia-003', 'esa-2026-geografia', 'O Espaço Político',                                             'Médio', 3),
  ('esa-2026-geografia-004', 'esa-2026-geografia', 'O Espaço Humano',                                               'Médio', 4),

  -- ── INGLÊS (6 tópicos — Seção 7e, p. 78–79) ────────────────────────────
  ('esa-2026-ingles-001', 'esa-2026-ingles', 'Substantivos (Nouns)',                        'Médio', 1),
  ('esa-2026-ingles-002', 'esa-2026-ingles', 'Pronomes (Pronouns)',                         'Médio', 2),
  ('esa-2026-ingles-003', 'esa-2026-ingles', 'Artigos (Articles)',                          'Médio', 3),
  ('esa-2026-ingles-004', 'esa-2026-ingles', 'Adjetivos e Advérbios (Adjectives and Adverbs)', 'Médio', 4),
  ('esa-2026-ingles-005', 'esa-2026-ingles', 'Verbos (Verbs)',                              'Médio', 5),
  ('esa-2026-ingles-006', 'esa-2026-ingles', 'Preposições (Prepositions)',                  'Médio', 6);

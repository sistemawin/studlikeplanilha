create extension if not exists "pgcrypto";

do $$
begin
  create type topic_status as enum (
    'Não Estudado',
    'Teoria Lida',
    'Questões Feitas',
    'Revisado'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type topic_difficulty as enum ('Fácil', 'Médio', 'Difícil');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.editais_prontos (
  id text primary key,
  titulo text not null,
  subtitulo text not null,
  banca text not null,
  cargo text not null,
  ano integer not null,
  fonte text not null,
  source_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.editais_prontos_materias (
  id text primary key,
  edital_id text not null references public.editais_prontos(id) on delete cascade,
  nome text not null,
  peso integer not null default 1,
  cor text not null default 'bg-blue-500',
  dificuldade_padrao topic_difficulty not null default 'Médio',
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.editais_prontos_topicos (
  id text primary key,
  materia_id text not null references public.editais_prontos_materias(id) on delete cascade,
  titulo text not null,
  dificuldade topic_difficulty not null default 'Médio',
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.editais_prontos enable row level security;
alter table public.editais_prontos_materias enable row level security;
alter table public.editais_prontos_topicos enable row level security;

grant select on public.editais_prontos to authenticated;
grant select on public.editais_prontos_materias to authenticated;
grant select on public.editais_prontos_topicos to authenticated;

drop policy if exists "usuarios leem editais prontos" on public.editais_prontos;
create policy "usuarios leem editais prontos" on public.editais_prontos
  for select using (true);

drop policy if exists "usuarios leem materias de editais prontos" on public.editais_prontos_materias;
create policy "usuarios leem materias de editais prontos" on public.editais_prontos_materias
  for select using (true);

drop policy if exists "usuarios leem topicos de editais prontos" on public.editais_prontos_topicos;
create policy "usuarios leem topicos de editais prontos" on public.editais_prontos_topicos
  for select using (true);

insert into public.editais_prontos (
  id,
  titulo,
  subtitulo,
  banca,
  cargo,
  ano,
  fonte,
  source_url
) values (
  'guarda-municipal-baturite-ce-2026',
  'Guarda Municipal de Baturité CE',
  'Edital nº 03/BATURITÉ/CCV/UFC, de 30 de janeiro de 2026',
  'FCPC / CCV-UFC',
  'Guarda Municipal',
  2026,
  'Edital oficial publicado pela Prefeitura Municipal de Baturité',
  'https://focoenem.com.br/wp-content/uploads/2026/02/concurso-gcm-baturite-oferece-20-vagas-imediatas-p-20260203-195757-125430.pdf'
) on conflict (id) do update set
  titulo = excluded.titulo,
  subtitulo = excluded.subtitulo,
  banca = excluded.banca,
  cargo = excluded.cargo,
  ano = excluded.ano,
  fonte = excluded.fonte,
  source_url = excluded.source_url,
  updated_at = now();

insert into public.editais_prontos_materias (
  id,
  edital_id,
  nome,
  peso,
  cor,
  dificuldade_padrao,
  ordem
) values
  ('gcm-baturite-2026-portugues', 'guarda-municipal-baturite-ce-2026', 'Língua Portuguesa', 2, 'bg-blue-500', 'Médio', 1),
  ('gcm-baturite-2026-administracao-publica', 'guarda-municipal-baturite-ce-2026', 'Noções de Administração Pública', 3, 'bg-sky-500', 'Médio', 2),
  ('gcm-baturite-2026-municipio', 'guarda-municipal-baturite-ce-2026', 'Conhecimentos do Município de Baturité', 4, 'bg-emerald-500', 'Médio', 3),
  ('gcm-baturite-2026-especificos', 'guarda-municipal-baturite-ce-2026', 'Conhecimentos Específicos - Guarda Municipal', 5, 'bg-indigo-500', 'Difícil', 4)
on conflict (id) do update set
  edital_id = excluded.edital_id,
  nome = excluded.nome,
  peso = excluded.peso,
  cor = excluded.cor,
  dificuldade_padrao = excluded.dificuldade_padrao,
  ordem = excluded.ordem;

delete from public.editais_prontos_topicos
where materia_id in (
  'gcm-baturite-2026-portugues',
  'gcm-baturite-2026-administracao-publica',
  'gcm-baturite-2026-municipio',
  'gcm-baturite-2026-especificos'
);

insert into public.editais_prontos_topicos (
  id,
  materia_id,
  titulo,
  dificuldade,
  ordem
) values
  ('gcm-baturite-2026-portugues-001', 'gcm-baturite-2026-portugues', 'Fatores de textualidade: coerência, coesão, situacionalidade e intertextualidade', 'Médio', 1),
  ('gcm-baturite-2026-portugues-002', 'gcm-baturite-2026-portugues', 'Semântica: sinonímia, antonímia, hiponímia, hiperonímia, homonímia, paronímia e polissemia', 'Médio', 2),
  ('gcm-baturite-2026-portugues-003', 'gcm-baturite-2026-portugues', 'Ambiguidade, denotação, conotação, sentido próprio e figurado', 'Médio', 3),
  ('gcm-baturite-2026-portugues-004', 'gcm-baturite-2026-portugues', 'Informações implícitas, pressupostos e subentendidos', 'Médio', 4),
  ('gcm-baturite-2026-portugues-005', 'gcm-baturite-2026-portugues', 'Tipos e gêneros textuais', 'Médio', 5),
  ('gcm-baturite-2026-portugues-006', 'gcm-baturite-2026-portugues', 'Documentos oficiais: ofício, ata, atestado, certidão, edital, parecer, portaria, requerimento e relatório', 'Médio', 6),
  ('gcm-baturite-2026-portugues-007', 'gcm-baturite-2026-portugues', 'Propósito comunicativo do texto', 'Médio', 7),
  ('gcm-baturite-2026-portugues-008', 'gcm-baturite-2026-portugues', 'Reescrita de frases e parágrafos', 'Médio', 8),
  ('gcm-baturite-2026-portugues-009', 'gcm-baturite-2026-portugues', 'Ortografia oficial, abreviações, siglas e símbolos', 'Médio', 9),
  ('gcm-baturite-2026-portugues-010', 'gcm-baturite-2026-portugues', 'Acentuação, inclusive sinal indicativo de crase, e pontuação', 'Médio', 10),
  ('gcm-baturite-2026-portugues-011', 'gcm-baturite-2026-portugues', 'Morfologia: elementos mórficos e processos de formação de palavras', 'Médio', 11),
  ('gcm-baturite-2026-portugues-012', 'gcm-baturite-2026-portugues', 'Classes de palavras: caracterização morfossintática e emprego', 'Médio', 12),
  ('gcm-baturite-2026-portugues-013', 'gcm-baturite-2026-portugues', 'Flexão de nomes e verbos, uso dos pronomes e expressões de tratamento', 'Médio', 13),
  ('gcm-baturite-2026-portugues-014', 'gcm-baturite-2026-portugues', 'Emprego das categorias nominais e verbais: gênero, número, tempo, modo, voz e aspecto', 'Médio', 14),
  ('gcm-baturite-2026-portugues-015', 'gcm-baturite-2026-portugues', 'Sintaxe: concordância, regência, termos da oração, relações sintático-semânticas e colocação', 'Médio', 15),

  ('gcm-baturite-2026-administracao-001', 'gcm-baturite-2026-administracao-publica', 'Constituição da República Federativa do Brasil de 1988', 'Médio', 1),
  ('gcm-baturite-2026-administracao-002', 'gcm-baturite-2026-administracao-publica', 'Lei Orgânica do Município de Baturité', 'Médio', 2),
  ('gcm-baturite-2026-administracao-003', 'gcm-baturite-2026-administracao-publica', 'Lei nº 12.527/2011: Lei de Acesso à Informação', 'Médio', 3),
  ('gcm-baturite-2026-administracao-004', 'gcm-baturite-2026-administracao-publica', 'Lei nº 13.709/2018: Lei Geral de Proteção de Dados Pessoais', 'Médio', 4),
  ('gcm-baturite-2026-administracao-005', 'gcm-baturite-2026-administracao-publica', 'Lei nº 14.681: Política de Bem-Estar, Saúde e Qualidade de Vida no Trabalho e Valorização dos Profissionais da Educação', 'Médio', 5),
  ('gcm-baturite-2026-administracao-006', 'gcm-baturite-2026-administracao-publica', 'Redação Oficial: normas e princípios segundo o Manual de Redação da Presidência da República', 'Médio', 6),
  ('gcm-baturite-2026-administracao-007', 'gcm-baturite-2026-administracao-publica', 'Decreto nº 9.758/2019', 'Médio', 7),
  ('gcm-baturite-2026-administracao-008', 'gcm-baturite-2026-administracao-publica', 'Declaração Universal dos Direitos Humanos (ONU, 1948)', 'Médio', 8),

  ('gcm-baturite-2026-municipio-001', 'gcm-baturite-2026-municipio', 'Formação histórica do município de Baturité e do território do Maciço de Baturité', 'Médio', 1),
  ('gcm-baturite-2026-municipio-002', 'gcm-baturite-2026-municipio', 'Ocupação indígena pré-colonial, povos originários, territorialidades, modos de vida e processos de conflito e expropriação', 'Médio', 2),
  ('gcm-baturite-2026-municipio-003', 'gcm-baturite-2026-municipio', 'Colonização portuguesa no interior do Ceará: sesmarias, frentes de ocupação e formação dos primeiros núcleos rurais e urbanos', 'Médio', 3),
  ('gcm-baturite-2026-municipio-004', 'gcm-baturite-2026-municipio', 'Origem do povoado de Baturité, etimologia do topônimo, elevação à categoria de vila e de município', 'Médio', 4),
  ('gcm-baturite-2026-municipio-005', 'gcm-baturite-2026-municipio', 'Importância histórica de Baturité na organização territorial, econômica e política do Ceará, com destaque para o século XIX', 'Médio', 5),
  ('gcm-baturite-2026-municipio-006', 'gcm-baturite-2026-municipio', 'Economia histórica: agricultura de subsistência e de exportação; introdução, expansão e declínio da cafeicultura no Maciço de Baturité', 'Médio', 6),
  ('gcm-baturite-2026-municipio-007', 'gcm-baturite-2026-municipio', 'Impactos econômicos, sociais, demográficos e ambientais do ciclo do café; estrutura fundiária, trabalho escravizado, trabalho livre e organização social', 'Médio', 7),
  ('gcm-baturite-2026-municipio-008', 'gcm-baturite-2026-municipio', 'Transformações socioeconômicas posteriores e diversificação das atividades produtivas', 'Médio', 8),
  ('gcm-baturite-2026-municipio-009', 'gcm-baturite-2026-municipio', 'Localização geográfica e inserção regional de Baturité no Ceará; limites territoriais, distritos e relações regionais', 'Médio', 9),
  ('gcm-baturite-2026-municipio-010', 'gcm-baturite-2026-municipio', 'Relação de Baturité com os municípios do Maciço e com a Região Metropolitana de Fortaleza', 'Médio', 10),
  ('gcm-baturite-2026-municipio-011', 'gcm-baturite-2026-municipio', 'Relevo e geomorfologia do Maciço de Baturité', 'Médio', 11),
  ('gcm-baturite-2026-municipio-012', 'gcm-baturite-2026-municipio', 'Altitudes, encostas e áreas de fragilidade ambiental', 'Médio', 12),
  ('gcm-baturite-2026-municipio-013', 'gcm-baturite-2026-municipio', 'Clima serrano, regimes de precipitação, temperaturas médias e microclimas', 'Médio', 13),
  ('gcm-baturite-2026-municipio-014', 'gcm-baturite-2026-municipio', 'Hidrografia, bacias, rios, nascentes e importância estratégica dos recursos hídricos', 'Médio', 14),
  ('gcm-baturite-2026-municipio-015', 'gcm-baturite-2026-municipio', 'Cobertura vegetal e biodiversidade: remanescentes de Mata Atlântica no Ceará, fauna e flora', 'Médio', 15),
  ('gcm-baturite-2026-municipio-016', 'gcm-baturite-2026-municipio', 'Áreas de preservação e serviços ecossistêmicos', 'Médio', 16),
  ('gcm-baturite-2026-municipio-017', 'gcm-baturite-2026-municipio', 'Dinâmica populacional e geografia humana: distribuição urbana e rural, estrutura demográfica, fluxos migratórios e relações entre cidade e campo', 'Médio', 17),

  ('gcm-baturite-2026-especificos-001', 'gcm-baturite-2026-especificos', 'Segurança pública na Constituição Federal: art. 144 e parágrafo 8º', 'Difícil', 1),
  ('gcm-baturite-2026-especificos-002', 'gcm-baturite-2026-especificos', 'Estatuto Geral das Guardas Municipais: Lei nº 13.022/2014', 'Difícil', 2),
  ('gcm-baturite-2026-especificos-003', 'gcm-baturite-2026-especificos', 'Princípios, competências e organização das guardas municipais', 'Difícil', 3),
  ('gcm-baturite-2026-especificos-004', 'gcm-baturite-2026-especificos', 'Atuação preventiva e comunitária da Guarda Municipal', 'Difícil', 4),
  ('gcm-baturite-2026-especificos-005', 'gcm-baturite-2026-especificos', 'Direitos humanos aplicados à segurança pública', 'Difícil', 5),
  ('gcm-baturite-2026-especificos-006', 'gcm-baturite-2026-especificos', 'Dignidade da pessoa humana, legalidade, proporcionalidade e razoabilidade no uso da força', 'Difícil', 6),
  ('gcm-baturite-2026-especificos-007', 'gcm-baturite-2026-especificos', 'Uso diferenciado e progressivo da força', 'Difícil', 7),
  ('gcm-baturite-2026-especificos-008', 'gcm-baturite-2026-especificos', 'Mediação, negociação e gestão de conflitos', 'Difícil', 8),
  ('gcm-baturite-2026-especificos-009', 'gcm-baturite-2026-especificos', 'Noções de Direito Penal: fato típico, ilicitude e culpabilidade', 'Difícil', 9),
  ('gcm-baturite-2026-especificos-010', 'gcm-baturite-2026-especificos', 'Crimes contra a pessoa, o patrimônio e a administração pública', 'Difícil', 10),
  ('gcm-baturite-2026-especificos-011', 'gcm-baturite-2026-especificos', 'Noções de Direito Processual Penal: prisão em flagrante, provas e cadeia de custódia', 'Difícil', 11),
  ('gcm-baturite-2026-especificos-012', 'gcm-baturite-2026-especificos', 'Legislação de trânsito: Lei nº 9.503/1997', 'Difícil', 12),
  ('gcm-baturite-2026-especificos-013', 'gcm-baturite-2026-especificos', 'Noções de primeiros socorros', 'Difícil', 13),
  ('gcm-baturite-2026-especificos-014', 'gcm-baturite-2026-especificos', 'Ética profissional do agente público', 'Difícil', 14),
  ('gcm-baturite-2026-especificos-015', 'gcm-baturite-2026-especificos', 'Responsabilidade civil, penal e administrativa do agente público', 'Difícil', 15),
  ('gcm-baturite-2026-especificos-016', 'gcm-baturite-2026-especificos', 'Políticas públicas de segurança cidadã e prevenção da violência', 'Difícil', 16),
  ('gcm-baturite-2026-especificos-017', 'gcm-baturite-2026-especificos', 'Legislação municipal pertinente ao exercício do cargo', 'Difícil', 17);

create or replace function public.import_ready_edital(p_edital_id text)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_subject record;
  v_subject_id uuid;
  v_subject_ids uuid[] := '{}';
  v_subject_count integer := 0;
  v_topic_count integer := 0;
  v_inserted_topics integer := 0;
  v_schedule_id uuid;
  v_schedule jsonb;
  v_cycles jsonb;
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if not exists (select 1 from public.editais_prontos where id = p_edital_id) then
    raise exception 'Edital pronto não encontrado: %', p_edital_id;
  end if;

  for v_subject in
    select *
    from public.editais_prontos_materias
    where edital_id = p_edital_id
    order by ordem, nome
  loop
    v_subject_id := gen_random_uuid();
    v_subject_ids := array_append(v_subject_ids, v_subject_id);
    v_subject_count := v_subject_count + 1;

    insert into public.materias (id, user_id, nome, peso, cor)
    values (v_subject_id, v_user_id, v_subject.nome, v_subject.peso, v_subject.cor);

    insert into public.topicos (id, materia_id, titulo, status, dificuldade)
    select
      gen_random_uuid(),
      v_subject_id,
      topic.titulo,
      'Não Estudado'::topic_status,
      topic.dificuldade
    from public.editais_prontos_topicos as topic
    where topic.materia_id = v_subject.id
    order by topic.ordem, topic.titulo;

    get diagnostics v_inserted_topics = row_count;
    v_topic_count := v_topic_count + v_inserted_topics;
  end loop;

  select id, configuracao
    into v_schedule_id, v_schedule
  from public.cronograma
  where user_id = v_user_id
  order by created_at
  limit 1;

  select coalesce(jsonb_agg(value), '[]'::jsonb)
    into v_cycles
  from (
    select jsonb_array_elements_text(coalesce(v_schedule->'ciclos', '[]'::jsonb)) as value
    union all
    select unnest(v_subject_ids)::text as value
  ) as cycle_values;

  v_schedule := jsonb_build_object(
    'modo', coalesce(v_schedule->>'modo', 'ciclos'),
    'horasDia', coalesce(v_schedule->'horasDia', '0'::jsonb),
    'semanal', coalesce(v_schedule->'semanal', '{}'::jsonb),
    'ciclos', v_cycles
  );

  if v_schedule_id is null then
    insert into public.cronograma (user_id, configuracao)
    values (v_user_id, v_schedule);
  else
    update public.cronograma
    set configuracao = v_schedule,
        updated_at = now()
    where id = v_schedule_id
      and user_id = v_user_id;
  end if;

  return jsonb_build_object(
    'editalId', p_edital_id,
    'materias', v_subject_count,
    'topicos', v_topic_count
  );
end;
$$;

revoke all on function public.import_ready_edital(text) from public;
grant execute on function public.import_ready_edital(text) to authenticated;

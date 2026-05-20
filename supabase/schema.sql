create extension if not exists "pgcrypto";

create type topic_status as enum (
  'Não Estudado',
  'Teoria Lida',
  'Questões Feitas',
  'Revisado'
);

create type topic_difficulty as enum ('Fácil', 'Médio', 'Difícil');
create type review_type as enum ('1', '7', '21', '30', 'manual', 'dificuldade');
create type goal_type as enum ('horas', 'questões');
create type suggestion_status as enum ('nova', 'lida', 'planejada', 'resolvida', 'arquivada');
create type study_session_type as enum ('topico', 'revisao', 'livre');

create table public.materias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  peso integer not null default 1,
  cor text not null default 'bg-zinc-500',
  created_at timestamptz not null default now()
);

create table public.topicos (
  id uuid primary key default gen_random_uuid(),
  materia_id uuid not null references public.materias(id) on delete cascade,
  titulo text not null,
  status topic_status not null default 'Não Estudado',
  dificuldade topic_difficulty not null default 'Médio',
  estudado_em date,
  created_at timestamptz not null default now()
);

create table public.revisoes (
  id uuid primary key default gen_random_uuid(),
  topico_id uuid not null references public.topicos(id) on delete cascade,
  data_agendada date not null,
  concluida boolean not null default false,
  tipo review_type not null,
  created_at timestamptz not null default now()
);

create table public.cronograma (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  configuracao jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.metas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo goal_type not null,
  valor_objetivo numeric not null check (valor_objetivo > 0),
  valor_atual numeric not null default 0 check (valor_atual >= 0),
  data_referencia date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.simulados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  acertos integer not null check (acertos >= 0),
  total_questoes integer not null check (total_questoes > 0),
  data_realizacao date not null default current_date,
  created_at timestamptz not null default now(),
  constraint simulados_acertos_validos check (acertos <= total_questoes)
);

create table public.questoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  materia_id uuid not null references public.materias(id) on delete cascade,
  topico_id uuid not null references public.topicos(id) on delete cascade,
  quantidade integer not null check (quantidade > 0),
  acertos integer check (acertos >= 0),
  data_realizacao date not null default current_date,
  created_at timestamptz not null default now(),
  constraint questoes_acertos_validos check (acertos is null or acertos <= quantidade)
);

create table public.sessoes_estudo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo study_session_type not null,
  data_realizacao date not null default current_date,
  ended_at timestamptz not null default now(),
  duration_seconds integer not null check (duration_seconds > 0),
  materia_id uuid references public.materias(id) on delete set null,
  materia_nome text,
  topico_id uuid references public.topicos(id) on delete set null,
  topico_titulo text,
  review_id uuid references public.revisoes(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  username text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sugestoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  categoria text not null,
  mensagem text not null check (char_length(trim(mensagem)) >= 6),
  status suggestion_status not null default 'nova',
  created_at timestamptz not null default now()
);

alter table public.materias enable row level security;
alter table public.topicos enable row level security;
alter table public.revisoes enable row level security;
alter table public.cronograma enable row level security;
alter table public.metas enable row level security;
alter table public.simulados enable row level security;
alter table public.questoes enable row level security;
alter table public.sessoes_estudo enable row level security;
alter table public.app_admins enable row level security;
alter table public.profiles enable row level security;
alter table public.sugestoes enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.materias to authenticated;
grant select, insert, update, delete on public.topicos to authenticated;
grant select, insert, update, delete on public.revisoes to authenticated;
grant select, insert, update, delete on public.cronograma to authenticated;
grant select, insert, update, delete on public.metas to authenticated;
grant select, insert, update, delete on public.simulados to authenticated;
grant select, insert, update, delete on public.questoes to authenticated;
grant select, insert, update, delete on public.sessoes_estudo to authenticated;
grant select on public.app_admins to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.sugestoes to authenticated;

create policy "materias do usuario" on public.materias
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "topicos por materia do usuario" on public.topicos
  for all using (
    exists (
      select 1 from public.materias
      where materias.id = topicos.materia_id and materias.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.materias
      where materias.id = topicos.materia_id and materias.user_id = auth.uid()
    )
  );

create policy "revisoes por topico do usuario" on public.revisoes
  for all using (
    exists (
      select 1
      from public.topicos
      join public.materias on materias.id = topicos.materia_id
      where topicos.id = revisoes.topico_id and materias.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.topicos
      join public.materias on materias.id = topicos.materia_id
      where topicos.id = revisoes.topico_id and materias.user_id = auth.uid()
    )
  );

create policy "cronograma do usuario" on public.cronograma
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "metas do usuario" on public.metas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "simulados do usuario" on public.simulados
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "questoes do usuario" on public.questoes
  for all using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.topicos
      join public.materias on materias.id = topicos.materia_id
      where topicos.id = questoes.topico_id
        and materias.id = questoes.materia_id
        and materias.user_id = auth.uid()
    )
  );

create policy "sessoes de estudo do usuario" on public.sessoes_estudo
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "admin ve proprio registro" on public.app_admins
  for select using (auth.uid() = user_id);

create policy "usuarios veem proprio perfil" on public.profiles
  for select using (auth.uid() = id);

create policy "usuarios criam proprio perfil" on public.profiles
  for insert with check (auth.uid() = id);

create policy "usuarios atualizam proprio perfil" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "usuarios criam sugestoes" on public.sugestoes
  for insert with check (auth.uid() = user_id);

create policy "usuarios veem proprias sugestoes" on public.sugestoes
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.app_admins where app_admins.user_id = auth.uid())
  );

create policy "admins atualizam sugestoes" on public.sugestoes
  for update using (
    exists (select 1 from public.app_admins where app_admins.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.app_admins where app_admins.user_id = auth.uid())
  );

drop function if exists public.admin_list_users(integer, integer);
drop function if exists public.admin_list_users(integer, integer, text);

create or replace function public.admin_list_users(
  p_limit integer default 20,
  p_offset integer default 0,
  p_search text default ''
)
returns table (
  id uuid,
  email text,
  name text,
  username text,
  avatar_url text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  banned_until timestamptz,
  is_admin boolean,
  total_count bigint
)
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select
    u.id,
    coalesce(u.email, '') as email,
    coalesce(nullif(profiles.name, ''), nullif(u.raw_user_meta_data->>'name', ''), nullif(u.raw_user_meta_data->>'full_name', '')) as name,
    coalesce(nullif(profiles.username, ''), nullif(u.raw_user_meta_data->>'username', ''), nullif(u.raw_user_meta_data->>'user_name', ''), nullif(u.raw_user_meta_data->>'preferred_username', '')) as username,
    coalesce(nullif(profiles.avatar_url, ''), nullif(u.raw_user_meta_data->>'avatar_url', ''), nullif(u.raw_user_meta_data->>'picture', '')) as avatar_url,
    u.created_at,
    u.last_sign_in_at,
    u.banned_until,
    (admins.user_id is not null) as is_admin,
    count(*) over() as total_count
  from auth.users as u
  left join public.app_admins as admins on admins.user_id = u.id
  left join public.profiles as profiles on profiles.id = u.id
  where exists (
    select 1
    from public.app_admins
    where app_admins.user_id = auth.uid()
  )
    and (
      coalesce(trim(p_search), '') = ''
      or u.email ilike '%' || trim(p_search) || '%'
      or u.id::text ilike '%' || trim(p_search) || '%'
      or profiles.name ilike '%' || trim(p_search) || '%'
      or profiles.username ilike '%' || trim(p_search) || '%'
    )
  order by u.created_at desc
  limit least(greatest(coalesce(p_limit, 20), 1), 50)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.admin_list_users(integer, integer, text) from public;
grant execute on function public.admin_list_users(integer, integer, text) to authenticated;

create or replace function public.admin_manage_user(
  p_target_user_id uuid,
  p_action text
)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.app_admins
    where app_admins.user_id = auth.uid()
  ) then
    raise exception 'Apenas administradores podem executar esta ação.';
  end if;

  if p_target_user_id is null then
    raise exception 'Usuário inválido.';
  end if;

  if p_action = 'promote' then
    insert into public.app_admins (user_id)
    values (p_target_user_id)
    on conflict (user_id) do nothing;
    return;
  end if;

  if p_target_user_id = auth.uid() and p_action in ('block', 'delete') then
    raise exception 'Você não pode bloquear ou excluir sua própria conta.';
  end if;

  if p_action = 'block' then
    update auth.users
    set banned_until = 'infinity'::timestamptz
    where id = p_target_user_id;
    return;
  end if;

  if p_action = 'unblock' then
    update auth.users
    set banned_until = null
    where id = p_target_user_id;
    return;
  end if;

  if p_action = 'delete' then
    delete from auth.users
    where id = p_target_user_id;
    return;
  end if;

  raise exception 'Ação administrativa inválida.';
end;
$$;

revoke all on function public.admin_manage_user(uuid, text) from public;
grant execute on function public.admin_manage_user(uuid, text) to authenticated;

create or replace function public.admin_get_user_state(
  p_target_user_id uuid
)
returns jsonb
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select
    case
      when not exists (
        select 1
        from public.app_admins
        where app_admins.user_id = auth.uid()
      ) then
        jsonb_build_object('error', 'Apenas administradores podem executar esta ação.')
      else
        jsonb_build_object(
          'subjects',
          coalesce(
            (
              select jsonb_agg(
                jsonb_build_object('id', m.id, 'nome', m.nome, 'peso', m.peso, 'cor', m.cor)
                order by m.created_at
              )
              from public.materias as m
              where m.user_id = p_target_user_id
            ),
            '[]'::jsonb
          ),
          'topics',
          coalesce(
            (
              select jsonb_agg(
                jsonb_build_object(
                  'id', t.id,
                  'materiaId', t.materia_id,
                  'titulo', t.titulo,
                  'status', t.status,
                  'dificuldade', t.dificuldade,
                  'estudadoEm', t.estudado_em
                )
                order by t.created_at
              )
              from public.topicos as t
              join public.materias as m on m.id = t.materia_id
              where m.user_id = p_target_user_id
            ),
            '[]'::jsonb
          ),
          'reviews',
          coalesce(
            (
              select jsonb_agg(
                jsonb_build_object(
                  'id', r.id,
                  'topicoId', r.topico_id,
                  'dataAgendada', r.data_agendada,
                  'concluida', r.concluida,
                  'tipo', r.tipo
                )
                order by r.data_agendada
              )
              from public.revisoes as r
              join public.topicos as t on t.id = r.topico_id
              join public.materias as m on m.id = t.materia_id
              where m.user_id = p_target_user_id
            ),
            '[]'::jsonb
          ),
          'schedule',
          coalesce(
            (
              select c.configuracao
              from public.cronograma as c
              where c.user_id = p_target_user_id
              order by c.created_at
              limit 1
            ),
            '{}'::jsonb
          ),
          'goals',
          coalesce(
            (
              select jsonb_agg(
                jsonb_build_object(
                  'id', g.id,
                  'tipo', g.tipo,
                  'valorObjetivo', g.valor_objetivo,
                  'valorAtual', g.valor_atual,
                  'dataReferencia', g.data_referencia
                )
                order by g.created_at
              )
              from public.metas as g
              where g.user_id = p_target_user_id
            ),
            '[]'::jsonb
          ),
          'exams',
          coalesce(
            (
              select jsonb_agg(
                jsonb_build_object(
                  'id', s.id,
                  'nome', s.nome,
                  'acertos', s.acertos,
                  'total', s.total_questoes,
                  'data', s.data_realizacao
                )
                order by s.created_at desc
              )
              from public.simulados as s
              where s.user_id = p_target_user_id
            ),
            '[]'::jsonb
          ),
          'questionLogs',
          coalesce(
            (
              select jsonb_agg(
                jsonb_build_object(
                  'id', q.id,
                  'materiaId', q.materia_id,
                  'topicoId', q.topico_id,
                  'quantidade', q.quantidade,
                  'acertos', q.acertos,
                  'data', q.data_realizacao
                )
                order by q.created_at desc
              )
              from public.questoes as q
              where q.user_id = p_target_user_id
            ),
            '[]'::jsonb
          ),
          'studySessions',
          coalesce(
            (
              select jsonb_agg(
                jsonb_build_object(
                  'id', s.id,
                  'tipo', s.tipo,
                  'data', s.data_realizacao,
                  'endedAt', s.ended_at,
                  'durationSeconds', s.duration_seconds,
                  'materiaId', s.materia_id,
                  'materiaNome', s.materia_nome,
                  'topicoId', s.topico_id,
                  'topicoTitulo', s.topico_titulo,
                  'reviewId', s.review_id
                )
                order by s.ended_at desc
              )
              from public.sessoes_estudo as s
              where s.user_id = p_target_user_id
            ),
            '[]'::jsonb
          )
        )
    end;
$$;

revoke all on function public.admin_get_user_state(uuid) from public;
grant execute on function public.admin_get_user_state(uuid) to authenticated;

create or replace function public.admin_get_user_profile(
  p_target_user_id uuid
)
returns jsonb
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select
    case
      when not exists (
        select 1
        from public.app_admins
        where app_admins.user_id = auth.uid()
      ) then
        jsonb_build_object('error', 'Apenas administradores podem executar esta ação.')
      when not exists (
        select 1
        from auth.users
        where users.id = p_target_user_id
      ) then
        jsonb_build_object('error', 'Usuário não encontrado.')
      else (
        select jsonb_build_object(
          'id', u.id,
          'email', coalesce(u.email, ''),
          'name', coalesce(nullif(p.name, ''), nullif(u.raw_user_meta_data->>'name', ''), nullif(u.raw_user_meta_data->>'full_name', '')),
          'username', coalesce(nullif(p.username, ''), nullif(u.raw_user_meta_data->>'username', ''), nullif(u.raw_user_meta_data->>'user_name', ''), nullif(u.raw_user_meta_data->>'preferred_username', '')),
          'avatar_url', coalesce(nullif(p.avatar_url, ''), nullif(u.raw_user_meta_data->>'avatar_url', ''), nullif(u.raw_user_meta_data->>'picture', '')),
          'created_at', u.created_at,
          'last_sign_in_at', u.last_sign_in_at,
          'banned_until', u.banned_until,
          'is_admin', admins.user_id is not null,
          'plan', coalesce(nullif(u.raw_user_meta_data->>'plan', ''), nullif(u.raw_user_meta_data->>'account_type', ''), 'Conta gratuita')
        )
        from auth.users as u
        left join public.profiles as p on p.id = u.id
        left join public.app_admins as admins on admins.user_id = u.id
        where u.id = p_target_user_id
      )
    end;
$$;

revoke all on function public.admin_get_user_profile(uuid) from public;
grant execute on function public.admin_get_user_profile(uuid) to authenticated;

-- Performance indexes
create index idx_topicos_materia_id   on public.topicos (materia_id);
create index idx_topicos_status       on public.topicos (status);
create index idx_topicos_estudado_em  on public.topicos (estudado_em);
create index idx_metas_user_id        on public.metas (user_id);
create index idx_simulados_user_id    on public.simulados (user_id);
create index idx_cronograma_user_id   on public.cronograma (user_id);
create index idx_questoes_user_id     on public.questoes (user_id);
create index idx_questoes_topico_id   on public.questoes (topico_id);
create index idx_sugestoes_user_id    on public.sugestoes (user_id);
create index idx_sugestoes_status     on public.sugestoes (status);

create index revisoes_pendentes_idx
  on public.revisoes (data_agendada)
  where concluida = false;

-- Idempotent trigger: only fires when status transitions INTO a studied state
-- and no standard review (tipo '1') exists yet for this topic.
-- This prevents duplicate reviews when the sync strategy re-saves the same row.
create or replace function public.agendar_revisoes_padrao()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.status in ('Questões Feitas', 'Revisado')
     and coalesce(old.status, 'Não Estudado') not in ('Questões Feitas', 'Revisado')
     and not exists (
       select 1 from public.revisoes
       where topico_id = new.id and tipo = '1'
     ) then

    insert into public.revisoes (topico_id, data_agendada, tipo)
    values
      (new.id, current_date + 1,  '1'),
      (new.id, current_date + 7,  '7'),
      (new.id, current_date + 21, '21'),
      (new.id, current_date + 30, '30');

    if new.dificuldade = 'Difícil' then
      insert into public.revisoes (topico_id, data_agendada, tipo)
      values
        (new.id, current_date + 3,  'dificuldade'),
        (new.id, current_date + 10, 'dificuldade'),
        (new.id, current_date + 17, 'dificuldade');
    elsif new.dificuldade = 'Médio' then
      insert into public.revisoes (topico_id, data_agendada, tipo)
      values
        (new.id, current_date + 7,  'dificuldade'),
        (new.id, current_date + 21, 'dificuldade');
    else
      insert into public.revisoes (topico_id, data_agendada, tipo)
      values (new.id, current_date + 14, 'dificuldade');
    end if;
  end if;

  return new;
end;
$$;

create trigger topicos_agendar_revisoes
after update of status on public.topicos
for each row execute function public.agendar_revisoes_padrao();

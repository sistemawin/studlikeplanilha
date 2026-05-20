create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  username text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
grant select, insert, update on public.profiles to authenticated;

drop policy if exists "usuarios veem proprio perfil" on public.profiles;
create policy "usuarios veem proprio perfil" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "usuarios criam proprio perfil" on public.profiles;
create policy "usuarios criam proprio perfil" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "usuarios atualizam proprio perfil" on public.profiles;
create policy "usuarios atualizam proprio perfil" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

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

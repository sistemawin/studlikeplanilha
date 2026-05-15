drop function if exists public.admin_list_users(integer, integer);

create or replace function public.admin_list_users(
  p_limit integer default 20,
  p_offset integer default 0,
  p_search text default ''
)
returns table (
  id uuid,
  email text,
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
    u.created_at,
    u.last_sign_in_at,
    u.banned_until,
    (admins.user_id is not null) as is_admin,
    count(*) over() as total_count
  from auth.users as u
  left join public.app_admins as admins on admins.user_id = u.id
  where exists (
    select 1
    from public.app_admins
    where app_admins.user_id = auth.uid()
  )
    and (
      coalesce(trim(p_search), '') = ''
      or u.email ilike '%' || trim(p_search) || '%'
      or u.id::text ilike '%' || trim(p_search) || '%'
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

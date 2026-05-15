create or replace function public.admin_list_users(
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
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
    count(*) over() as total_count
  from auth.users as u
  where exists (
    select 1
    from public.app_admins
    where app_admins.user_id = auth.uid()
  )
  order by u.created_at desc
  limit least(greatest(coalesce(p_limit, 20), 1), 50)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.admin_list_users(integer, integer) from public;
grant execute on function public.admin_list_users(integer, integer) to authenticated;

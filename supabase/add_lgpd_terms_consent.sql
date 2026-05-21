alter table public.profiles
  add column if not exists aceitou_termos boolean not null default false,
  add column if not exists termos_aceitos_em timestamptz,
  add column if not exists termos_versao text;

comment on column public.profiles.aceitou_termos is
  'Indica se o usuario aceitou os Termos de Uso e a Politica de Privacidade vigentes.';
comment on column public.profiles.termos_aceitos_em is
  'Data e hora do aceite dos Termos de Uso e da Politica de Privacidade.';
comment on column public.profiles.termos_versao is
  'Versao dos termos aceita pelo usuario.';

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  insert into public.profiles (
    id,
    name,
    username,
    avatar_url,
    aceitou_termos,
    termos_aceitos_em,
    termos_versao
  )
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'name', ''),
    nullif(
      coalesce(
        new.raw_user_meta_data->>'username',
        new.raw_user_meta_data->>'user_name',
        new.raw_user_meta_data->>'preferred_username'
      ),
      ''
    ),
    nullif(
      coalesce(
        new.raw_user_meta_data->>'avatar_url',
        new.raw_user_meta_data->>'picture'
      ),
      ''
    ),
    coalesce((new.raw_user_meta_data->>'aceitou_termos')::boolean, false),
    case
      when coalesce((new.raw_user_meta_data->>'aceitou_termos')::boolean, false)
      then coalesce((new.raw_user_meta_data->>'termos_aceitos_em')::timestamptz, now())
      else null
    end,
    nullif(new.raw_user_meta_data->>'termos_versao', '')
  )
  on conflict (id) do update
  set
    name = coalesce(public.profiles.name, excluded.name),
    username = coalesce(public.profiles.username, excluded.username),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    aceitou_termos = public.profiles.aceitou_termos or excluded.aceitou_termos,
    termos_aceitos_em = coalesce(public.profiles.termos_aceitos_em, excluded.termos_aceitos_em),
    termos_versao = coalesce(public.profiles.termos_versao, excluded.termos_versao),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

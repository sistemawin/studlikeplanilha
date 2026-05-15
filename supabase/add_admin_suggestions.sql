do $$
begin
  if not exists (select 1 from pg_type where typname = 'suggestion_status') then
    create type suggestion_status as enum ('nova', 'lida', 'planejada', 'resolvida', 'arquivada');
  end if;
end $$;

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.sugestoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  categoria text not null,
  mensagem text not null check (char_length(trim(mensagem)) >= 6),
  status suggestion_status not null default 'nova',
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;
alter table public.sugestoes enable row level security;

grant select on public.app_admins to authenticated;
grant select, insert, update on public.sugestoes to authenticated;

drop policy if exists "admin ve proprio registro" on public.app_admins;
create policy "admin ve proprio registro" on public.app_admins
  for select using (auth.uid() = user_id);

drop policy if exists "usuarios criam sugestoes" on public.sugestoes;
create policy "usuarios criam sugestoes" on public.sugestoes
  for insert with check (auth.uid() = user_id);

drop policy if exists "usuarios veem proprias sugestoes" on public.sugestoes;
create policy "usuarios veem proprias sugestoes" on public.sugestoes
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.app_admins where app_admins.user_id = auth.uid())
  );

drop policy if exists "admins atualizam sugestoes" on public.sugestoes;
create policy "admins atualizam sugestoes" on public.sugestoes
  for update using (
    exists (select 1 from public.app_admins where app_admins.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.app_admins where app_admins.user_id = auth.uid())
  );

create index if not exists idx_sugestoes_user_id on public.sugestoes (user_id);
create index if not exists idx_sugestoes_status on public.sugestoes (status);

-- Depois de criar as tabelas, rode um INSERT para transformar seu usuário em admin:
-- insert into public.app_admins (user_id)
-- select id from auth.users where email = 'SEU_EMAIL_AQUI'
-- on conflict (user_id) do nothing;


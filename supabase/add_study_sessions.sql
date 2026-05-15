do $$
begin
  create type study_session_type as enum ('topico', 'revisao', 'livre');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.sessoes_estudo (
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

alter table public.sessoes_estudo enable row level security;
grant select, insert, update, delete on public.sessoes_estudo to authenticated;

drop policy if exists "sessoes de estudo do usuario" on public.sessoes_estudo;
create policy "sessoes de estudo do usuario" on public.sessoes_estudo
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

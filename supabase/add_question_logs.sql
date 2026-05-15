create table if not exists public.questoes (
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

alter table public.questoes enable row level security;

grant select, insert, update, delete on public.questoes to authenticated;

drop policy if exists "questoes do usuario" on public.questoes;
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

create index if not exists idx_questoes_user_id on public.questoes (user_id);
create index if not exists idx_questoes_topico_id on public.questoes (topico_id);


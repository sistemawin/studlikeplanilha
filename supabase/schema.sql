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

create table public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
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
alter table public.app_admins enable row level security;
alter table public.sugestoes enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.materias to authenticated;
grant select, insert, update, delete on public.topicos to authenticated;
grant select, insert, update, delete on public.revisoes to authenticated;
grant select, insert, update, delete on public.cronograma to authenticated;
grant select, insert, update, delete on public.metas to authenticated;
grant select, insert, update, delete on public.simulados to authenticated;
grant select, insert, update, delete on public.questoes to authenticated;
grant select on public.app_admins to authenticated;
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

create policy "admin ve proprio registro" on public.app_admins
  for select using (auth.uid() = user_id);

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

drop function if exists public.import_ready_edital(text);

create or replace function public.replace_ready_edital(p_edital_id text)
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
  v_previous_subject_ids uuid[] := '{}';
  v_previous_topic_ids uuid[] := '{}';
  v_previous_review_ids uuid[] := '{}';
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

  if not exists (
    select 1
    from public.editais_prontos
    where id = p_edital_id
      and publicado = true
  ) then
    raise exception 'Edital pronto não encontrado: %', p_edital_id;
  end if;

  select coalesce(array_agg(id), '{}'::uuid[])
    into v_previous_subject_ids
  from public.materias
  where user_id = v_user_id;

  select coalesce(array_agg(t.id), '{}'::uuid[])
    into v_previous_topic_ids
  from public.topicos as t
  join public.materias as m on m.id = t.materia_id
  where m.user_id = v_user_id;

  select coalesce(array_agg(r.id), '{}'::uuid[])
    into v_previous_review_ids
  from public.revisoes as r
  join public.topicos as t on t.id = r.topico_id
  join public.materias as m on m.id = t.materia_id
  where m.user_id = v_user_id;

  delete from public.sessoes_estudo
  where user_id = v_user_id
    and (
      materia_id = any(v_previous_subject_ids)
      or topico_id = any(v_previous_topic_ids)
      or review_id = any(v_previous_review_ids)
    );

  delete from public.materias
  where user_id = v_user_id;

  update public.metas
  set valor_atual = 0,
      data_referencia = current_date
  where user_id = v_user_id;

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
    select unnest(v_subject_ids)::text as value
  ) as cycle_values;

  v_schedule := jsonb_build_object(
    'modo', coalesce(v_schedule->>'modo', 'ciclos'),
    'horasDia', coalesce(v_schedule->'horasDia', '0'::jsonb),
    'semanal', '{}'::jsonb,
    'ciclos', v_cycles,
    'provas', '[]'::jsonb
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

revoke all on function public.replace_ready_edital(text) from public;
grant execute on function public.replace_ready_edital(text) to authenticated;

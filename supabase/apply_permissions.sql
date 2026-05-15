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

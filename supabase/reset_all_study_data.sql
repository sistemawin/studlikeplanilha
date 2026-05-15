-- Apaga todos os dados de estudo já salvos, mantendo as contas em auth.users.
-- Use uma única vez no SQL Editor do Supabase quando quiser começar o app zerado
-- inclusive para usuários que já tinham conta.

delete from public.simulados;
delete from public.metas;
delete from public.cronograma;
delete from public.materias;


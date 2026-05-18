# RLS e permissões

## Dados do usuário

As tabelas pessoais usam políticas baseadas em `auth.uid()`.

Padrão:

```sql
using (auth.uid() = user_id)
with check (auth.uid() = user_id)
```

Para tabelas sem `user_id` direto, como `topicos` e `revisoes`, a política valida a posse por joins com `materias`.

## Catálogo oficial de editais

O catálogo oficial é lido por usuários autenticados, mas não é editável por usuários comuns.

Permissões:

```sql
grant select on public.editais_prontos to authenticated;
grant select on public.editais_prontos_materias to authenticated;
grant select on public.editais_prontos_topicos to authenticated;
```

Política de edital:

```sql
for select using (publicado = true)
```

Política de matérias:

```sql
for select using (
  exists (
    select 1
    from public.editais_prontos
    where editais_prontos.id = editais_prontos_materias.edital_id
      and editais_prontos.publicado = true
  )
)
```

Política de tópicos:

```sql
for select using (
  exists (
    select 1
    from public.editais_prontos_materias
    join public.editais_prontos on editais_prontos.id = editais_prontos_materias.edital_id
    where editais_prontos_materias.id = editais_prontos_topicos.materia_id
      and editais_prontos.publicado = true
  )
)
```

## Importação segura

A RPC `import_ready_edital(p_edital_id text)` usa:

```sql
v_user_id uuid := auth.uid();
```

O cliente nunca envia `user_id`.

Isso evita importação para outro usuário e mantém a regra de posse dentro do banco.

## Regras de manutenção

- Usuário comum não deve ter `insert`, `update` ou `delete` nas tabelas `editais_prontos*`.
- Publicação/despublicação futura deve passar por painel admin ou processo controlado.
- Tópicos e matérias de editais não publicados não devem ser legíveis.

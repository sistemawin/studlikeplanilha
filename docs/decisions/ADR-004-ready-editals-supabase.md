# ADR-004 — Supabase como fonte oficial dos editais prontos

**Status:** Aceito  
**Data:** 2026-05-18  
**Atualizado:** 2026-05-19

## Contexto

O catálogo de editais oficiais estava hardcoded em `src/lib/readyEditals.ts`, enquanto o Supabase já possuía tabelas e RPC para o mesmo domínio.

Isso criava duas fontes de verdade:

- TypeScript para a UI.
- SQL/Supabase para catálogo e substituição oficial.

## Decisão

Usar o Supabase como fonte única de verdade para o catálogo oficial.

O arquivo `src/lib/readyEditals.ts` deixa de conter dados oficiais e passa a manter apenas contratos TypeScript.

O produto mantém apenas um edital ativo por usuário. Adicionar um edital oficial substitui o plano atual, após confirmação explícita.

## Implementação

```text
editais_prontos
  ↓
services/supabase/readyEditals.ts
  ↓
hooks/useReadyEditals.ts
  ↓
ReadyEditalsPanel
```

Substituição:

```text
page.tsx
  ↓
replaceOfficialReadyEdital()
  ↓
rpc replace_ready_edital(p_edital_id)
  ↓
loadRemoteState()
```

## Justificativa

- Novo edital não exige deploy de frontend.
- Banco vira fonte auditável e publicável.
- RPC garante substituição com `auth.uid()` e sem `user_id` vindo do cliente.
- Evita mistura de matérias, tópicos, revisões e cronograma de editais diferentes.
- Remove duplicação entre TS e SQL.
- Mantém componentes visuais sem acesso direto ao Supabase.

## Trade-offs

- Catálogo depende de conectividade para a primeira carga.
- É necessário manter migration/seed do catálogo oficial.
- O app precisa tratar loading/error do catálogo.
- Cache offline do catálogo vira uma etapa futura, separada do `AppState`.

## Consequências

- `ReadyEditalsPanel` recebe dados por props.
- `useReadyEditals` controla carregamento.
- `services/supabase/readyEditals.ts` concentra queries e RPC.
- `readyEditals.ts` não pode voltar a exportar dados oficiais.
- Fluxos novos devem chamar `replace_ready_edital`; a importação aditiva antiga não é regra de produto.

## Revisar Quando

- O catálogo precisar funcionar offline antes de qualquer carga online.
- For criado painel admin para editais.
- For necessário versionar editais e diffs entre versões.

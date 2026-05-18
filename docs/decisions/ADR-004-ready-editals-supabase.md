# ADR-004 — Supabase como fonte oficial dos editais prontos

**Status:** Aceito  
**Data:** 2026-05-18

## Contexto

O catálogo de editais oficiais estava hardcoded em `src/lib/readyEditals.ts`, enquanto o Supabase já possuía tabelas e RPC para o mesmo domínio.

Isso criava duas fontes de verdade:

- TypeScript para a UI.
- SQL/Supabase para catálogo e importação oficial.

## Decisão

Usar o Supabase como fonte única de verdade para o catálogo oficial.

O arquivo `src/lib/readyEditals.ts` deixa de conter dados oficiais e passa a manter apenas contratos TypeScript.

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

Importação:

```text
page.tsx
  ↓
importOfficialReadyEdital()
  ↓
rpc import_ready_edital(p_edital_id)
  ↓
loadRemoteState()
```

## Justificativa

- Novo edital não exige deploy de frontend.
- Banco vira fonte auditável e publicável.
- RPC garante importação com `auth.uid()` e sem `user_id` vindo do cliente.
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

## Revisar Quando

- O catálogo precisar funcionar offline antes de qualquer carga online.
- For criado painel admin para editais.
- For necessário versionar editais e diffs entre versões.

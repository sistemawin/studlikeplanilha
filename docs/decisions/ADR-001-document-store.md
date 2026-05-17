# ADR-001 — Document Store (JSONB) em vez de tabelas relacionais

**Status:** Aceito  
**Data:** 2025

## Contexto

O estado da aplicação (matérias, tópicos, revisões, sessões, etc.) precisa ser persistido e sincronizado.

## Decisão

Usar uma única tabela `app_state` com uma coluna JSONB por usuário, serializando todo o AppState como JSON.

## Justificativa

- Velocidade de iteração: mudanças de schema não requerem migrações SQL
- Modelo de dados evolui rapidamente durante desenvolvimento
- RLS simples: `auth.uid() = id` em uma tabela
- Sync trivial: upsert de uma linha por usuário
- TypeScript é a única fonte da verdade de schema (validado em `services/supabase/sync.ts`)

## Trade-offs negativos

- Sem queries relacionais (não dá para filtrar revisões de um tópico específico via SQL)
- Performance piora à medida que o JSON cresce (muitas sessões, muitas revisões)
- Sem constraints de banco (integridade referencial é responsabilidade do código)

## Quando revisar

Quando o JSON de um usuário ultrapassar ~1MB ou quando precisar de queries analíticas no banco.

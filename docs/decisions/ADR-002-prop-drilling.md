# ADR-002 — Prop Drilling em vez de Context/Zustand

**Status:** Aceito  
**Data:** 2025

## Contexto

O app tem estado global (subjects, topics, reviews, sessions, etc.) que precisa chegar a múltiplos componentes.

## Decisão

Estado centralizado em `app/page.tsx`, passado via props para features. Sem Context, sem Zustand.

## Justificativa

- O app é uma SPA single-page — o prop drilling não atravessa rotas
- Rastreabilidade: dados e callbacks têm origem explícita
- Debug simples: não há mágica de Context ou reatividade oculta
- Suficiente para a profundidade atual da árvore de componentes

## Trade-offs negativos

- `page.tsx` cresce em responsabilidade (2.349 linhas atualmente)
- Adicionar uma nova prop a um componente profundo requer passar por todos os intermediários

## Quando revisar

Quando `page.tsx` ultrapassar 3.000 linhas ou quando features precisarem de estado compartilhado entre si sem passar por `page.tsx`.

# PlanilhaGPT

Aplicação web responsiva para concurseiros de alta performance, construída com Next.js, Tailwind CSS e estrutura Supabase.

## O que já está implementado

- Dashboard administrativo com menu lateral no desktop e bottom nav no mobile.
- Edital verticalizado por matéria e tópico.
- Status por tópico: `Não Estudado`, `Teoria Lida`, `Questões Feitas`, `Revisado`.
- Progresso geral e por matéria.
- Motor de revisão 1/7/21/30 ao marcar tópico como estudado.
- Revisões adicionais por dificuldade.
- Revisão manual com data definida pelo usuário.
- Painel `Para revisar hoje` com pendências e atrasos.
- Planejamento semanal ou por ciclos.
- Metas de horas e questões.
- Registro de simulados com cálculo `(Acertos / Total de Questões) * 100`.
- Arquivamento total do edital.
- Persistência local via `localStorage` para teste imediato.
- Schema SQL Supabase com RLS em `supabase/schema.sql`.
- Edge Function base em `supabase/functions/daily-review-alerts`.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Conectar ao Supabase

Crie `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Depois aplique `supabase/schema.sql` no SQL Editor do Supabase ou via Supabase CLI.

O arquivo `src/lib/supabase.ts` já expõe `getSupabaseBrowserClient()` com inicialização preguiçosa para uso futuro em queries reais.

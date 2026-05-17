# Como criar uma nova feature

## Estrutura

```
src/features/<nome-em-kebab>/
├── components/          # Componentes visuais da feature
│   └── NomeComponente.tsx
├── domain/              # Funções puras de negócio (sem React, sem Supabase)
│   └── logic.ts
├── hooks/               # Hooks específicos (se necessário)
│   └── useNomeHook.ts
├── types.ts             # Tipos locais da feature
└── constants.ts         # Constantes da feature
```

## Regras

1. **Componentes recebem dados via props** — não buscam dados diretamente
2. **Funções de domínio são puras** — sem side effects, sem React, sem Supabase
3. **Imports cross-feature usam `@/`** — nunca caminhos relativos entre features
4. **Estado da feature fica em `app/page.tsx`** — a feature não tem estado global próprio
5. **Tipos locais em `types.ts`**, tipos globais em `src/types/index.ts`

## Checklist ao criar feature

- [ ] Componente em `features/<nome>/components/`
- [ ] Funções de cálculo em `features/<nome>/domain/`
- [ ] Tipos locais em `features/<nome>/types.ts`
- [ ] Constantes locais em `features/<nome>/constants.ts`
- [ ] Props com tipos explícitos (sem `any`)
- [ ] Mobile-first no componente
- [ ] `ErrorBoundary` envolve o componente em `page.tsx`
- [ ] Imports atualizados se algum arquivo foi movido

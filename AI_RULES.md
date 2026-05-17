# Regras para IA — Studlike Planilha

Este arquivo define regras obrigatórias para qualquer IA (Claude Code, Copilot, Cursor, etc.) que trabalhe neste projeto. Leia antes de gerar qualquer código.

---

## Arquitetura

- **Nunca criar arquivos duplicados.** Antes de criar um componente, verifique se já existe em `features/`, `components/ui/`, `components/shared/` ou `components/charts/`.
- **Nunca criar arquivos com sufixos** como `2`, `copy`, `backup`, `old`, `new`.
- **Imports sempre via `@/`** — nunca caminhos relativos entre features (`../../../components/X`).
- **Estado global apenas em `app/page.tsx`** — features recebem dados via props, nunca buscam diretamente.
- **Acesso ao Supabase apenas em `services/supabase/`** — nunca dentro de componentes visuais ou features.
- **Ao mover um arquivo, atualizar todos os imports imediatamente.** Nunca deixar imports quebrados.

---

## React e Next.js

- **Preferir Server Components** quando não há interatividade. O default no App Router é Server Component.
- **`"use client"` apenas quando necessário** (hooks, eventos, estado local).
- **Evitar `useEffect` para sincronizar estado com props** — use derivação inline (computed values no corpo do componente).
- **Não usar `useEffect` para buscar dados em client components** — dados vêm via props de `page.tsx`.
- **Não usar `useState` para valores que podem ser derivados** de outros estados ou props.
- **Sempre usar a forma funcional de `setState`** quando o novo estado depende do anterior: `setState(prev => ...)`.

---

## Componentes

- **Manter design atual.** Não alterar cores, tipografia, espaçamentos ou identidade visual sem solicitação explícita.
- **Mobile-first obrigatório.** Começar pelo mobile, usar breakpoints Tailwind (`sm:`, `md:`, `xl:`) para adaptar.
- **Nunca usar `position: fixed` no `body`** para scroll lock — quebra `position: fixed` filhos no iOS Safari. Use apenas `overflow: hidden` em `html` e `body`.
- **Scroll lock padrão:**
  ```js
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  ```
- **Safe area iOS:** usar `pb-[calc(Xrem+env(safe-area-inset-bottom))]` em elementos fixos.
- **Selects controlados:** sempre usar `value=` + `onChange=`, nunca `defaultValue` em selects controlados pelo estado.

---

## TypeScript

- **Tipagem forte obrigatória.** Sem `any`, sem `as unknown as X` desnecessário.
- **Tipos em `src/types/index.ts`** para tipos globais. Tipos locais de feature ficam no arquivo da feature.
- **Nunca repetir tipos.** Se um tipo já existe em `@/types`, reutilizá-lo.
- **Inferir tipos quando possível** — não anotar explicitamente o que TypeScript já infere.

---

## Performance

- **Evitar re-renders desnecessários.** Usar `useMemo` para cálculos pesados, `useCallback` para funções passadas como props para componentes memoizados.
- **Não criar arrays/objetos inline em props** que causem re-render: extrair para constantes ou memoizar.
- **Não fazer fetches repetidos** do mesmo dado — centralizar em `page.tsx`.

---

## Qualidade de código

- **Sem comentários óbvios.** Comentários só para WHY não-óbvio, nunca para WHAT.
- **Sem console.log** no código commitado.
- **Sem código comentado** — se não é usado, deletar.
- **Funções pequenas e com nome claro.** Uma função = uma responsabilidade.
- **Sem features incompletas.** Se não pode implementar completamente, não implementar parcialmente.

---

## Bugs conhecidos a evitar

| Bug | Causa | Solução |
|---|---|---|
| Nav mobile pula para o meio | `body.style.position = "fixed"` | Usar só `overflow: hidden` |
| Select mostra texto invisível | `background-color: #fff` global sobrescreve | Garantir que `@layer base` envolve resets de form no globals.css |
| Select não dispara onChange no iOS | `value=""` sem `<option value="">` | Sempre ter `effectiveId` com fallback para primeira opção |
| State não atualiza com prop | `useState` com dep de prop (anti-pattern) | Derivar valor inline, não via `useEffect` |

---

## Fluxo de trabalho

1. Ler o arquivo relevante antes de editar
2. Entender o impacto da mudança em outros arquivos
3. Executar `npm run check` completo ao final
4. Criar commits descritivos com o **porquê** da mudança

---

## Checklist obrigatório antes de gerar código

Execute mentalmente antes de escrever qualquer código:

### Reutilização
- [ ] Verifiquei se já existe um componente para isso em `features/*/components/` ou `components/{ui,shared,charts}/`?
- [ ] Verifiquei se já existe uma função de domínio para isso em `features/*/domain/` ou `lib/utils.ts`?
- [ ] Verifiquei se o tipo já existe em `src/types/index.ts` ou `features/*/types.ts`?

### Arquitetura
- [ ] O componente recebe dados via props (não busca diretamente)?
- [ ] Acesso ao Supabase está APENAS em `services/supabase/`?
- [ ] Lógica de negócio complexa está em `domain/`, não no componente?
- [ ] Imports usam `@/` (não caminhos relativos entre features)?

### React
- [ ] Não usei `useEffect` para sincronizar estado com props?
- [ ] Não criei `useState` para valor que pode ser derivado inline?
- [ ] `"use client"` só está presente onde realmente necessário?
- [ ] Selects controlados têm `value` que sempre corresponde a uma `<option>` existente?

### CSS/Design
- [ ] O componente é mobile-first (sem breakpoint = mobile)?
- [ ] Não usei `position: fixed` no `body` para scroll lock?
- [ ] Mantive o design atual (cores, tipografia, espaçamento)?
- [ ] Resets de form no `globals.css` estão dentro de `@layer base`?

### Qualidade
- [ ] Sem `any` explícito no TypeScript?
- [ ] Sem `console.log` no código?
- [ ] Sem código comentado?
- [ ] Sem arquivos com sufixo 2, copy, backup, old?
- [ ] Sem duplicação de lógica já existente?

### Verificação final obrigatória
- [ ] `npm run check` passou completamente?
  - TypeScript: passou / falhou
  - Lint: passou / falhou
  - Testes: passou / falhou (X/X)
  - Forbidden files: passou / falhou
  - Duplicates: passou / falhou
  - Architecture: passou / falhou
  - Domain coverage: passou / falhou
  - Build: passou / falhou

**Nunca reportar tarefa concluída sem ter rodado `npm run check` e informado o resultado de cada etapa.**

---

## Zustand — Regras obrigatórias

- **Stores contêm apenas estado compartilhado** — não usar Zustand para estado local de componente
- **Nunca colocar lógica de negócio complexa em stores** — chamar funções de `domain/`
- **Nunca duplicar estado** — se está em uma store, não colocar também em useState
- **Nunca derivar estado em store** — computar inline no componente com useMemo
- **Usar seletores granulares** em componentes: `useStore((s) => s.campo)` não `useStore()`
- **Usar `getState()` fora de render**: em funções, callbacks, setInterval — nunca chamar hooks fora de componentes
- **Sem Supabase em stores** — stores são puramente UI state

## Testes de domínio

- **Criar `.test.ts` ao lado de cada arquivo `domain/*.ts`**
- **Testar todos os casos extremos**: empty array, zero, null, out-of-range
- **Rodar `npm run test` antes de qualquer commit que altere `domain/`**
- **Nunca alterar comportamento de domain sem atualizar o teste correspondente**
- **`npm run check:domain` falha se qualquer domain/ não tiver teste** — isso é intencional

---

## Sincronização — Regras obrigatórias

Consulte `docs/synchronization/` para arquitetura completa.

### Acesso e fluxo

- **Nunca chamar `saveRemoteState` diretamente de componentes ou UI** — use sempre `syncAppState` do coordinator
- **Nunca sincronizar direto do componente** — sync é responsabilidade do `useEffect` em page.tsx
- **Todo acesso ao Supabase** deve estar em `services/supabase/` — nunca em features ou componentes
- **Persistir localmente antes de tentar rede** — `persistLocally` sempre precede `saveRemoteState`

### Retry e confiabilidade

- **Nunca criar retry infinito** — sempre definir `maxAttempts` explícito
- **Toda sync crítica deve usar `withRetry`** — nunca call único sem retry para dados do usuário
- **Toda operação em `saveRemoteState` deve ser idempotente** — upsert por ID, não insert único
- **Alterar `saveRemoteState`?** — verificar que a operação continua idempotente após a mudança

### Persistência local

- **Qualquer mudança em `local.ts`** exige auditoria do formato de chave e versionamento
- **Não remover `clearPersisted()` do logout** — dados de um usuário nunca podem vazar para outro
- **Versão do schema** (`VERSION = 1`) — incrementar se estrutura de `StoredEntry` mudar

### Safe guards

- **`syncInFlightRef`** — nunca remover: previne syncs concorrentes
- **`lastSyncedStateRef`** — atualizar APENAS em sync confirmada (`status: "synced"`)
- **`isOnlineState` nas deps do sync effect** — garante flush automático ao reconectar
- **Nunca criar múltiplos `setInterval` para o timer** — Zustand store garante estado único
- **Fila de pendentes (`syncQueue`)** — um slot por vez, não lista de operações

### Testes

- **Toda alteração em `services/sync/coordinator.ts`** exige atualização em `coordinator.test.ts`
- **Toda alteração em `services/retry/backoff.ts`** exige atualização em `backoff.test.ts`
- **Nova operação em `saveRemoteState`** deve ser idempotente — documentar e testar se possível
- **Usar `fastRetry = { maxAttempts: 1, baseMs: 1 }`** em testes para evitar delays reais

---

## Pipeline de qualidade

Consulte `docs/quality/CHECKS.md` para detalhes de cada check.

**Obrigação:** antes de reportar qualquer tarefa como concluída, rode:

```bash
npm run check
```

E informe o resultado de **cada etapa**:

```
✅ typecheck    — passou
✅ lint         — passou
✅ test         — passou (109/109)
✅ forbidden    — passou
✅ duplicates   — passou
✅ architecture — passou
✅ domain       — passou (5/5)
✅ build        — passou
```

Se qualquer etapa falhar, corrija e rode novamente até tudo passar.

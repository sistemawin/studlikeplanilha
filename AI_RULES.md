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
3. Executar `npx tsc --noEmit` após mudanças
4. Executar `npm run build` para confirmar
5. Criar commits descritivos com o **porquê** da mudança

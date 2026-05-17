# Components — Studlike Planilha

## Sistema de design

Identidade visual baseada em:
- **Cor primária:** `#1877F2` (azul Facebook/StudLike)
- **Cor de fundo:** `#f0f2f5` (cinza claro)
- **Texto principal:** `#111827` (`var(--foreground)`)
- **Cards:** branco (`#ffffff`) com `shadow-[0_18px_45px_rgba(15,23,42,0.08)]`
- **Border:** `rgba(15,23,42,0.09)`

---

## Tipografia

| Uso | Classe Tailwind |
|---|---|
| Título de seção | `text-lg font-bold text-slate-950` |
| Subtítulo | `text-sm font-semibold text-slate-700` |
| Label uppercase | `text-[10px] font-bold uppercase tracking-[0.18em]` |
| Corpo | `text-sm text-slate-600` |
| Número destaque | `text-2xl font-black` |
| Timer/mono | `font-mono text-7xl font-semibold` |

---

## Espaçamentos padrão

| Contexto | Valor |
|---|---|
| Padding de card (desktop) | `p-5` ou `p-6` |
| Padding de card (mobile) | `p-4` |
| Gap entre seções | `gap-4` ou `gap-6` |
| Altura de botão padrão | `h-11` |
| Altura de botão pequeno | `h-9` |
| Altura de input/select | `h-9` |
| Border radius de card | `rounded-2xl` |
| Border radius de botão | `rounded-xl` |

---

## Componentes globais

### `components/ui/`

#### `NavButton`
Botão de navegação do menu mobile. Aceita ícone, label e estado `active`.

#### `ConfirmDialog`
Modal de confirmação destrutiva. Props: `open`, `title`, `description`, `details?`, `confirmLabel?`, `loading?`, `onConfirm`, `onClose`.
- Usa apenas `overflow: hidden` para scroll lock (sem `position: fixed` no body — bug iOS)

#### `ProgressBar`
Barra de progresso simples. Props: `value` (0–100), `color?`.

#### `StudlikeLogo`
SVG do logo. Sem props.

---

### `components/shared/`

#### `ErrorBoundary`
Captura erros de render de filhos. Props: `label` (nome da seção para debug), `children`.

#### `GlobalSearch`
Modal de busca global de matérias e tópicos. Ativado via `searchOpen` em `page.tsx`.
- Scroll lock com `overflow: hidden` apenas

#### `AppFeedbackToast`
Toast de feedback não-intrusivo no canto superior direito. Props: `feedback` (message + tone), `onDismiss`.
- Tons: `success`, `error`, `info`

#### `SuggestionModal`
Modal para envio de sugestão ao admin.

---

### `components/charts/`

#### `PieChart`
Gráfico de pizza SVG puro (sem lib externa). Props: `slices: ChartSlice[]`, `size?`.

---

## Componentes de feature

### `features/auth/components/AuthScreen`
Tela completa de autenticação. Modos: `login`, `signup`, `reset`.

### `features/dashboard/components/Dashboard`
Tela inicial. Mostra: KPIs, streak, heatmap, conquistas, plano do dia, próxima prova, sessões recentes.

### `features/subjects/components/`
- `Edital` — lista de matérias e tópicos com filtros e ações
- `SubjectModal` — criar/editar matéria
- `ArchiveEditalModal` — importar edital pronto

### `features/revisions/components/`
- `Reviews` — lista de revisões do dia com filtro por matéria
- `ReviewFocusMode` — modo foco de revisão (card a card)

### `features/timer/components/`
- `FocusTimer` — tela de modo foco com timer, pomodoro, seletor de sessão
- `SessionHistoryModal` — histórico de sessões com exportação CSV

### `features/planner/components/Schedule`
Cronograma semanal e ciclo de estudos configurável.

### `features/statistics/components/Exams`
Registro de simulados, questões praticadas, gráficos de desempenho.

---

## Padrões mobile-first

Todos os componentes seguem Tailwind mobile-first:

```
className="p-4 sm:p-5 md:p-6"      // espaçamento cresce
className="text-sm md:text-base"    // fonte cresce
className="grid-cols-1 sm:grid-cols-2 md:grid-cols-3"  // grid responsivo
```

### Nav mobile
Renderizada via `createPortal` no `document.body` para garantir z-index correto.
Classe `.mobile-bottom-nav` com `position: fixed !important` no globals.css.
Oculta (`hidden`) quando modais de tela cheia estão abertos.

### Safe area (iOS)
Padding inferior com `pb-[calc(X+env(safe-area-inset-bottom))]` em todos os elementos fixos.

---

## Scroll lock

**Padrão correto (não quebra nav iOS):**
```js
document.documentElement.style.overflow = "hidden";
document.body.style.overflow = "hidden";
```

**Nunca usar:**
```js
document.body.style.position = "fixed"; // quebra position:fixed filhos no iOS Safari
```

---

## Estados padrão

| Estado | Padrão visual |
|---|---|
| Loading | `Loader2` animado (lucide) |
| Lista vazia | Texto em `text-slate-500` centralizado |
| Erro | Toast `AppFeedbackToast` tom `error` |
| Confirmação destrutiva | `ConfirmDialog` com ícone `AlertTriangle` |
| Sucesso | Toast `AppFeedbackToast` tom `success` |

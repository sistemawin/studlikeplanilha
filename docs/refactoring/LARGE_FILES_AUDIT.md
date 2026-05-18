# Auditoria de Arquivos Grandes — Studlike Planilha

Data: 2026-05-17

---

## Resumo executivo

| Arquivo | Linhas | Risco de mexer | Prioridade |
|---|---|---|---|
| `src/app/page.tsx` | 2.388 | Alto — orquestrador central | 1 |
| `src/features/statistics/components/Exams.tsx` | 1.116 | Médio — UI complexa | 2 |
| `src/features/subjects/components/Edital.tsx` | 790 | Médio — UI com estado local | 3 |
| `src/features/dashboard/components/Dashboard.tsx` | 707 | Médio — muitas seções | 4 |
| `src/features/planner/components/Schedule.tsx` | 387 | Baixo — aceitável | — |
| `src/features/admin/components/AdminPanel.tsx` | 373 | Baixo — aceitável | — |
| `src/services/supabase/sync.ts` | 368 | Alto — lógica crítica | — |

---

## 1. `src/app/page.tsx` — 2.388 linhas

### Responsabilidades misturadas

| Bloco | Linhas estimadas | Pode extrair? |
|---|---|---|
| Imports | 70 | Não |
| Tipos e constantes locais | 15 | Sim → tipos para @/types |
| Estado de app (subjects, topics, etc.) | 25 | Não — núcleo do orchestrador |
| Estado de UI (modais, nav, etc.) | 30 | Não — tightly coupled |
| Estado de auth | 15 | ✅ Sim → `hooks/useAuthState.ts` |
| Estado de admin | 20 | ✅ Sim → `hooks/useAdminActions.ts` |
| Estado de timer (Zustand) | 10 | Não — já usa Zustand |
| Estado de sync/offline | 20 | Não — crítico, não alterar |
| Efeitos de app (load, sync, etc.) | 200 | Não — inter-dependentes |
| Efeito de auth | 45 | ✅ Sim → `hooks/useAuthState.ts` |
| Efeito de admin check | 25 | ✅ Sim → `hooks/useAdminActions.ts` |
| Derived state | 50 | Não — calculado de múltiplos estados |
| Actions de tópicos/matérias | 200 | Não — dependem de muitos estados |
| Actions de revisões/metas | 100 | Não — dependem de muitos estados |
| Actions de admin | 175 | ✅ Sim → `hooks/useAdminActions.ts` |
| Auth functions | 115 | ✅ Sim → `hooks/useAuthState.ts` |
| JSX de loading/auth gates | 80 | Parcial — extração simples |
| JSX de layout/nav mobile | 120 | Não — sem valor de extração |
| JSX de header | 150 | Não — dependências diretas |
| JSX de seções (delega para features) | 160 | Já delegado |

### Risco de mexer

Alto. `page.tsx` é o orchestrador central com closure sobre todos os estados. Qualquer extração errada cria state stale ou quebra sync.

### O que foi extraído

- `hooks/useAuthState.ts` — auth state + init effect + changeAuthMode/submitAuth/signOut
- `hooks/useAdminActions.ts` — admin state + admin check effect + todas as funções admin
- `hooks/useStudyActions.ts` — reviews, planner, exams, sessions, question logs, goals (14 funções)
- `hooks/useTimerController.ts` — todas as 7 funções do timer incluindo finishSession
- `hooks/useSubjectActions.ts` — addSubject, importReadyEdital, updateSubject, deleteSubject
- `hooks/useTopicActions.ts` — updateTopicStatus, updateTopicDifficulty, moveTopic, editTopicTitle (+ scheduleReviews interno)
- `hooks/useTopicMutations.ts` — addTopicsFromText, deleteTopic (+ confirmDeleteTopic interno)

### Resultado atual

- Antes: **2.388 linhas**
- Depois: **1.437 linhas** (~951 linhas removidas, -40%)

### O que NÃO deve ser extraído de page.tsx

- Estado principal (subjects, topics, reviews, schedule, goals, exams) — fonte de verdade do app
- Efeito de sync — crítico para offline-first, não alterar
- Efeito de load — crítico para carregamento inicial
- `addTopicsFromText` — usa `newTopicText` + `selectedSubject` (UI state adicional, passaria do limite de 8 deps)
- `deleteTopic`/`confirmDeleteTopic` — dependem de `reviews`, `questionLogs`, `selectedManualTopic`, `setConfirmDialog` (deps demais)
- `exitReadOnlyMode` — usa Supabase/auth diretamente
- Derived state — calculado inline é mais simples que hooks separados

---

## 2. `src/features/statistics/components/Exams.tsx` — 435 linhas (era 1.116)

### O que foi extraído

- `GoalCard.tsx` — card de meta com edição inline (~80 linhas)
- `QuestionLogForm.tsx` — formulário + histórico de questões por tópico (~140 linhas, tem estado próprio)
- `ExamRegistrationForm.tsx` — formulário + lista de simulados (~80 linhas)
- `StatisticsCharts.tsx` — toda a seção de gráficos/analytics (6 props, ~412 linhas de JSX)

### Risco de mexer no restante

Baixo. O que resta em Exams.tsx: computação derivada (220 linhas), seção de metas/formulários (120 linhas), montagem das props do StatisticsCharts. Tudo display ou cálculo puro.

### StatisticsCharts tem responsabilidade clara

Recebe 2 objetos de dados tipados (`charts` e `diagnosis`) + 4 props escalares. É puramente presentacional — zero estado próprio, zero chamadas a setters.

---

## 3. `src/features/subjects/components/Edital.tsx` — 502 linhas (era 790)

### O que foi extraído

- `SubjectCard.tsx` — card de matéria com actions editar/excluir (~90 linhas)
- `editalConstants.ts` — constantes compartilhadas STATUS_COLORS, DIFFICULTY_COLORS, STATUS_CYCLE, DIFFICULTY_CYCLE, STATUS_ORDER, DIFFICULTY_ORDER
- `TopicRow.tsx` — linha de tópico com estado próprio de edição e mover (7 props)
- `ReadyEditalsPanel.tsx` — seção de editais prontos para importar (1 prop)

### Por que SubjectDetailPanel NÃO foi extraído

`search`, `statusFilter`, `difficultyFilter` são compartilhados com `subjectMatchesFilters` (list view). Mover para dentro do painel criaria comportamento diferente OU exigiria 12+ props — ambos violam as regras.

### O que NÃO deve ser extraído de Edital.tsx

- `EditalFilters` — STATUS_CYCLE/DIFFICULTY_CYCLE compartilhados com detail view; extrair criaria dependência invertida
- View de detalhe completa — filtros compartilhados com list view impedem extração limpa

---

## 4. `src/features/dashboard/components/Dashboard.tsx` — 480 linhas (era 707)

### O que foi extraído

- `ManualSessionForm.tsx` — formulário de sessão manual com 7 estados próprios + submit logic (~155 linhas)
- `TodayPlanCard.tsx` — card de plano do dia com matérias e tópicos sugeridos (~83 linhas)

### Risco de mexer no restante

Baixo. O que resta são: KPI cards (array de objetos), strip de matérias mobile, next exam banner, achievements, stats strip, e lista de sessões recentes. Todos são display puro sem estado local.

### Dashboard.tsx está abaixo do threshold de aviso (500 linhas)

---

## Histórico de refatorações

| Data | Arquivo | Ação | Resultado |
|---|---|---|---|
| 2026-05-17 | page.tsx | Extração de useAuthState | -~160 linhas |
| 2026-05-17 | page.tsx | Extração de useAdminActions | -~200 linhas |
| 2026-05-17 | page.tsx | Extração de useStudyActions | -~290 linhas |
| 2026-05-17 | page.tsx | Extração de useTimerController | -~100 linhas |
| 2026-05-17 | page.tsx | Extração de useSubjectActions | -~115 linhas |
| 2026-05-17 | Exams.tsx | Extração de GoalCard, QuestionLogForm, ExamRegistrationForm | 1.116 → 826 linhas |
| 2026-05-17 | Edital.tsx | Extração de SubjectCard | 790 → 698 linhas |
| 2026-05-17 | Edital.tsx | Extração de TopicRow, ReadyEditalsPanel, editalConstants | 698 → 502 linhas |
| 2026-05-17 | Dashboard.tsx | Extração de ManualSessionForm, TodayPlanCard | 707 → 480 linhas |
| 2026-05-17 | page.tsx | Extração de useTopicActions | 1.527 → 1.468 linhas |
| 2026-05-17 | page.tsx | Prop objects tipados + named functions/variables | JSX principal -90 linhas de ruído |
| 2026-05-18 | Exams.tsx | Extração de StatisticsCharts | 826 → 435 linhas |
| 2026-05-18 | page.tsx | Extração de useTopicMutations | 1.487 → 1.437 linhas |

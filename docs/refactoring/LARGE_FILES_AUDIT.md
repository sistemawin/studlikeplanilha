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

### O que foi extraído nesta sessão

- `hooks/useAuthState.ts` — auth state + init effect + changeAuthMode/submitAuth/signOut
- `hooks/useAdminActions.ts` — admin state + admin check effect + todas as funções admin

### Redução estimada

- Antes: **2.388 linhas**
- Depois das extrações: **~2.030 linhas** (~358 linhas removidas)

### O que NÃO deve ser extraído de page.tsx

- Estado principal (subjects, topics, reviews, schedule, goals, exams) — é a fonte de verdade do app
- Efeito de sync — crítico para offline-first, não mexer
- Efeito de load — crítico para carregamento inicial
- Funções de negócio (scheduleReviews, finishSession, etc.) — fechamento sobre múltiplos estados
- Derived state — calculado inline é mais simples que hooks separados

---

## 2. `src/features/statistics/components/Exams.tsx` — 1.116 linhas

### Responsabilidades misturadas

- Painel de metas (Goals)
- Registro de questões por tópico (QuestionLog)
- Registro de simulados (Exams)
- Histórico de simulados
- Gráficos de desempenho
- Revisões manuais
- Histórico de sessões de estudo

### Sugestão de extração

Dividir em:
- `Exams/GoalsSection.tsx` — metas diárias
- `Exams/QuestionLogForm.tsx` — formulário de registro de questões
- `Exams/ExamHistory.tsx` — lista e gráficos de simulados
- `Exams/index.tsx` — compose das seções

### Risco de mexer

Médio. O componente recebe props claros, sem sync. A extração é segura mas trabalhosa.

### Prioridade

2 — próxima grande refatoração.

---

## 3. `src/features/subjects/components/Edital.tsx` — 790 linhas

### Responsabilidades misturadas

- Lista de matérias (sidebar)
- Lista de tópicos com filtros
- Formulários inline de adição de tópicos
- Filtros de status e dificuldade
- Import de editais prontos
- Export de edital

### Sugestão de extração

- `Edital/SubjectList.tsx` — sidebar de matérias
- `Edital/TopicList.tsx` — lista de tópicos com filtros
- `Edital/TopicFilters.tsx` — filtros de status/dificuldade
- Manter `Edital.tsx` como compose

### Risco de mexer

Médio. Tem estado local com resetagem baseada em subject change (padrão "adjust during render" — já corrigido).

---

## 4. `src/features/dashboard/components/Dashboard.tsx` — 707 linhas

### Responsabilidades misturadas

- Header com stats de hoje
- Seção de progresso
- Seção de matérias do dia
- Seção de revisões pendentes
- Timer card
- Gráfico de heatmap

### Sugestão de extração

- `Dashboard/TodaySummary.tsx` — resumo do dia
- `Dashboard/SubjectsToday.tsx` — matérias do dia
- `Dashboard/StudyTimerCard.tsx` — card do timer
- Manter `Dashboard.tsx` como compose

### Risco de mexer

Médio. Recebe props e delega callbacks, sem sync.

---

## Histórico de refatorações

| Data | Arquivo | Ação | Resultado |
|---|---|---|---|
| 2026-05-17 | page.tsx | Extração de useAuthState | -~160 linhas |
| 2026-05-17 | page.tsx | Extração de useAdminActions | -~200 linhas |

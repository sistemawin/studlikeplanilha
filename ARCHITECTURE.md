# Arquitetura — Studlike Planilha

## Estrutura de pastas

```
src/
├── app/page.tsx              # Orquestrador principal
├── features/                 # Módulos de domínio
├── components/{ui,shared,charts}/  # Componentes globais
├── services/supabase/        # Acesso ao banco
├── hooks/                    # Hooks globais
├── lib/                      # Utils, seed, editais
├── types/index.ts            # Tipos globais
└── constants/                # Constantes
```

---

## Padrão de feature

Cada feature vive em `src/features/<nome>/` e pode conter:

```
feature/
├── components/    # Componentes visuais da feature
├── hooks/         # Hooks específicos da feature
├── types.ts       # Tipos locais da feature
├── utils.ts       # Funções auxiliares da feature
├── constants.ts   # Constantes da feature
├── queries.ts     # Queries Supabase da feature (quando extraídas de page.tsx)
└── actions.ts     # Mutations/actions da feature (quando extraídas de page.tsx)
```

Features atuais:

| Feature | Responsabilidade |
|---|---|
| `auth` | Login, cadastro, recuperação de senha |
| `dashboard` | Métricas do dia, streak, conquistas, plano de hoje |
| `subjects` | Edital verticalizado, tópicos, matérias |
| `revisions` | Revisões espaçadas, modo foco de revisão |
| `planner` | Cronograma semanal e ciclos de estudo |
| `statistics` | Simulados, questões, gráficos de desempenho |
| `timer` | Modo foco (timer pomodoro/livre), histórico de sessões |
| `admin` | Painel administrativo, sugestões de usuários |

---

## Fluxo de dados

```
Supabase (PostgreSQL)
        │
        ▼
services/supabase/sync.ts   ← loadRemoteState / saveRemoteState
        │
        ▼
app/page.tsx                ← estado global (useState para tudo)
        │
        ├── props ──► features/dashboard/components/Dashboard
        ├── props ──► features/subjects/components/Edital
        ├── props ──► features/revisions/components/Reviews
        ├── props ──► features/planner/components/Schedule
        ├── props ──► features/statistics/components/Exams
        ├── props ──► features/timer/components/FocusTimer
        └── props ──► features/auth/components/AuthScreen
```

**Regra:** nenhum componente de feature faz fetch direto. Recebe dados via props e chama callbacks para mutações.

---

## Fluxo de autenticação

```
1. app/page.tsx monta
2. Supabase onAuthStateChange → setSession(session)
3. Se session → loadRemoteState(session.user.id) → setAppState(...)
4. Sem session → AuthScreen renderizado
5. Login/cadastro → supabase.auth.signIn* → setSession → loadRemoteState
6. Logout → supabase.auth.signOut → setSession(null) → limpa estado local
```

---

## Fluxo de sincronização

```
1. Qualquer mutação de estado (addTopic, completeReview, etc.)
2. React re-render → useEffect[appState] dispara com debounce 700ms
3. serializeAppState(state) → JSON string
4. Se mudou desde último sync → saveRemoteState(userId, state)
5. Supabase upsert/delete nas tabelas relacionais (`materias`, `topicos`, `revisoes`, etc.)
6. SyncStatus: idle → saving → saved (ou error)
```

Substituição de edital oficial é uma exceção controlada: o app confirma a troca
com o usuário, chama a RPC `replace_ready_edital(p_edital_id)` no Supabase,
recarrega `loadRemoteState()` e então atualiza o estado local. O catálogo oficial vem das tabelas
`editais_prontos`, `editais_prontos_materias` e `editais_prontos_topicos`.
O StudLike Foco mantém apenas um edital ativo por usuário.

---

## Fluxo de revisões espaçadas

```
completeReview(reviewId)
    │
    ├── marca review como concluída
    └── agenda próximas revisões (1, 7, 21, 30 dias)
        baseado em tipo: "1" | "7" | "21" | "30" | "dificuldade" | "manual"

Algoritmo em lib/utils.ts:
- Não Estudado → review tipo "1" (próximo dia)
- Dificuldade Alta → review tipo "dificuldade" (mais frequente)
- Tópico estudado → reviews automáticas em intervalos crescentes
```

---

## Fluxo do timer / modo foco

```
openFocusTimer()
    │
    ├── setTimerFocusOpen(true)
    ├── setTimerRunning(true)
    └── FocusTimer monta (conditional render)

Timer tick: setInterval 1s → setTimerSeconds(s => s + 1)

finishSession({ topicId, reviewId })
    ├── cria StudySession
    ├── atualiza meta de horas
    ├── marca tópico como estudadoEm
    └── completeReview(reviewId) se for revisão
```

---

## Fluxo do cronograma

```
Schedule component recebe:
- scheduleConfig (modo: "semanal" | "ciclos")
- subjects (para calcular distribuição)

Modos:
- semanal: define horas/dia por dia da semana
- ciclos: lista cíclica de matérias para alternar

autoOrganizeCiclo() em page.tsx:
- distribui matérias no ciclo baseado em peso/prioridade
```

---

## Padrões de engenharia

| Padrão | Uso |
|---|---|
| Controlled Components | Todos os forms e selects |
| Prop drilling intencional | Estado global → features via props (evita Context overhead) |
| Debounced sync | 700ms após última mutação |
| Optimistic UI | Mutações locais imediatas, sync em background |
| Portal para nav mobile | `createPortal` no `document.body` para z-index correto |
| CSS Cascade Layers | Tailwind v4 utilities em `@layer utilities` |
| Mobile-first | Tailwind default → override em `md:` e `xl:` |

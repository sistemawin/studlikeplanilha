# API — Studlike Planilha

## Supabase Client

Localização: `src/services/supabase/client.ts`

```typescript
// Client para uso no browser (usa anon key)
getSupabaseBrowserClient(): SupabaseClient

// Client com password verifier (fluxo de autenticação especial)
getSupabasePasswordVerifierClient(): SupabaseClient
```

Variáveis de ambiente necessárias:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Sincronização de estado

Localização: `src/services/supabase/sync.ts`

### `loadRemoteState(supabase, userId)`

Carrega o estado do usuário do Supabase.

```typescript
async function loadRemoteState(
  supabase: SupabaseClient,
  userId: string
): Promise<AppState | null>
```

- Faz SELECT na tabela `app_state` WHERE id = userId
- Retorna `null` se não houver estado salvo (novo usuário)
- Valida e mescla com defaults via `validateSchedule`

### `saveRemoteState(supabase, userId, state)`

Salva o estado do usuário no Supabase.

```typescript
async function saveRemoteState(
  supabase: SupabaseClient,
  userId: string,
  state: AppState
): Promise<void>
```

- UPSERT na tabela `app_state`
- Debounce de 700ms no `page.tsx` antes de chamar

### `serializeAppState(state)`

Serializa o estado para string JSON determinística.

```typescript
function serializeAppState(state: AppState): string
```

- Ordena chaves para comparação consistente (detecta mudanças reais)
- Usado para evitar saves desnecessários

### `validateSchedule(raw, fallback)`

Valida e normaliza a config de cronograma.

```typescript
function validateSchedule(raw: unknown, fallback: ScheduleConfig): ScheduleConfig
```

- Aceita `"semanal"` ou `"ciclos"` como modos válidos
- Retorna `fallback` para qualquer valor inválido

---

## Autenticação

Fluxos implementados em `app/page.tsx` via Supabase Auth:

### Login com email + senha
```typescript
supabase.auth.signInWithPassword({ email, password })
```

### Cadastro
```typescript
supabase.auth.signUp({ email, password })
```

### Recuperação de senha
```typescript
supabase.auth.resetPasswordForEmail(email)
supabase.auth.updateUser({ password: newPassword })
```

### Logout
```typescript
supabase.auth.signOut()
```

### Listener de sessão
```typescript
supabase.auth.onAuthStateChange((event, session) => { ... })
```

---

## API Route

### `GET /api/app-version`

Retorna a versão atual do app (hash do build) para controle de atualização via Service Worker.

```typescript
// Response
{ version: string }
```

---

## Funções utilitárias

Localização: `src/lib/utils.ts`

| Função | Assinatura | Descrição |
|---|---|---|
| `formatTimer` | `(seconds: number) => string` | `"01:23:45"` |
| `isoDate` | `(date: Date) => string` | `"2025-05-17"` |
| `addDays` | `(base: Date, days: number) => string` | ISO date + N dias |
| `pct` | `(value: number, total: number) => number` | Percentual 0-100 |
| `computeStreak` | `(sessions, today) => number` | Sequência de dias estudados |
| `topicScore` | `(status: TopicStatus) => number` | Score 0-100 do status |
| `corToAccent` | `(cor: string) => SubjectAccent` | Cor Tailwind → accent object |
| `statusTone` | `(status: TopicStatus) => string` | Cor CSS do status |
| `pieBackground` | `(slices) => string` | CSS `conic-gradient` para PieChart |

---

## Tratamento de erros

- Erros de auth: `setAuthError(message)` → exibido em `AuthScreen`
- Erros de sync: `setSyncStatus("error")` → toast `AppFeedbackToast`
- Erros de componente: capturados por `ErrorBoundary` → fallback visual por seção
- Erros de admin: notificados via `setNotice(message)`

---

## Cache e performance

- Sem cache HTTP explícito (dados em tempo real via Supabase)
- Debounce de 700ms para evitar saves excessivos
- `useMemo` para dados derivados pesados em `page.tsx` (topicById, subjectById, pendingToday, etc.)
- Service Worker com `next-pwa` para cache de assets estáticos

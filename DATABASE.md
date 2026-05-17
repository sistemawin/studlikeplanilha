# Database — Studlike Planilha

## Visão geral

O banco usa Supabase (PostgreSQL). A estratégia de persistência é **document store por usuário**: todo o estado da aplicação é serializado como JSON e salvo em uma única linha por usuário na tabela `app_state`.

Isso simplifica o sync, evita migrações complexas e permite evolução rápida do schema de dados.

---

## Tabelas

### `app_state`

Armazena o estado completo de cada usuário.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid (PK) | ID do usuário (referencia `auth.users`) |
| `state` | jsonb | Estado serializado (subjects, topics, reviews, etc.) |
| `updated_at` | timestamptz | Última atualização |

**Schema interno do campo `state` (TypeScript):**

```typescript
type AppState = {
  subjects: Subject[]        // Matérias do edital
  topics: Topic[]            // Tópicos de cada matéria
  reviews: Review[]          // Revisões agendadas
  schedule: ScheduleConfig   // Configuração do cronograma
  goals: Goal[]              // Metas (horas/dia, questões/dia)
  exams: Exam[]              // Simulados registrados
  questionLogs: QuestionLog[] // Questões praticadas
  studySessions: StudySession[] // Sessões do timer
}
```

---

### `suggestions`

Sugestões enviadas por usuários ao administrador.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid (PK) | ID da sugestão |
| `user_id` | uuid | Usuário que enviou |
| `categoria` | text | Categoria da sugestão |
| `mensagem` | text | Texto da sugestão |
| `status` | text | `pending` \| `accepted` \| `rejected` |
| `created_at` | timestamptz | Data de criação |

---

## Autenticação

Usa `auth.users` do Supabase nativo:
- Email + senha
- Recuperação de senha via email
- Usuários bloqueados via `banned_until` em `auth.users`

---

## Row Level Security (RLS)

### `app_state`

```sql
-- Usuário só lê/escreve seu próprio estado
CREATE POLICY "own_state" ON app_state
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

### `suggestions`

```sql
-- Qualquer usuário autenticado cria sugestões
CREATE POLICY "insert_suggestions" ON suggestions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin lê todas as sugestões (via service_role ou policy de admin)
```

---

## Estratégia de sync

```
1. loadRemoteState(userId):
   SELECT state FROM app_state WHERE id = userId

2. saveRemoteState(userId, state):
   UPSERT INTO app_state (id, state, updated_at)
   ON CONFLICT (id) DO UPDATE SET state = ..., updated_at = now()

3. Debounce: 700ms após última mutação local
4. Sem tempo real / websockets — pull-on-load, push-on-change
```

---

## Tipos de revisão

| Tipo | Intervalo | Gatilho |
|---|---|---|
| `"1"` | 1 dia | Primeiro estudo do tópico |
| `"7"` | 7 dias | Após revisão de 1 dia |
| `"21"` | 21 dias | Após revisão de 7 dias |
| `"30"` | 30 dias | Após revisão de 21 dias |
| `"dificuldade"` | Baseado em dificuldade | Tópico marcado como difícil |
| `"manual"` | Definido pelo usuário | Reagendamento manual |

---

## Pontos de atenção

- **JSONB não tem schema enforcement** — validação feita em `services/supabase/sync.ts` via `validateSchedule`
- **Migrações**: mudanças de schema do `state` precisam de backward compatibility — `validateSchedule` faz merge com defaults
- **Performance**: state cresce com o tempo (sessões, revisões) — considerar arquivamento de dados antigos
- **Tamanho máximo**: JSONB no PostgreSQL suporta até 255MB por linha — não é limitante na prática

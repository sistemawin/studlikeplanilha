# Auditoria de Sincronização — Studlike Planilha

Data da auditoria: 2026-05-17

---

## 1. Mapa do fluxo atual

```
Usuário faz alteração
  → React setState (subjects, topics, reviews, etc.)
    → useEffect detecta mudança (deps: todos os 8 estados + session + remoteReady)
      → debounce 700ms
        → runSync()
          → saveRemoteState(supabase, userId, fullState)
            → 10 operações sequenciais no banco
              → upsert materias → delete materias removidas
              → upsert topicos → delete topicos removidos
              → upsert revisoes → delete revisoes removidas
              → upsert metas → delete metas removidas
              → upsert simulados → delete simulados removidos
              → upsert questoes (try/catch tabela ausente)
              → upsert sessoes_estudo (try/catch tabela ausente)
              → DELETE cronograma → INSERT cronograma  ← BUG
```

**Sincronização é full-state**: cada alteração sincroniza o estado inteiro (não deltas).

---

## 2. O que está sólido

| Ponto | Por quê |
|---|---|
| Debounce de 700ms | Evita flood de requisições em edições rápidas |
| `syncInFlightRef` + `pendingSyncRef` | Impede sincronizações concorrentes; enfileira próxima sync |
| Comparação por serialização (`lastSyncedStateRef`) | Impede sync se estado não mudou |
| Upsert com `onConflict: "id"` | Operações idempotentes — retry seguro |
| Deletes scoped (`in("materia_id", subjectIds)`) | Evita deletar dados de outros usuários |
| `cancelled` flag no load effect | Previne race condition de sessão antiga sobrescrevendo nova |
| `isMissingTableError` graceful | Degradação elegante se tabelas opcionais não existem |
| Validação de `ScheduleConfig` no load | Protege contra dados corrompidos no banco |
| Limpeza de estado no logout | Sem vazamento de dados entre sessões |
| `preventReadOnlyAction` em todas as mutations | Protege dados do admin em modo visualização |

---

## 3. Pontos frágeis identificados

### 3.1 BUG CRÍTICO: cronograma delete+insert não-atômico

```typescript
// sync.ts linha 359
await supabase.from("cronograma").delete().eq("user_id", userId);  // ← erro ignorado
const { error: scheduleError } = await supabase
  .from("cronograma")
  .insert({ user_id: userId, configuracao: state.schedule });
if (scheduleError) throw scheduleError;
```

**Problema**: Se o `delete` falha silenciosamente E o `insert` também falha, o cronograma é perdido sem throw. Se o `delete` sucede mas o `insert` falha, o cronograma é apagado permanentemente até a próxima sync bem-sucedida. Sem retry, a próxima sync depende de nova alteração de estado.

**Impacto**: Perda do cronograma de estudos (horas por dia, distribuição semanal, ciclos, provas).

**Severidade**: Alta — dado crítico, sem recuperação automática.

### 3.2 Sem retry em falhas de rede

Uma falha de rede, timeout ou erro HTTP temporário termina o sync imediatamente. O usuário vê "Erro ao salvar" e precisa fazer uma nova alteração para tentar novamente. Dados não salvos permanecem em risco até a próxima interação.

**Impacto**: Em conexões instáveis (mobile, Wi-Fi fraco), dados podem não ser persistidos.

### 3.3 Sem persistência local (offline-blind)

O app não usa localStorage ou IndexedDB. Se o usuário:
- Recarrega a página offline
- Perde a conexão antes da primeira sync
- O Supabase está indisponível no load inicial

→ O app mostra erro e não tem dados. Todo trabalho não sincronizado é perdido.

### 3.4 Sem fila offline

Se o usuário estudou offline por horas e fechou o app, nada é enfileirado. Próxima abertura tenta carregar do Supabase (falha) e não sabe que há dados locais para sincronizar.

### 3.5 Sem detecção de reconexão

O app não escuta `window.addEventListener("online", ...)`. Se o usuário estava offline, fez alterações (que ficaram em "pending"), e voltou a ficar online, a sync não é disparada automaticamente — apenas na próxima alteração de estado.

### 3.6 Sync sem limite de tentativas explícito

O padrão `pendingSyncRef` + recursão em `runSync` implica que, enquanto o estado continuar mudando, novas syncs serão tentadas. Mas cada tentativa individual não tem retry — uma falha termina aquela tentativa.

### 3.7 Operações sequenciais sem transação

`saveRemoteState` faz ~10 operações sequenciais. Se a operação 7 (ex: `sessoes_estudo`) falha, as operações 1-6 já foram commitadas. O banco fica parcialmente atualizado. Na próxima sync, as operações 1-6 são idempotentes (upsert), mas a operação 7 e seguintes são repetidas. **Risco baixo** porque todas as operações são upserts e a idempotência garante correção eventual, mas é um estado inconsistente temporário.

### 3.8 `cronograma` delete afeta `lastSyncedStateRef`

Se o `delete` do cronograma succede mas o `insert` falha e é capturado como throw, `lastSyncedStateRef` **não é atualizado** (correto — o catch bloqueia). Na próxima tentativa, o cronograma foi deletado. O re-try correto (próxima alteração) vai: delete (0 rows, OK) + insert (sucede). Então com retry explícito, isso se resolve. Sem retry, há uma janela de risco.

---

## 4. Riscos silenciosos

| Risco | Probabilidade | Impacto | Status |
|---|---|---|---|
| Cronograma apagado sem insert | Baixa | Alta | **BUG CONFIRMADO** |
| Dados perdidos em offline | Alta (mobile) | Alta | Sem proteção |
| Dados não sincronizados após rede cair | Média | Alta | Sem retry |
| Usuário fecha aba durante debounce | Baixa-Média | Média | Dados podem não ser salvos |
| Múltiplos timers ativos | Baixa | Baixa | Timer Zustand mitiga |
| Sessão duplicada (double-click) | Baixa | Baixa | UI some após first click |
| Race condition entre abas | Baixa | Média | "Last write wins" acidental |

---

## 5. Análise de concorrência

### 5.1 Race condition entre abas

Se o usuário abrir o app em duas abas simultaneamente:
- Aba A carrega estado T0
- Aba B carrega estado T0
- Aba A faz alteração → salva estado T1 no banco
- Aba B faz alteração → salva estado T2 no banco (sobrescreve T1)

**Resultado**: Alterações da aba A são perdidas. **Last write wins**.

Para um app de estudos pessoais (single user), este risco é aceitável e documentado.

### 5.2 Refresh durante debounce

Se o usuário altera um tópico e fecha o app dentro de 700ms:
- O debounce não disparou
- Os dados locais não foram salvos no Supabase
- Sem localStorage, os dados são perdidos

**Mitigação**: Com localStorage, o estado seria salvo imediatamente antes do debounce.

---

## 6. Análise de performance

| Operação | Custo atual |
|---|---|
| `serializeAppState` por cada state change | Serializa todo o AppState a cada render |
| `saveRemoteState` | 10 operações SQL sequenciais (~500ms-2s) |
| Debounce 700ms | Adequado para uso interativo |
| `syncInFlightRef` previne paralelismo | Operações enfileiradas, sem flood |
| Sem paginação de sessões | Carrega todas as sessões; pode crescer |

---

## 7. O que foi corrigido nesta auditoria

Ver `ARCHITECTURE.md` para o modelo corrigido.

### Resumo das correções:

1. **cronograma**: erro no `delete` agora é checked; retry externo cobre o caso de insert failing
2. **retry com exponential backoff**: 3 tentativas (1s, 2s, 4s) antes de marcar como erro
3. **localStorage persistence**: estado salvo localmente a cada sync bem-sucedida e como fallback no load
4. **fila de pending sync**: marca sync pendente quando offline ou falha; re-tenta ao reconectar
5. **detecção de reconexão**: `window.online` → re-dispara sync se há pendentes
6. **isOnline check**: sync abortada antes de tentar rede quando offline

---

## 8. O que não foi corrigido (e por quê)

| Item | Decisão |
|---|---|
| Transação SQL real | Exigiria migração de schema + RPC — complexidade alta, risco baixo com idempotência |
| Conflict resolution entre abas | Overkill para single-user app — documentado |
| IndexedDB para dados grandes | localStorage é suficiente para o volume atual (< 1MB) |
| Supabase Realtime | Escopo futuro — ver TODO.md |
| Deduplicação cross-tab | `BroadcastChannel` — escopo futuro |

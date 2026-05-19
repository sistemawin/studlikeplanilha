# Arquitetura de Sincronização — Studlike Planilha

## Visão geral

```
┌────────────────────────────────────────────────────────────┐
│                     page.tsx (React)                        │
│  useState: subjects, topics, reviews, schedule, goals...    │
│  isOnlineState ←── online/offline events                    │
└──────────────────────────┬─────────────────────────────────┘
                           │ debounce 700ms
                           ▼
┌────────────────────────────────────────────────────────────┐
│             services/sync/coordinator.ts                    │
│  1. persistLocally()   ← sempre primeiro                    │
│  2. isOnline()         ← verifica rede                      │
│  3. withRetry()        ← 3 tentativas + backoff             │
│  4. saveRemoteState()  ← Supabase                           │
└──────┬───────────────────┬────────────────────────────────┘
       │                   │
       ▼                   ▼
┌──────────────┐   ┌───────────────────────────────────────┐
│ localStorage │   │         Supabase                       │
│ local.ts     │   │  materias, topicos, revisoes, metas,  │
│ syncQueue.ts │   │  simulados, questoes, sessoes_estudo,  │
└──────────────┘   │  cronograma                            │
                   └───────────────────────────────────────┘
```

## Camadas

### 1. `services/supabase/sync.ts` — operações de banco

Responsabilidade: ler e escrever no Supabase.

- `loadRemoteState(supabase, userId)` → `AppState`
- `saveRemoteState(supabase, userId, state)` → void
- Todas as operações são idempotentes (upsert por ID)
- Não conhece retry, localStorage ou fila

### 2. `services/persistence/local.ts` — persistência local

Responsabilidade: backup local do AppState no localStorage.

- `persistLocally(userId, state)` — salva snapshot do estado
- `loadPersisted(userId)` — carrega snapshot (null se ausente/inválido)
- `clearPersisted()` — limpa no logout
- Chave: `studlike_state_v1` (versionada)
- Escopo: por userId (não compartilha entre contas)

### 3. `services/retry/backoff.ts` — retry com backoff exponencial

Responsabilidade: repetir operações com atraso crescente.

- `withRetry(fn, opts)` — 3 tentativas por padrão
- `delayMs(attempt)` — calcula atraso (1s, 2s, 4s, máx 8s)
- Puro: sem efeitos colaterais além de `setTimeout`

### 4. `services/offline/detector.ts` — detecção de rede

Responsabilidade: verificar e monitorar conectividade.

- `isOnline()` — lê `navigator.onLine`
- `onReconnect(fn)` — escuta `window.online`

### 5. `services/queue/syncQueue.ts` — fila de sync pendente

Responsabilidade: marcar que há dados não sincronizados.

- `enqueuePendingSync(userId)` — marca pendente
- `hasPendingSync(userId)` — verifica se há pendente
- `clearPendingSync()` — limpa após sync bem-sucedida
- Chave: `studlike_pending_sync_v1`
- Single-slot: uma entrada por vez (não uma lista de operações)

### 6. `services/sync/coordinator.ts` — orquestrador

Responsabilidade: coordenar todas as camadas.

```
syncAppState(supabase, userId, state) → SyncResult
  1. persistLocally(userId, state)       // nunca falha silenciosamente
  2. if (!isOnline()) → enqueuePending, return "queued"
  3. withRetry(() => saveRemoteState())  // até 3 tentativas
  4a. sucesso → clearPendingSync, return "synced"
  4b. falha → enqueuePending, return { status: "error", error }
```

## Integração em page.tsx

### Load (ao fazer login)

```
loadRemoteState()
  ✅ sucesso → persistLocally + apply state
  ❌ falha   → loadPersisted()
               ✅ encontrou → apply local state + lastSyncedRef = ""
               ❌ não encontrou → setRemoteError
```

### Save (a cada mudança de estado)

```
useEffect([...deps, isOnlineState])
  serialized !== lastSyncedRef? → setSyncStatus("pending")
  debounce 700ms → runSync()
    syncAppState() → SyncResult
      "synced" → lastSyncedRef = serialized, "saved"
      "queued" → setSyncStatus("pending")
      "error"  → setRemoteError, "error"
```

### Reconexão

```
isOnlineState: false → true
  → useEffect re-dispara
  → serialized !== lastSyncedRef (sync anterior falhou)
  → runSync() → coordinator vê online → tenta sync
```

### Substituição de edital oficial

A troca de um edital oficial é uma exceção controlada ao fluxo normal de mutação local.

Ela é confirmada pelo usuário, feita primeiro no Supabase via RPC e só depois o estado local é atualizado:

```text
ReadyEditalsPanel
  ↓
page.tsx confirmReplaceReadyEdital()
  ↓
services/supabase/readyEditals.ts
  replaceOfficialReadyEdital()
  ↓
rpc replace_ready_edital(p_edital_id)
  ↓
loadRemoteState()
  ↓
applyAppState()
  ↓
persistLocally()
  ↓
lastSyncedStateRef = estado remoto serializado
```

Motivo: o catálogo oficial tem fonte de verdade no banco e o produto permite apenas um edital ativo por usuário. A RPC usa `auth.uid()`, remove os dados vinculados ao edital anterior, cria `materias`/`topicos` do novo edital e atualiza o `cronograma` de forma transacional.

Depois do reload remoto, `lastSyncedStateRef` é atualizado para evitar que o sync full-state sobrescreva imediatamente o resultado da RPC.

## Invariantes do sistema

1. `persistLocally` é sempre chamado ANTES de qualquer tentativa de rede
2. `lastSyncedStateRef` é atualizado APENAS em sync bem-sucedida
3. `syncInFlightRef` garante no máximo uma sync em voo por vez
4. `pendingSyncRef` enfileira próxima sync enquanto uma está em voo
5. Toda operação em `saveRemoteState` é idempotente (retry é seguro)
6. Importação de edital oficial passa por RPC e recarrega o estado remoto antes de atualizar o backup local

# Fluxo Completo de Sincronização — Studlike Planilha

## Fluxo de Load (login)

```
1. useEffect([session])
2. session existe?
   ├── NÃO → limpar estado + clearPersisted() → fim
   └── SIM → load()

3. load():
   ├── setRemoteLoading(true)
   ├── loadRemoteState(supabase, userId)
   │   ├── ✅ SUCESSO
   │   │   ├── apply state (setSubjects, setTopics, ...)
   │   │   ├── persistLocally(userId, remote)     ← snapshot local atualizado
   │   │   ├── lastSyncedStateRef = serialized    ← marca como sincronizado
   │   │   ├── setNotice("Dados carregados com segurança.")
   │   │   └── setRemoteReady(true)
   │   │
   │   └── ❌ FALHA (rede, Supabase down, etc.)
   │       ├── loadPersisted(userId)
   │       │   ├── ✅ dados locais existem
   │       │   │   ├── apply local state
   │       │   │   ├── lastSyncedStateRef = ""   ← força sync quando online
   │       │   │   ├── setRemoteReady(true)      ← permite uso offline
   │       │   │   └── setNotice("Usando dados locais. Sincronizando quando reconectar.")
   │       │   │
   │       │   └── ❌ sem dados locais
   │       │       ├── setRemoteError(msg)
   │       │       └── setNotice(msg)
   │       │
   └── setRemoteLoading(false)
```

## Fluxo de Save (ao mudar estado)

```
1. useEffect([subjects, topics, ..., isOnlineState])
2. !session || !remoteReady → return
3. readOnlyUser → setSyncStatus("idle") → return

4. Serializar estado atual
5. latestStateRef.current = state        ← captura snapshot para runSync
6. latestSerializedStateRef.current = serialized

7. serialized === lastSyncedStateRef && !hasPendingSync → setSyncStatus("idle") → return

8. setSyncStatus("pending")
9. setTimeout(700ms, runSync)            ← debounce

10. runSync():
    ├── !session || !latestStateRef → return
    ├── syncInFlightRef = true? → pendingSyncRef = true → return (aguarda)
    ├── syncInFlightRef = true
    ├── setSyncStatus("saving")
    │
    ├── syncAppState(supabase, userId, state)
    │   ├── persistLocally(userId, state)           ← SEMPRE primeiro
    │   ├── isOnline()?
    │   │   ├── NÃO → enqueuePendingSync → return { status: "queued" }
    │   │   └── SIM → withRetry(saveRemoteState, { maxAttempts: 3 })
    │   │       ├── ✅ SUCESSO → clearPendingSync → return { status: "synced" }
    │   │       └── ❌ FALHA  → enqueuePendingSync → return { status: "error", error }
    │   │
    │   └── SyncResult:
    │       ├── "synced"  → lastSyncedRef = serialized, setSyncStatus("saved")
    │       ├── "queued"  → setSyncStatus("pending")
    │       └── "error"   → setRemoteError, setNotice, setSyncStatus("error")
    │
    └── finally:
        ├── syncInFlightRef = false
        └── pendingSyncRef || serialized ≠ lastSyncedRef?
            └── runSync() ← processa próxima sync enfileirada
```

## Fluxo de Reconexão

```
1. Usuário estava offline → dados em localStorage + pending = true
2. Rede volta → window "online" event
3. handleOnline() → setIsOnlineState(true)
4. useEffect re-dispara (isOnlineState nas deps)
5. hasPendingSync(userId) = true → setSyncStatus("pending")
6. runSync() → syncAppState → isOnline() = true → withRetry(saveRemoteState)
7. ✅ → clearPendingSync → setSyncStatus("saved")
```

## Estados de SyncStatus

```
idle    ← estado inicial, sem mudanças, ou após 2s do "saved"
pending ← mudança detectada, aguardando debounce ou offline
saving  ← sync em voo (withRetry em execução)
saved   ← sync bem-sucedida (transitório 2s)
error   ← retry esgotado ou erro inesperado
```

## Diagrama de estados de SyncStatus

```
idle ──(mudança)──► pending ──(debounce)──► saving
  ▲                                         │    │
  └──────(2s timeout)────── saved ◄──────── │    │
                                            │    │
                              error ◄───────┘    │ (offline)
                                                 ▼
                              pending ◄──────────┘
```

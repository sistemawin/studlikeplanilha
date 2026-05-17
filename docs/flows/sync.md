# Fluxo — Sincronização de Dados

## Estratégia

Push-on-change com debounce. Sem real-time. Sem conflito de merge.

```
1. Qualquer mutação de estado (setSubjects, setTopics, etc.)
2. useEffect[AppState] detecta mudança
3. Debounce 700ms (aguarda fim da série de mutações)
4. serializeAppState(state) → JSON string determinística
5. Se mudou desde último sync (comparação por string) → saveRemoteState()
6. UPSERT na tabela app_state
```

## Controle de duplicação

`lastSyncedStateRef` guarda a última string sincronizada.
Sync só acontece se `serialized !== lastSyncedStateRef.current`.

## Estados de sync

```
SyncStatus = "idle" | "saving" | "saved" | "error"
```

Exibido no header como ícone de status.

## Carregamento inicial

```
loadRemoteState(userId)
    │
    ├── SELECT state FROM app_state WHERE id = userId
    ├── Se null → novo usuário → estado padrão (defaultGoals + defaultSchedule)
    └── Se existe → validateSchedule(raw) + mescla com defaults → setAppState
```

## Validação de schema

`validateSchedule()` garante backward compatibility quando o schema evolui.
Qualquer campo novo tem um valor padrão em `lib/seed.ts`.

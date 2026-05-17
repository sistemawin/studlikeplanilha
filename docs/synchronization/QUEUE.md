# Fila de Sync Pendente — Studlike Planilha

## Modelo: single-slot, not a real queue

A fila de sync pendente não é uma lista de operações — é um **marcador binário** que indica "há dados locais não sincronizados com o servidor".

Isso é adequado porque o app usa sincronização full-state: qualquer sync bem-sucedida sincroniza TODO o estado atual, não apenas as operações que estavam na fila.

---

## Interface

```typescript
// services/queue/syncQueue.ts

enqueuePendingSync(userId: string): void
  // Marca que há um sync pendente para userId.
  // Idempotente — chamar múltiplas vezes é seguro.
  // Chave localStorage: "studlike_pending_sync_v1"

hasPendingSync(userId: string): boolean
  // Retorna true se há sync pendente para userId.
  // Retorna false para userId diferente do armazenado.
  // Retorna false em caso de dados corrompidos.

clearPendingSync(): void
  // Remove o marcador após sync bem-sucedida.
  // Seguro chamar quando nada está pendente.
```

---

## Quando o marcador é criado

1. **Offline detection**: `isOnline()` = false → `enqueuePendingSync(userId)`
2. **Retry exhausted**: 3 tentativas falharam → `enqueuePendingSync(userId)`

---

## Quando o marcador é consumido

1. **Sync bem-sucedida**: `clearPendingSync()` no coordinator
2. **Logout**: `clearPersisted()` em page.tsx (estado inteiro é limpo)

---

## Como o marcador dispara uma nova sync

O `useEffect` de sync em page.tsx verifica:
```typescript
const hasPending = session && hasPendingSync(session.user.id);
if (!hasUnsyncedChanges && !hasPending) {
  setSyncStatus("idle");
  return; // sem mudanças E sem pendente → não sincroniza
}
```

E tem `isOnlineState` nas deps. Quando o usuário reconecta:
1. `isOnlineState` muda de `false` para `true`
2. `useEffect` re-dispara
3. `hasPendingSync()` = true → `setSyncStatus("pending")` → `runSync()`
4. Coordinator vê `isOnline()` = true → sincroniza com retry

---

## Garantias

| Propriedade | Garantia |
|---|---|
| Idempotência | `enqueuePendingSync` sobrescreve entrada anterior |
| Isolamento de usuário | `hasPendingSync(userId)` retorna false para outro userId |
| Resiliência a corrompimento | Retorna false em JSON inválido |
| Resiliência a quota | `try/catch` silencia falhas de localStorage |
| Sem dados órfãos | clearPersisted no logout remove todos os marcadores |

---

## Por que não uma fila real de operações?

Uma fila de operações (ex: `[{type: "addTopic", payload: ...}, ...]`) seria necessária para:
- Sincronização delta (enviar apenas o que mudou)
- Sync entre dispositivos com merge
- Operações ordenadas com timestamps

Nenhum desses casos se aplica atualmente. O modelo full-state com marcador binário é mais simples, mais testável e mais seguro para este app.

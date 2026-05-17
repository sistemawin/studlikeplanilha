# Offline-First — Studlike Planilha

## O que significa "offline-first" aqui

O app funciona sem internet. Dados são sempre persistidos localmente antes de qualquer tentativa de rede. Quando a rede está indisponível, o app continua funcionável usando dados locais. Ao reconectar, sincroniza automaticamente.

---

## Cenários cobertos

### Cenário A: Uso normal (online)

```
Login → loadRemoteState() → apply → persistLocally()
Estudar → changes → debounce → syncAppState() → saved
```
Comportamento: transparente para o usuário.

### Cenário B: App abre offline

```
Login → loadRemoteState() → FALHA
       → loadPersisted() → dados locais existem
         → apply local state + notice "Usando dados locais"
         → lastSyncedRef = "" (forçará sync quando online)
```
Comportamento: o usuário vê os dados do último sync e pode continuar estudando.

### Cenário C: Conexão cai durante uso

```
Estudou → changes → debounce → syncAppState()
         → isOnline() = false → persistLocally() + enqueuePending
         → setSyncStatus("pending")
[usuário continua estudando]
[rede volta] → isOnlineState muda true → useEffect re-dispara
             → serialized ≠ lastSyncedRef → runSync()
             → syncAppState() → online → sincroniza
```
Comportamento: dados nunca perdidos. Sync automático ao reconectar.

### Cenário D: Refresh durante offline

```
Usuário altera estado → persistLocally() → fechar aba → abrir aba
Login → loadRemoteState() → FALHA → loadPersisted() → dados locais
```
Comportamento: dados do último save local são preservados.

### Cenário E: Sync falha por rede instável (não offline total)

```
changes → syncAppState() → isOnline() = true (mas rede instável)
        → withRetry(saveRemoteState, { attempts: 3 })
          → tentativa 1 falha (timeout)
          → espera 1s
          → tentativa 2 falha (timeout)
          → espera 2s
          → tentativa 3 → sucesso
→ setSyncStatus("saved")
```
Comportamento: usuário vê "salvando" por ~3s mas dados são salvos.

---

## O que NÃO é coberto (decisões explícitas)

| Cenário | Decisão |
|---|---|
| Conflito entre abas | Last-write-wins — documentado em CONFLICTS.md |
| Offline por dias com múltiplos dispositivos | Sem merge — último sync sobrescreve |
| IndexedDB para volumes grandes | localStorage é suficiente (<1MB típico) |
| Background sync (PWA completo) | Escopo futuro |

---

## Garantias do sistema

1. **Dados locais nunca perdidos**: `persistLocally` antes de tentar rede
2. **Fallback automático**: load offline usa localStorage sem tela de erro
3. **Sync automático**: `isOnlineState` em deps do `useEffect` garante flush
4. **Retry seguro**: todas operações Supabase são idempotentes
5. **Estado consistente**: `lastSyncedRef` só atualiza em sync confirmada

# Resolução de Conflitos — Studlike Planilha

## Estratégia atual: Last Write Wins

O app usa sincronização full-state: cada sync salva o estado inteiro, não deltas. Isso significa que o último sync bem-sucedido sobrescreve todos os dados anteriores.

**Esta é uma decisão explícita**, adequada para um app de produtividade pessoal (single-user).

---

## Cenários de conflito e comportamento

### Múltiplas abas no mesmo navegador

```
Aba A: carrega estado T0
Aba B: carrega estado T0
Aba A: adiciona tópico X → estado T1 → sync → banco = T1
Aba B: adiciona tópico Y → estado T2 → sync → banco = T2
```

**Resultado**: tópico X é perdido. Banco = T2 (último write).

**Aceitável porque**: uso em múltiplas abas simultâneas é raro e o usuário controla ambas as abas. O dado "perdido" está no histórico de alterações do banco via Supabase.

**Mitigação possível no futuro**: `BroadcastChannel` para sincronizar estado entre abas do mesmo navegador antes de salvar.

### Múltiplos dispositivos

```
Celular: carrega T0, estuda offline, tem T1 local
Desktop: carrega T0, estuda, sync → banco = T2
Celular: reconecta, sync T1 → banco = T1 (sobrescreve T2)
```

**Resultado**: alterações do desktop são perdidas.

**Aceitável porque**: o app é tipicamente usado em um dispositivo por sessão de estudo. Usuários que alternam dispositivos durante a mesma sessão de estudo são um caso extremamente raro.

**Mitigação possível no futuro**: `updated_at` timestamp em cada tabela + merge heurístico baseado em timestamps.

### Edição durante sync em voo

```
Estado A → debounce → syncInFlight = true → enviando...
Usuário altera → Estado B gerado
Sync de A conclui → lastSyncedRef = serialized(A)
pendingSyncRef = true → runSync com Estado B → sync de B → OK
```

**Resultado**: nenhum dado perdido. `pendingSyncRef` garante que o estado mais recente (B) seja sincronizado imediatamente após A.

---

## O que é seguro hoje

| Situação | Status |
|---|---|
| Edições rápidas em sequência (mesmo dispositivo) | ✅ Seguro — debounce + pendingSyncRef |
| Offline e reconexão (mesmo dispositivo) | ✅ Seguro — fila + isOnlineState |
| Refresh durante uso | ✅ Seguro — localStorage fallback |
| Logout em outro dispositivo | ✅ Seguro — clearPersisted no logout |

## O que NÃO é seguro hoje

| Situação | Risco |
|---|---|
| Dois dispositivos online simultaneamente | Last write wins — possível perda |
| Duas abas editando simultaneamente | Last write wins — possível perda |

---

## Decisão de arquitetura (ADR)

Esta estratégia de "last write wins" foi escolhida porque:
1. O app é de uso pessoal — um único usuário, tipicamente um dispositivo por sessão
2. Implementação simples e previsível — sem merge complexo
3. O risco real de perda de dados é baixo dado o padrão de uso esperado
4. A complexidade de CRDT ou merge baseado em timestamps adicionaria ~5x mais código de sincronização

Qualquer mudança desta estratégia exige migração de schema e nova camada de merge.

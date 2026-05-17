# Estratégia de Retry — Studlike Planilha

## Configuração padrão

```typescript
// services/sync/coordinator.ts
const DEFAULT_RETRY: BackoffOptions = {
  maxAttempts: 3,
  baseMs: 1000,
  maxMs: 8000,
};
```

## Cálculo do atraso (backoff exponencial)

```
delayMs(attempt, baseMs=1000, maxMs=8000)
  = min(baseMs * 2^attempt, maxMs)
```

| Tentativa | Fórmula | Atraso |
|---|---|---|
| 0 (primeira) | Imediata | 0ms |
| Falha 1 → espera | 1000 × 2⁰ | 1.000ms |
| 1 | Imediata | 0ms |
| Falha 2 → espera | 1000 × 2¹ | 2.000ms |
| 2 (última) | Imediata | 0ms |
| Falha 3 → throw | — | — |

**Tempo máximo de espera** em caso de 3 falhas: ~3s (1s + 2s).

## Onde o retry é aplicado

Apenas em `syncAppState()` → `withRetry(() => saveRemoteState(...))`.

**Não é aplicado** em:
- `loadRemoteState()` — load usa fallback localStorage, não retry
- Operações admin (sugestões, lista de usuários) — erros são transientes e recuperáveis pelo usuário
- Notificações e verificações de versão — operações não-críticas

## Proteções contra loops

| Proteção | Mecanismo |
|---|---|
| Retry limitado | `maxAttempts: 3` — nunca infinito |
| Sync única em voo | `syncInFlightRef` impede calls paralelas |
| Backoff crescente | Sem spam de requests em falhas repetidas |
| Offline detection | Se offline, não tenta rede (evita `maxAttempts` desnecessários) |

## Erros não-recuperáveis

Alguns erros não se beneficiam de retry:
- `42P01` / `PGRST205` — tabela não existe (erro de schema, não de rede)
- Autenticação expirada — token inválido não melhora com retry
- Quota do Supabase excedida — retry apenas piora

O retry não distingue tipos de erro por design — a camada de simplicidade vence. Para erros estruturais, o usuário verá a mensagem de erro e precisará atualizar a página.

## Testando o retry

```bash
npm run test -- src/services/retry/backoff.test.ts
npm run test -- src/services/sync/coordinator.test.ts
```

Ver `backoff.test.ts` para testes de `delayMs` e `withRetry`.
Ver `coordinator.test.ts` para testes de retry integrado ao coordinator.

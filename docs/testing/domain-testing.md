# Estratégia de Testes — Domain Layer

## Princípio

Testar **funções puras de domínio**, não componentes React. Funções de domínio não têm side effects, não precisam de mocks complexos e rodam rápido.

## Estrutura

```
features/<nome>/domain/
├── scheduling.ts         ← lógica
└── scheduling.test.ts    ← testes (mesmo nível)
```

## Rodar testes

```bash
npm run test        # run once
npm run test:watch  # watch mode
```

## O que testar

| Tipo | Prioridade | Exemplos |
|---|---|---|
| Algoritmos de revisão espaçada | Alta | Intervalos, contagem de pendentes |
| Cálculos de desempenho | Alta | Score de tópico, média de simulados |
| Métricas de dashboard | Alta | Streak, heatmap, dias até prova |
| Distribuição de ciclo | Média | Peso de matérias no ciclo |
| Construção de objetos | Média | buildStudySession, buildReviewSchedule |

## Template de teste

```typescript
import { describe, expect, it } from "vitest";
import { funcaoDeDominio } from "./arquivo-de-dominio";

describe("funcaoDeDominio", () => {
  it("retorna valor esperado para entrada válida", () => {
    expect(funcaoDeDominio(entrada)).toBe(esperado);
  });

  it("retorna valor padrão para entrada vazia", () => {
    expect(funcaoDeDominio([])).toBe(0);
  });

  it("lida com casos extremos", () => {
    expect(funcaoDeDominio(null)).toBeNull();
  });
});
```

## Cobertura atual

| Arquivo | Testes |
|---|---|
| `revisions/domain/scheduling.ts` | 16 testes |
| `statistics/domain/performance.ts` | 12 testes |
| `dashboard/domain/metrics.ts` | 13 testes |
| `planner/domain/ciclo.ts` | 9 testes |
| `timer/domain/session.ts` | 14 testes |
| `lib/utils.ts` | 16 testes |
| `services/supabase/sync.ts` | 6 testes |
| **Total** | **86 testes de domínio** |

## O que NÃO testar aqui

- Componentes React (usar Testing Library para isso)
- Supabase (usar mocks de integração)
- Animações, CSS, layout
- Comportamento de navegação

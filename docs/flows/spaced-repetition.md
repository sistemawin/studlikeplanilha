# Fluxo — Revisão Espaçada

## Algoritmo

Quando um tópico recebe status "Questões Feitas" ou "Revisado", revisões são agendadas automaticamente.

```
updateTopicStatus(topicId, "Questões Feitas")
    │
    └── scheduleReviews(topic)
            │
            ├── Review: tipo "1",  dataAgendada = hoje + 1 dia
            ├── Review: tipo "7",  dataAgendada = hoje + 7 dias
            ├── Review: tipo "21", dataAgendada = hoje + 21 dias
            └── Review: tipo "30", dataAgendada = hoje + 30 dias
```

## Por dificuldade

Quando a dificuldade de um tópico é definida como "Difícil":
```
updateTopicDifficulty(topicId, "Difícil")
    │
    └── Review extra: tipo "dificuldade", dataAgendada = hoje + 3 dias
```

Intervalos por dificuldade:
- Difícil → 3 dias
- Médio → 7 dias
- Fácil → 14 dias

## Completar revisão

```
completeReview(reviewId)
    │
    ├── marca review.concluida = true
    └── (revisões futuras já foram criadas no scheduleReviews)
```

## Reagendar

```
rescheduleReview(reviewId, days)
    │
    └── dataAgendada = max(hoje, dataAtual) + days
```

## Código de domínio

Ver `src/features/revisions/domain/scheduling.ts` para as funções puras.

## Constantes

- Intervalos: `[1, 7, 21, 30]` dias
- Tipos: `ReviewType = "1" | "7" | "21" | "30" | "dificuldade" | "manual"`

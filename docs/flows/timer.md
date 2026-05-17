# Fluxo — Timer / Modo Foco

## Estados do timer

```
timerFocusOpen: boolean  (tela de modo foco visível)
timerRunning: boolean    (timer contando)
timerSeconds: number     (segundos acumulados)
```

## Ciclo de vida

```
1. Usuário clica "Modo Foco"
   └── openFocusTimer() ou openFocusTimerWithSubject(id) ou openFocusTimerWithTopic(id, subjId)

2. FocusTimer monta
   ├── Timer começa a correr (setInterval 1s)
   ├── Usuário seleciona matéria + tópico (selects controlados)
   └── Usuário pode Pausar / Reiniciar

3. Usuário clica "Registrar"
   └── finishSession({ topicId, reviewId })
        ├── cria StudySession com buildStudySession()
        ├── atualiza meta de horas (hourGoal)
        ├── marca tópico como estudadoEm (se topicId)
        ├── completeReview(reviewId) se for revisão
        └── fecha o timer
```

## Modos

- **Livre:** timer conta para cima indefinidamente
- **Pomodoro:** countdown de 25/45/60 min; para automaticamente ao zerar

## Seletor "O que está estudando?"

Select controlado com `effectiveSubjectId` / `effectiveTopicId`:
- Usa `sessionSubjectId` se for um ID válido nos subjects atuais
- Faz fallback para `subjects[0]` se o ID for inválido ou vazio
- Garante que o select NUNCA tem `value=""` sem `<option value="">` correspondente

## Código de domínio

Ver `src/features/timer/domain/session.ts` para as funções puras de sessão.

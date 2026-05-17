# Gerenciamento de Estado — Zustand

## Princípio

Zustand para **estado verdadeiramente compartilhado** entre partes desconectadas do app. Não é substituto do useState local.

## Quando usar Zustand vs useState

| Situação | Solução |
|---|---|
| Estado local de um componente (ex: isOpen, draft) | `useState` |
| Estado compartilhado entre componentes sem relação direta | **Zustand store** |
| Estado com lifecycle especial (setInterval, WebSocket) | **Zustand store** |
| Cálculo derivado de estado existente | `useMemo` / computação inline |

## Store atual: timer

`src/store/timer.ts` — gerencia o estado do modo foco.

**Por que timer é Zustand:**
- `setInterval` precisa de `getState()` fora do React (sem closure stale)
- Acessível de qualquer lugar sem prop drilling
- Estado persiste mesmo se o componente pai re-renderizar

### API da store

```typescript
// Ler estado (em componentes React)
const running = useTimerStore((s) => s.running);
const seconds = useTimerStore((s) => s.seconds);

// Escrever fora de render (funções, callbacks, setInterval)
useTimerStore.getState().open(subjectId, topicId);
useTimerStore.getState().increment();
useTimerStore.getState().finish();
```

### Ações disponíveis

| Ação | Efeito |
|---|---|
| `open(subjectId?, topicId?)` | Abre foco view + inicia timer + define defaults |
| `closeView()` | Fecha overlay, timer continua |
| `finish()` | Fecha overlay + para timer (após registrar sessão) |
| `reset()` | Para timer + zera segundos |
| `setRunning(bool)` | Pause/play direto |
| `increment()` | +1 segundo (chamado pelo setInterval) |
| `setSeconds(n)` | Define segundos diretamente |

## Padrão para criar nova store

```typescript
// src/store/nome-da-feature.ts
import { create } from "zustand";

type NomeState = {
  // estado (primitivos e objetos simples)
};

type NomeActions = {
  // ações (funções sem lógica de negócio complexa)
};

export const useNomeStore = create<NomeState & NomeActions>((set, get) => ({
  // estado inicial
  // ações que chamam set() ou get()
}));
```

## Regras obrigatórias de store

- **Sem lógica de negócio complexa nas stores** — chamar funções de `domain/`
- **Sem estados derivados** — computar inline no componente
- **Sem fetch Supabase** — apenas estado UI/timer/otimista
- **Sem imports de React** — stores são JS puro
- **Seletores granulares** — `useStore((s) => s.campo)` previne re-renders desnecessários

## Leitura em event handlers (não em render)

```typescript
// CORRETO — usar getState() fora do ciclo de render
function handleClick() {
  const { seconds } = useTimerStore.getState();
  console.log(seconds);
}

// ERRADO — não usar o hook fora de componentes React
function handleClick() {
  const seconds = useTimerStore((s) => s.seconds); // erro! hooks só em componentes
}
```

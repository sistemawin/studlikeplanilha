# Como criar um hook

## Template

```typescript
// src/hooks/useNomeHook.ts  (se global)
// src/features/<feature>/hooks/useNomeHook.ts  (se específico de feature)

import { useEffect, useState } from "react";

type UseNomeHookOptions = {
  // opções do hook
};

type UseNomeHookReturn = {
  // o que o hook retorna
};

export function useNomeHook(options: UseNomeHookOptions): UseNomeHookReturn {
  // implementação
}
```

## Regras

- **Hooks globais** (usados em múltiplas features) ficam em `src/hooks/`
- **Hooks de feature** ficam em `src/features/<nome>/hooks/`
- **Nome obrigatório com prefixo `use`**
- **Sem lógica de UI** — hooks são só lógica
- **Evitar `useEffect` para dados derivados** — computar inline quando possível
- **Retornar objetos nomeados** (não tuplas) para facilitar uso e type safety

## Hooks disponíveis

| Hook | Localização | Uso |
|---|---|---|
| `useScrollLock` | `src/hooks/` | Travar scroll do body em modais |
| `useDebounce` | `src/hooks/` | Debounce de valores que mudam frequentemente |

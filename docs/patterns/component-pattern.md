# Como criar um componente

## Template mínimo

```typescript
// src/features/<feature>/components/NomeComponente.tsx
"use client"; // APENAS se usar hooks, eventos, ou estado local

import type { Tipo } from "@/types";

type Props = {
  // Tipar explicitamente todas as props
  dado: Tipo;
  onChange: (valor: string) => void;
  isLoading?: boolean;
};

export function NomeComponente({ dado, onChange, isLoading = false }: Props) {
  return (
    <div className="...">
      {/* Mobile-first: começar sem breakpoint, adaptar com sm:, md:, xl: */}
    </div>
  );
}
```

## Regras

- **Sem lógica de negócio** — chamar funções do `domain/`, não reinventar
- **Sem fetch/Supabase** — dados vêm via props
- **Sem `useEffect` para sincronizar estado com props** — derivar inline
- **`"use client"` só quando necessário** — hooks, eventos, estado local
- **Sempre tipar Props explicitamente**
- **Exportar como named export** (não default)
- **Mobile-first**: `className="p-4 sm:p-5 md:p-6"`

## Estados obrigatórios

Qualquer componente com dados deve tratar:
- **Loading:** `Loader2` animado (lucide)
- **Vazio:** texto explicativo em `text-slate-500`
- **Erro:** não capturar — deixar para `ErrorBoundary` pai

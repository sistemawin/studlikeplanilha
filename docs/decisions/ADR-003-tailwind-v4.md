# ADR-003 — Tailwind CSS v4 com CSS Cascade Layers

**Status:** Aceito  
**Data:** 2025

## Contexto

Tailwind v4 usa `@import "tailwindcss"` e CSS Cascade Layers (`@layer utilities`).

## Decisão

Usar Tailwind v4. Todos os resets de form em `globals.css` devem estar dentro de `@layer base`.

## Justificativa

- Utilities do Tailwind ficam em `@layer utilities`
- CSS fora de qualquer `@layer` tem PRIORIDADE sobre qualquer camada
- Se `globals.css` tiver `select { background-color: white }` fora de `@layer`, isso anula `bg-white/10` de qualquer select → texto invisível

## Regra

```css
/* ERRADO — esmaga utilities do Tailwind */
input, select { background-color: #fff; }

/* CORRETO — pode ser sobrescrito por utilities */
@layer base {
  input, select { background-color: #fff; }
}
```

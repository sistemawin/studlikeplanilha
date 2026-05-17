# Quality Checks — Studlike Planilha

Este documento descreve cada verificação do pipeline de qualidade, quando rodar, como interpretar erros e como corrigir falhas.

---

## Comando único

```bash
npm run check
```

Executa **todos os checks em sequência** e para no primeiro erro:

1. `typecheck` — TypeScript sem erros
2. `lint` — ESLint sem violações
3. `test` — Todos os testes passando
4. `check:forbidden-files` — Sem arquivos proibidos
5. `check:duplicates` — Sem componentes com nomes duplicados
6. `check:architecture` — Sem violações arquiteturais
7. `check:domain` — Todos os arquivos domain/ têm teste
8. `build` — Build de produção sem erros

Se qualquer etapa falhar, as seguintes não rodam. Corrija a falha apontada e rode novamente.

---

## Scripts individuais

### `npm run typecheck`

**O que faz:** Roda `tsc --noEmit` — verifica tipagem TypeScript sem gerar arquivos.

**Quando rodar:** Após qualquer mudança em `.ts` ou `.tsx`.

**Como interpretar:**
```
src/features/X/domain/Y.ts(10,5): error TS2345: ...
```
→ Linha 10, coluna 5 do arquivo indicado tem erro de tipo.

**Correção:** Corrija o tipo conforme o erro. Nunca use `as any` como atalho.

---

### `npm run lint`

**O que faz:** Roda ESLint com as regras definidas em `eslint.config.mjs`.

**Quando rodar:** Antes de qualquer commit.

**Como interpretar:**
```
src/X.tsx
  10:5  error  'foo' is defined but never used  no-unused-vars
```
→ Variável não usada na linha 10. Remova ou use.

**Correção:** Siga a regra indicada. Nunca desabilite regras sem justificativa real.

---

### `npm run test`

**O que faz:** Roda todos os testes com Vitest (`vitest run`).

**Quando rodar:** Antes de qualquer commit que altere `domain/` ou `lib/`.

**Como interpretar:**
```
FAIL src/features/revisions/domain/scheduling.test.ts
  ✗ calcula intervalo para Difícil
    AssertionError: expected 3 to equal 7
```
→ O teste `calcula intervalo para Difícil` falhou. O valor esperado era 7, veio 3.

**Correção:** Verifique se a lógica de negócio mudou. Se sim, atualize o teste correspondente (nunca delete testes para "passar").

---

### `npm run check:forbidden-files`

**O que faz:** Varre `src/` buscando arquivos com nomes problemáticos.

**Padrões bloqueados:**
| Padrão | Exemplo proibido |
|---|---|
| Espaço + número | `Component 2.tsx` |
| "copy" ou "copia" no nome | `ButtonCopy.tsx` |
| "backup" no nome | `page-backup.ts` |
| Sufixo `-old` ou `_old` | `utils_old.ts` |
| Sufixo `-new` ou `_new` | `Dashboard-new.tsx` |

**Correção:** Renomeie o arquivo para algo semântico. Use git para histórico — não crie arquivos de backup.

---

### `npm run check:duplicates`

**O que faz:** Verifica se dois arquivos `.tsx` têm o mesmo nome de arquivo (basename) em lugares diferentes dentro de `src/`.

**Por que importa:** Nomes duplicados confundem imports automáticos, ferramentas e outros devs.

**Como interpretar:**
```
❌ Nomes de componente duplicados encontrados:
Button.tsx

Caminhos completos:
src/components/ui/Button.tsx
src/features/subjects/components/Button.tsx
```

**Correção:** Renomeie um dos componentes para algo mais específico (ex: `SubjectButton.tsx`).

---

### `npm run check:architecture`

**O que faz:** Verifica três regras arquiteturais:

#### Regra 1 — Sem import runtime de Supabase fora de `services/`

`import type { ... }` é permitido (TypeScript apaga em runtime).
`import { createClient }` ou qualquer import que cria código runtime **é bloqueado** fora de `src/services/supabase/`.

**Correção:** Mova a lógica de acesso ao Supabase para `src/services/supabase/sync.ts`.

#### Regra 2 — Sem `console.log` em código não-teste

**Correção:** Remova os logs. Use `notice` do app para mensagens ao usuário.

#### Regra 3 — Sem imports relativos profundos (`../../../`)

**Correção:** Use o alias `@/` configurado no `tsconfig.json`:
```ts
// ❌ Errado
import { foo } from "../../../lib/utils";

// ✅ Correto
import { foo } from "@/lib/utils";
```

**Aviso (não bloqueia):** Possível código comentado — revisar manualmente.

---

### `npm run check:domain`

**O que faz:** Para cada arquivo `src/features/*/domain/*.ts` (exceto `.test.ts`), verifica se existe um `*.test.ts` correspondente.

**Por que importa:** Toda função de domínio deve ser testável e testada. Domínio sem teste é lógica de negócio não verificada.

**Como interpretar:**
```
❌ Teste ausente: src/features/planner/domain/ciclo.test.ts
   → Arquivo de domínio sem teste: src/features/planner/domain/ciclo.ts
```

**Correção:** Crie o arquivo de teste correspondente ao lado do domain. Ver `docs/testing/domain-testing.md` para o padrão.

---

### `npm run build`

**O que faz:** Roda `next build` — build de produção completo.

**Quando rodar:** Antes de qualquer deploy ou PR.

**Como interpretar:** Qualquer erro TypeScript ou de compilação Next.js aparece aqui. Erros de build impedem deploy.

**Correção:** Siga os erros apontados. O build é a validação final — se passou em todos os outros checks mas falhou no build, há algo específico do Next.js (ex: uso de API de browser em Server Component).

---

## Regras bloqueadas vs. avisos

| Check | Comportamento ao falhar |
|---|---|
| typecheck | ❌ Para o pipeline |
| lint | ❌ Para o pipeline |
| test | ❌ Para o pipeline |
| check:forbidden-files | ❌ Para o pipeline |
| check:duplicates | ❌ Para o pipeline |
| check:architecture (regras 1-3) | ❌ Para o pipeline |
| check:architecture (código comentado) | ⚠️ Aviso apenas |
| check:domain | ❌ Para o pipeline |
| build | ❌ Para o pipeline |

---

## Quando rodar

| Situação | Comando recomendado |
|---|---|
| Antes de qualquer commit | `npm run check` |
| Após mudar domain/ | `npm run test && npm run check:domain` |
| Após refatorar imports | `npm run typecheck && npm run check:architecture` |
| Após criar componente | `npm run check:duplicates` |
| Após mover arquivo | `npm run typecheck` |
| Antes de PR | `npm run check` (completo) |

---

## Pre-commit manual (sem Husky)

Para garantir que nenhum commit quebrado seja feito, adicione ao seu fluxo:

```bash
# Antes de git commit:
npm run check

# Se passar, commite:
git add <files>
git commit -m "..."
```

### Por que não usamos Husky

Husky adiciona overhead de instalação e pode falhar em ambientes CI/CD ou quando outros devs clonam o repo sem configurar os hooks. O projeto não tem equipe grande o suficiente para justificar a complexidade extra. O `npm run check` manual é suficiente e mais transparente.

---

## Adicionando novos checks

Para adicionar uma nova verificação:

1. Crie `scripts/check-<nome>.sh`
2. Adicione ao `package.json`: `"check:<nome>": "bash scripts/check-<nome>.sh"`
3. Adicione ao comando `check` no `package.json` (antes do `build`)
4. Documente aqui em `CHECKS.md`
5. Adicione regra ao `AI_RULES.md`

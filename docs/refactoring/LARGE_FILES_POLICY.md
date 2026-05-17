# Política de Tamanho de Arquivos — Studlike Planilha

## Limites

| Limite | Linhas | Ação |
|---|---|---|
| Ideal | ≤ 300 | Sem ação |
| Aceitável | 301–500 | Sem ação |
| Aviso | 501–800 | ⚠️ Aviso no check:architecture |
| Crítico | 801–1100 | ⚠️⚠️ Aviso forte no check:architecture |
| Bloqueado | > 1100 | ❌ Falha no check:architecture (exceto allowlist) |

## Allowlist atual

Arquivos na allowlist são excluídos da verificação de bloqueio (> 1100 linhas). Cada entrada deve ter uma justificativa e uma data de revisão.

```
src/app/page.tsx
  Justificativa: Orchestrador central do app. Sendo reduzido gradualmente.
  Meta: < 1800 linhas até Q3 2026.
  Revisão: 2026-09-01
```

## Regras para adicionar à allowlist

1. O arquivo deve ser auditado em LARGE_FILES_AUDIT.md
2. A justificativa deve ser clara (orchestrador, componente composto inevitável, etc.)
3. Deve haver uma meta de linhas e data de revisão
4. O time (ou IA) deve revisar na data indicada e atualizar a lista

## Como reduzir arquivos grandes

### Para componentes de UI (Exams.tsx, Dashboard.tsx, Edital.tsx)

1. Identificar seções independentes (têm props próprias, estado local separável)
2. Extrair para subcomponentes em subdirectório (ex: `Exams/GoalsSection.tsx`)
3. O componente principal vira compose das subseções
4. Props continuam fluindo do parent original
5. Sem Zustand — props e callbacks continuam sendo a interface

### Para hooks de orquestração (page.tsx)

1. Identificar grupos de estado + funções com fronteira clara (auth, admin, etc.)
2. Criar hook customizado (`hooks/use<Domain>.ts`)
3. Passar dependências como parâmetros (callbacks, refs)
4. O hook retorna todo o estado e funções necessários
5. Não criar hook sem estado compartilhado real

### Não fazer

- Não criar abstração prematura (3 linhas não precisam virar hook)
- Não criar componentes "wrapper" que só adicionam boilerplate
- Não mover arquivos sem atualizar todos os imports
- Não criar stores Zustand para estado que não é compartilhado

## Verificação automática

O script `scripts/check-architecture.sh` verifica os limites automaticamente.

Para adicionar um arquivo à allowlist, edite a lista `ALLOWLIST` no script e documente aqui.

Execute manualmente:
```bash
npm run check:architecture
```

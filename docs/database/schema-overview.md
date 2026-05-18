# Visão geral do schema

Este documento registra as áreas principais do schema Supabase usadas pelo app.

## Dados do usuário

O estado de estudo do usuário é persistido em tabelas relacionais:

| Tabela | Responsabilidade |
|---|---|
| `materias` | Matérias do usuário |
| `topicos` | Tópicos vinculados a matérias |
| `revisoes` | Revisões agendadas por tópico |
| `cronograma` | Configuração JSONB do planejamento |
| `metas` | Metas diárias |
| `simulados` | Resultados de simulados |
| `questoes` | Registros de questões por tópico |
| `sessoes_estudo` | Histórico de sessões de estudo |
| `sugestoes` | Sugestões enviadas por usuários |
| `app_admins` | Usuários administradores |

O frontend carrega e salva essas tabelas por `services/supabase/sync.ts`.

## Catálogo oficial de editais

O catálogo oficial usa tabelas próprias, separadas dos dados do usuário:

```text
editais_prontos
  └── editais_prontos_materias
        └── editais_prontos_topicos
```

### `editais_prontos`

Metadados do edital publicado:

- `id`
- `titulo`
- `subtitulo`
- `banca`
- `cargo`
- `ano`
- `fonte`
- `source_url`
- `categoria`
- `badges`
- `popularidade`
- `nivel`
- `atualizado_em`
- `destaque`
- `publicado`

### `editais_prontos_materias`

Matérias oficiais do edital:

- `id`
- `edital_id`
- `nome`
- `peso`
- `cor`
- `dificuldade_padrao`
- `ordem`

### `editais_prontos_topicos`

Tópicos oficiais por matéria:

- `id`
- `materia_id`
- `titulo`
- `dificuldade`
- `ordem`

## RPCs

### `import_ready_edital(p_edital_id text)`

Importa um edital oficial para o usuário autenticado.

Responsabilidades:

- Usa `auth.uid()` internamente.
- Lê matérias/tópicos oficiais do catálogo.
- Cria novas linhas em `materias` e `topicos`.
- Acrescenta as novas matérias em `cronograma.configuracao.ciclos`.
- Preserva `cronograma.configuracao.provas`.
- Retorna contagem de matérias e tópicos importados.

O cliente não deve inserir matérias/tópicos oficiais manualmente quando a origem é o catálogo oficial. Use a RPC.

## Fonte de verdade

- Catálogo oficial: Supabase.
- Estado pessoal de estudo: tabelas relacionais do usuário + backup local.
- `src/lib/readyEditals.ts`: apenas tipos; não é fonte de catálogo.

# Catálogo oficial de editais

## Contexto

O catálogo oficial de editais do StudLike Foco deixou de ser um array local em TypeScript e passou a usar o Supabase como fonte única de verdade.

Antes, o fluxo real era:

```text
src/lib/readyEditals.ts
  ↓
ReadyEditalsPanel
  ↓
importReadyEdital client-side
  ↓
setSubjects / setTopics / setSchedule
  ↓
sync full-state
```

Esse modelo era simples, mas criava duplicação entre código e SQL, exigia deploy para publicar novo edital e permitia inconsistência entre o catálogo exibido e o que existia no banco.

## Decisão arquitetural

O catálogo oficial agora vive no Supabase:

```text
Supabase
  editais_prontos
  editais_prontos_materias
  editais_prontos_topicos
    ↓
src/services/supabase/readyEditals.ts
    ↓
src/hooks/useReadyEditals.ts
    ↓
ReadyEditalsPanel
    ↓
EditalCard / EditalFeaturedCard
```

A substituição do edital ativo usa RPC:

```text
Usuário clica em "Adicionar ao plano"
  ↓
Modal "Substituir edital atual?"
  ↓
page.tsx confirmReplaceReadyEdital()
  ↓
services/supabase/readyEditals.ts
  replaceOfficialReadyEdital()
  ↓
Supabase RPC replace_ready_edital(p_edital_id)
  ↓
limpeza do edital atual + materias + topicos + cronograma
  ↓
loadRemoteState()
  ↓
applyAppState() + persistLocally()
```

## Responsabilidades

| Camada | Responsabilidade |
|---|---|
| `supabase/ready_editals_baturite.sql` | Schema, seed, RLS e RPC de substituição do catálogo oficial |
| `src/services/supabase/readyEditals.ts` | Queries, RPC e mapper Supabase → `ReadyEdital` |
| `src/hooks/useReadyEditals.ts` | Estado de carregamento/erro/retry do catálogo |
| `ReadyEditalsPanel` | Busca local, filtros, agrupamento visual e renderização |
| `EditalCard` / `EditalFeaturedCard` | Exibir edital e disparar callback de importação |
| `page.tsx` | Confirmar substituição, recarregar estado remoto e persistir localmente |
| `src/lib/readyEditals.ts` | Apenas contratos TypeScript; não contém dados oficiais |

## Schema do catálogo

```text
editais_prontos
  id text primary key
  titulo, subtitulo, banca, cargo, ano
  fonte, source_url
  categoria, badges, popularidade, nivel
  atualizado_em, destaque, publicado

editais_prontos_materias
  id text primary key
  edital_id → editais_prontos.id
  nome, peso, cor, dificuldade_padrao, ordem

editais_prontos_topicos
  id text primary key
  materia_id → editais_prontos_materias.id
  titulo, dificuldade, ordem
```

Somente editais com `publicado = true` devem aparecer no catálogo.

## Substituição por RPC

A RPC `replace_ready_edital(p_edital_id text)` é a única entrada oficial para trocar o edital ativo.

Motivos:

- Usa `auth.uid()` internamente.
- O cliente não envia `user_id`.
- Remove o edital atual do usuário antes de importar o novo.
- Cria matérias e tópicos dentro do banco.
- Gera IDs novos.
- Mantém apenas um edital ativo por usuário.
- Recria o ciclo do cronograma com as novas matérias.
- Reduz risco de estado parcial ou mistura de editais no cliente.

Depois da RPC, o frontend chama `loadRemoteState()` e reaplica todo o estado do usuário. Isso mantém a UI consistente com o banco e evita duplicar lógica de criação de matérias/tópicos no cliente.

## Regra de produto

O StudLike Foco mantém apenas um edital ativo por usuário.

Ao escolher outro edital oficial, o app abre uma confirmação explícita antes da troca. A RPC remove matérias, tópicos, revisões, questões e sessões de estudo vinculadas ao edital anterior, reseta o progresso diário das metas e recria o cronograma para o novo edital. Configurações independentes, como o objetivo das metas e simulados registrados, são preservadas.

## Sync após importação

A substituição oficial não depende do debounce normal de sync para gravar os dados principais, porque a RPC já grava no Supabase.

Depois da RPC:

1. `loadRemoteState(supabase, userId)` recarrega o estado canônico.
2. `applyAppState()` atualiza React.
3. `persistLocally()` atualiza o backup offline.
4. `lastSyncedStateRef` recebe o estado serializado.

Isso evita que o próximo sync tente sobrescrever imediatamente o resultado recém-substituído.

## Fallback e offline

O catálogo oficial remoto não usa fallback local com editais duplicados.

Se a listagem falhar:

- `ReadyEditalsPanel` mostra erro.
- O usuário pode tentar novamente.
- O app não inventa catálogo local.
- Dados já importados continuam disponíveis pelo fluxo offline-first do `AppState`.

Estratégia futura: cache local separado do catálogo oficial, com metadados de versão e sem duplicar fonte de verdade.

## Como adicionar novo edital oficial

1. Inserir linha em `editais_prontos`.
2. Inserir matérias em `editais_prontos_materias`.
3. Inserir tópicos em `editais_prontos_topicos`.
4. Marcar `publicado = true`.
5. Validar listagem no app.
6. Validar substituição por RPC.

Não adicionar editais oficiais em TypeScript.

## Riscos conhecidos

- A UI depende de colunas visuais existirem no Supabase (`categoria`, `badges`, `popularidade`, etc.).
- O hook não mantém cache offline do catálogo remoto.
- A substituição apaga o edital anterior por design; ações de undo exigiriam histórico/versionamento futuro.
- O painel admin de catálogo ainda não existe.

## Próximos passos

- Criar painel admin para publicar/despublicar editais.
- Adicionar cache versionado do catálogo oficial para leitura offline.
- Criar testes de mapper e service.
- Criar histórico de trocas de edital, se o produto precisar de auditoria ou desfazer.
- Evoluir o RPC para retornar IDs criados, se a UI precisar de navegação pós-importação mais precisa.

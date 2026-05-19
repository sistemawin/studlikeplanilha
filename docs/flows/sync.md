# Fluxo — Sincronização de dados

## Estratégia

O app usa sincronização full-state com debounce para os dados pessoais de estudo.

```text
1. Mutação local em React state
2. useEffect[AppState] detecta mudança
3. debounce 700ms
4. serializeAppState(state)
5. compara com lastSyncedStateRef
6. syncAppState()
7. saveRemoteState()
8. upserts/deletes nas tabelas relacionais
```

Tabelas sincronizadas:

- `materias`
- `topicos`
- `revisoes`
- `cronograma`
- `metas`
- `simulados`
- `questoes`
- `sessoes_estudo`

## Controle de duplicação

`lastSyncedStateRef` guarda a última string sincronizada.

Se `serialized === lastSyncedStateRef.current`, não há sync.

## Estados de sync

```text
idle     sem pendência
pending  aguardando debounce, offline ou fila pendente
saving   operação em voo
saved    sync concluída
error    sync falhou
```

## Carregamento inicial

```text
loadRemoteState(userId)
  ↓
SELECT materias/topicos/revisoes/...
  ↓
map rows → AppState
  ↓
applyAppState()
  ↓
persistLocally()
```

Se o remoto falhar, o app tenta `loadPersisted(userId)`.

## Substituição de edital oficial

Substituição de edital oficial não usa o fluxo client-side antigo de criar matérias/tópicos no React.

Fluxo atual:

```text
ReadyEditalsPanel
  ↓
page.tsx abre confirmação
  ↓
confirmReplaceReadyEdital()
  ↓
replaceOfficialReadyEdital(supabase, edital.id)
  ↓
rpc replace_ready_edital(p_edital_id)
  ↓
loadRemoteState()
  ↓
applyAppState()
  ↓
persistLocally()
  ↓
lastSyncedStateRef = serializeAppState(remote)
```

Esse caminho evita inconsistência: o banco remove o edital atual, importa o novo edital de forma atômica para o usuário autenticado e o frontend recarrega o estado canônico.

## Offline

O backup offline continua sendo o `AppState` salvo em localStorage.

O catálogo oficial remoto não é duplicado em TypeScript. Se o catálogo falhar, a UI mostra erro e permite tentar novamente.

Dados já importados continuam disponíveis offline porque passam a fazer parte de `materias` e `topicos`.

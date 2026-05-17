# TODO — Studlike Planilha

## Bugs conhecidos

- [ ] `useScrollLock` em `ArchiveEditalModal` e `SubjectModal` ainda usa o hook (agora corrigido) — verificar se algum modal restante usa `position: fixed` no body diretamente
- [ ] `page.tsx` tem 2.349 linhas — toda lógica de negócio está centralizada, dificulta manutenção
- [ ] Sem tratamento de conflito de sync (dois dispositivos editando ao mesmo tempo)
- [ ] Sem feedback visual durante carregamento inicial (skeleton / loading state)

## Refatorações pendentes

- [ ] Extrair lógica de revisões de `page.tsx` para `features/revisions/actions.ts`
- [ ] Extrair lógica de sessões/timer de `page.tsx` para `features/timer/actions.ts`
- [ ] Extrair lógica de subjects/topics de `page.tsx` para `features/subjects/actions.ts`
- [ ] Criar `features/*/queries.ts` com queries Supabase por feature (quando migrar de document store)
- [ ] Criar `src/constants/` com constantes globais extraídas do código
- [ ] Separar `types/index.ts` em múltiplos arquivos por domínio conforme crescer

## Melhorias futuras

- [ ] Migrar de document store (JSONB único) para tabelas relacionais no Supabase (melhor performance e query flexível)
- [ ] Adicionar sincronização em tempo real (Supabase Realtime) para multi-device
- [ ] Implementar modo offline completo com service worker + sync queue
- [ ] Adicionar testes E2E (Playwright)
- [ ] Expandir cobertura de testes unitários para funções de negócio
- [ ] Implementar exportação de dados completa (PDF do edital, CSV do histórico)
- [ ] Adicionar gráfico de progresso temporal (heatmap de horas ao longo dos meses)
- [ ] Implementar notificações push (Web Push API) para revisões pendentes
- [ ] Adicionar compartilhamento de editais entre usuários
- [ ] Dark mode

## Otimizações de performance

- [ ] Virtualizar listas longas de tópicos no Edital (react-virtual ou similar)
- [ ] Memoizar cálculos derivados pesados em `page.tsx` (já tem alguns `useMemo`, mas outros inline)
- [ ] Paginar histórico de sessões (atualmente carrega tudo)
- [ ] Lazy load das sections pesadas (Dashboard com heatmap, Exams com gráficos)
- [ ] Otimizar re-renders do timer (timerSeconds muda a cada segundo — verificar o que re-renderiza desnecessariamente)

## Dívida técnica

- [ ] `page.tsx` com 2.349 linhas precisa ser dividido (maior risco de manutenção)
- [ ] Sem validação de entrada de dados do usuário (títulos, nomes de matérias)
- [ ] Sem rate limiting no sync (pode gerar muitas requests em sessões longas)
- [ ] Strings hardcoded em português espalhadas — sem internacionalização (i18n)

## Prioridade imediata

1. Corrigir bugs antes de adicionar features
2. Escrever testes para funções de negócio críticas (cálculo de revisões, streak)
3. Extrair lógica de `page.tsx` gradualmente para features
4. Adicionar loading state na inicialização do app

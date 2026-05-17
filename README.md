# Studlike Planilha

Aplicativo web de planejamento de estudos para concurseiros e vestibulandos. Organiza o edital verticalizado, controla revisões espaçadas, acompanha horas estudadas, metas diárias e desempenho em simulados — sincronizado com Supabase em tempo real.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19 + Tailwind CSS v4 |
| Banco | Supabase (PostgreSQL + Auth) |
| Animações | Framer Motion |
| Ícones | lucide-react |
| Linguagem | TypeScript (strict) |
| Testes | Vitest |
| PWA | next-pwa + Service Worker |

---

## Como rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.local.example .env.local
# preencher NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Rodar em desenvolvimento
npm run dev

# 4. Acessar
http://localhost:3000
```

---

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servir build de produção |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (testes unitários) |

---

## Estrutura de pastas

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Orquestrador: estado global, sync, navegação
│   ├── globals.css               # Estilos globais + variáveis CSS
│   └── api/app-version/          # Endpoint de versão para SW update
│
├── features/                     # Módulos por domínio de negócio
│   ├── auth/components/          # Login, cadastro, recuperação de senha
│   ├── dashboard/components/     # Tela inicial: métricas, streak, plano do dia
│   ├── subjects/components/      # Edital verticalizado + modais de matéria
│   ├── revisions/components/     # Revisões espaçadas + modo foco de revisão
│   ├── planner/components/       # Cronograma semanal / ciclo de estudos
│   ├── statistics/components/    # Simulados, questões, gráficos de desempenho
│   ├── timer/components/         # Modo foco (timer), histórico de sessões
│   └── admin/components/         # Painel admin, sugestões de usuários
│
├── components/                   # Componentes reutilizáveis globais
│   ├── ui/                       # NavButton, ConfirmDialog, ProgressBar, Logo
│   ├── shared/                   # ErrorBoundary, GlobalSearch, AppFeedbackToast
│   └── charts/                   # PieChart
│
├── services/supabase/            # Acesso ao banco e sincronização
│   ├── client.ts                 # Instâncias do Supabase (browser + verifier)
│   └── sync.ts                   # Serialização e sincronização de estado
│
├── hooks/                        # React hooks globais
│   └── useScrollLock.ts
│
├── lib/                          # Utilitários, seeds e dados estáticos
│   ├── utils.ts                  # Funções puras (formatTimer, isoDate, pct…)
│   ├── seed.ts                   # Valores padrão (metas, cronograma inicial)
│   └── readyEditals.ts           # Editais prontos para importar
│
├── types/                        # Tipos TypeScript globais
│   └── index.ts
│
└── constants/                    # Constantes globais (a popular conforme cresce)
```

---

## Convenções

- **Imports sempre via alias `@/`** — nunca caminhos relativos entre features
- **Componentes em PascalCase**, arquivos em PascalCase
- **Hooks em camelCase** com prefixo `use`
- **Tipos sem prefixo `I` ou `T`** — ex: `Subject`, não `ISubject`
- **Estado global centralizado em `app/page.tsx`** — features recebem dados via props
- **Acesso ao banco apenas em `services/supabase/`** — nunca dentro de componentes visuais
- **Mobile-first obrigatório** em todos os componentes

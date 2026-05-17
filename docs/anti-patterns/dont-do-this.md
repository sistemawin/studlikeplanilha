# Anti-patterns — O que NÃO fazer

## React e state

### ❌ useEffect para sincronizar estado com props

```typescript
// ERRADO: dispara em todo render com deps instáveis (arrays, objetos)
useEffect(() => {
  if (!sessionTopicId && sessionTopics.length > 0) {
    setSessionTopicId(sessionTopics[0].id);
  }
}, [sessionTopics, sessionTopicId]); // sessionTopics = novo array toda vez!

// CORRETO: derivar inline, sem efeito
const effectiveTopicId =
  (sessionTopics.some((t) => t.id === sessionTopicId) ? sessionTopicId : sessionTopics[0]?.id) ?? "";
```

### ❌ useState para valores derivados

```typescript
// ERRADO
const [pendingCount, setPendingCount] = useState(0);
useEffect(() => {
  setPendingCount(reviews.filter(r => !r.concluida && r.dataAgendada <= today).length);
}, [reviews]);

// CORRETO
const pendingCount = reviews.filter(r => !r.concluida && r.dataAgendada <= today).length;
```

### ❌ position: fixed no body para scroll lock

```typescript
// ERRADO — quebra position:fixed filhos no iOS Safari
document.body.style.position = "fixed";
document.body.style.top = `-${scrollY}px`;

// CORRETO — overflow only
document.documentElement.style.overflow = "hidden";
document.body.style.overflow = "hidden";
```

---

## CSS / Tailwind

### ❌ Resets de form fora de @layer

```css
/* ERRADO — sobrescreve utilities do Tailwind v4 */
select {
  background-color: #ffffff;
}

/* CORRETO — pode ser sobrescrito por utilities */
@layer base {
  select {
    background-color: #ffffff;
  }
}
```

### ❌ Select controlado com value="" sem option correspondente

```tsx
// ERRADO — iOS não dispara onChange quando seleciona a primeira opção
<select value="">
  <option value="abc">Matéria</option>
</select>

// CORRETO — garantir que value sempre tem uma option correspondente
const effectiveId = subjects.some(s => s.id === id) ? id : subjects[0]?.id ?? "";
<select value={effectiveId}>
  {subjects.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
</select>
```

---

## Arquitetura

### ❌ Acesso direto ao Supabase em componentes

```typescript
// ERRADO — lógica de banco dentro de componente visual
function Reviews() {
  const { data } = useQuery(() => supabase.from("reviews").select("*"));
  return <div>{data?.map(...)}</div>;
}

// CORRETO — dados chegam via props de page.tsx
function Reviews({ reviews, onComplete }) {
  return <div>{reviews.map(...)}</div>;
}
```

### ❌ Lógica de negócio em componente

```typescript
// ERRADO — algoritmo de revisão espaçada dentro do componente
function Reviews({ topics }) {
  function scheduleNext(topicId: string) {
    const intervals = [1, 7, 21, 30];
    return intervals.map(days => ({ topicId, date: addDays(new Date(), days) }));
  }
  // ...
}

// CORRETO — usar domain function
import { buildInitialReviewSchedule } from "@/features/revisions/domain/scheduling";
```

### ❌ Criar arquivos duplicados

```
// NUNCA criar
Dashboard 2.tsx
sync_backup.ts
utils-copy.ts
page-new.tsx
```

### ❌ Imports relativos entre features

```typescript
// ERRADO
import { Reviews } from "../../../features/revisions/components/Reviews";

// CORRETO
import { Reviews } from "@/features/revisions/components/Reviews";
```

### ❌ Componentes gigantes com múltiplas responsabilidades

```
// SINAL DE ALERTA: componente > 400 linhas
// Solução: extrair sub-componentes, mover lógica para domain/
```

---

## Performance

### ❌ Arrays/objetos inline em props de componentes memoizados

```typescript
// ERRADO — recria objeto a cada render, invalida memo
<Component options={{ foo: "bar" }} />

// CORRETO — constante fora do componente ou useMemo
const OPTIONS = { foo: "bar" };
<Component options={OPTIONS} />
```

### ❌ Cálculos pesados sem memoização

```typescript
// ERRADO — recalcula em todo render (incluindo timer tick 1x/segundo)
const topicById = topics.reduce((acc, t) => ({ ...acc, [t.id]: t }), {});

// CORRETO
const topicById = useMemo(() => {
  return topics.reduce<Record<string, Topic>>((acc, t) => { acc[t.id] = t; return acc; }, {});
}, [topics]);
```

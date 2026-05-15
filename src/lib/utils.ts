import type { ChartSlice, Difficulty, SubjectAccent, TopicStatus } from "@/types";

export function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return isoDate(next);
}

export function pct(value: number, total: number) {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

export function statusTone(status: TopicStatus) {
  if (status === "Revisado") return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  if (status === "Questões Feitas") return "bg-blue-100 text-blue-800 ring-blue-200";
  if (status === "Teoria Lida") return "bg-amber-100 text-amber-800 ring-amber-200";
  return "bg-rose-100 text-rose-800 ring-rose-200";
}

const ACCENT_FALLBACK: SubjectAccent = {
  dot: "bg-slate-500",
  card: "bg-slate-50",
  border: "border-slate-200",
  chip: "bg-slate-100 text-slate-800",
  progress: "bg-blue-500",
  text: "text-slate-800",
  chart: "#64748b",
};

// Maps subject `cor` field (Tailwind bg class) to full accent palette.
// This fixes the bug where UUIDs from Supabase always fell through to the slate fallback.
const COR_TO_ACCENT: Record<string, SubjectAccent> = {
  "bg-emerald-500": {
    dot: "bg-emerald-500",
    card: "bg-emerald-50",
    border: "border-emerald-200",
    chip: "bg-emerald-100 text-emerald-800",
    progress: "bg-emerald-500",
    text: "text-emerald-800",
    chart: "#10b981",
  },
  "bg-sky-500": {
    dot: "bg-sky-500",
    card: "bg-sky-50",
    border: "border-sky-200",
    chip: "bg-sky-100 text-sky-800",
    progress: "bg-sky-500",
    text: "text-sky-800",
    chart: "#0ea5e9",
  },
  "bg-blue-500": {
    dot: "bg-blue-500",
    card: "bg-blue-50",
    border: "border-blue-200",
    chip: "bg-blue-100 text-blue-800",
    progress: "bg-blue-500",
    text: "text-blue-800",
    chart: "#1877f2",
  },
  "bg-amber-500": {
    dot: "bg-amber-500",
    card: "bg-amber-50",
    border: "border-amber-200",
    chip: "bg-amber-100 text-amber-800",
    progress: "bg-amber-500",
    text: "text-amber-800",
    chart: "#f59e0b",
  },
  "bg-rose-500": {
    dot: "bg-rose-500",
    card: "bg-rose-50",
    border: "border-rose-200",
    chip: "bg-rose-100 text-rose-800",
    progress: "bg-rose-500",
    text: "text-rose-800",
    chart: "#f43f5e",
  },
  "bg-fuchsia-500": {
    dot: "bg-fuchsia-500",
    card: "bg-fuchsia-50",
    border: "border-fuchsia-200",
    chip: "bg-fuchsia-100 text-fuchsia-800",
    progress: "bg-fuchsia-500",
    text: "text-fuchsia-800",
    chart: "#d946ef",
  },
  "bg-violet-500": {
    dot: "bg-violet-500",
    card: "bg-violet-50",
    border: "border-violet-200",
    chip: "bg-violet-100 text-violet-800",
    progress: "bg-violet-500",
    text: "text-violet-800",
    chart: "#8b5cf6",
  },
  "bg-orange-500": {
    dot: "bg-orange-500",
    card: "bg-orange-50",
    border: "border-orange-200",
    chip: "bg-orange-100 text-orange-800",
    progress: "bg-orange-500",
    text: "text-orange-800",
    chart: "#f97316",
  },
  "bg-zinc-500": {
    dot: "bg-zinc-500",
    card: "bg-zinc-50",
    border: "border-zinc-200",
    chip: "bg-zinc-100 text-zinc-800",
    progress: "bg-zinc-500",
    text: "text-zinc-800",
    chart: "#71717a",
  },
};

export function corToAccent(cor: string): SubjectAccent {
  return COR_TO_ACCENT[cor] ?? ACCENT_FALLBACK;
}

export function difficultyDays(difficulty: Difficulty) {
  if (difficulty === "Difícil") return [3, 10, 17];
  if (difficulty === "Médio") return [7, 21];
  return [14];
}

export function topicScore(status: TopicStatus, difficulty: Difficulty) {
  const statusPoints: Record<TopicStatus, number> = {
    "Não Estudado": 8,
    "Teoria Lida": 42,
    "Questões Feitas": 76,
    Revisado: 94,
  };
  const difficultyBonus: Record<Difficulty, number> = {
    Fácil: 4,
    Médio: 0,
    Difícil: -6,
  };
  return Math.max(0, Math.min(100, statusPoints[status] + difficultyBonus[difficulty]));
}

export function pieBackground(slices: ChartSlice[]) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  if (total === 0) return "#e2e8f0";

  let cursor = 0;
  const stops = slices.map((slice) => {
    const start = cursor;
    const end = cursor + (slice.value / total) * 100;
    cursor = end;
    return `${slice.color} ${start}% ${end}%`;
  });

  return `conic-gradient(${stops.join(", ")})`;
}

export function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

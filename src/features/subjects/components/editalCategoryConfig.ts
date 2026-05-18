import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Calculator,
  GraduationCap,
  Landmark,
  Medal,
  Scale,
  Gavel,
  ShieldCheck,
} from "lucide-react";
import type { EditalBadge, EditalCategoria, EditalNivel } from "@/lib/readyEditals";

// ── Category icons ────────────────────────────────────────────────────────────

export const CATEGORIA_ICON: Record<EditalCategoria, LucideIcon> = {
  policia:  ShieldCheck,
  tribunal: Gavel,
  fiscal:   Calculator,
  bancario: Landmark,
  militar:  Medal,
  enem:     GraduationCap,
  oab:      Scale,
  geral:    BookOpen,
};

// ── Category background colors (Tailwind bg-* classes) ────────────────────────

export const CATEGORIA_BG: Record<EditalCategoria, string> = {
  policia:  "bg-blue-500",
  tribunal: "bg-purple-500",
  fiscal:   "bg-emerald-500",
  bancario: "bg-amber-500",
  militar:  "bg-slate-600",
  enem:     "bg-rose-500",
  oab:      "bg-violet-500",
  geral:    "bg-slate-400",
};

// ── Section labels shown in the catalog ──────────────────────────────────────

export const CATEGORIA_SECTION: Record<EditalCategoria, { emoji: string; label: string }> = {
  policia:  { emoji: "🛡️", label: "Polícia"   },
  tribunal: { emoji: "⚖️", label: "Tribunais"  },
  fiscal:   { emoji: "📊", label: "Fiscal"    },
  bancario: { emoji: "🏦", label: "Bancários" },
  militar:  { emoji: "🎖️", label: "Militar"   },
  enem:     { emoji: "🎓", label: "ENEM"      },
  oab:      { emoji: "📜", label: "OAB"       },
  geral:    { emoji: "📚", label: "Geral"     },
};

// ── Badge pill styles ─────────────────────────────────────────────────────────

export const BADGE_CLASS: Record<EditalBadge, string> = {
  "Novo":          "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  "Mais estudado": "bg-orange-50 text-orange-700 ring-1 ring-orange-100",
  "Polícia":       "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  "Tribunal":      "bg-purple-50 text-purple-700 ring-1 ring-purple-100",
  "Bancário":      "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  "ENEM":          "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
  "OAB":           "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
  "Militar":       "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  "Fiscal":        "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
};

// ── Difficulty level styles ───────────────────────────────────────────────────

export const NIVEL_CLASS: Record<EditalNivel, string> = {
  "Básico":        "bg-emerald-50 text-emerald-700",
  "Intermediário": "bg-amber-50 text-amber-700",
  "Avançado":      "bg-rose-50 text-rose-700",
};

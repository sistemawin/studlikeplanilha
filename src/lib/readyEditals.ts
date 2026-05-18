import type { Difficulty } from "@/types";

export type EditalCategoria =
  | "policia"
  | "tribunal"
  | "fiscal"
  | "bancario"
  | "militar"
  | "enem"
  | "oab"
  | "geral";

export type EditalBadge =
  | "Novo"
  | "Mais estudado"
  | "Polícia"
  | "Tribunal"
  | "Bancário"
  | "ENEM"
  | "OAB"
  | "Militar"
  | "Fiscal";

export type EditalNivel = "Básico" | "Intermediário" | "Avançado";

export type ReadyEditalSubject = {
  nome: string;
  peso: number;
  cor: string;
  dificuldade?: Difficulty;
  topicos: string[];
};

export type ReadyEdital = {
  id: string;
  title: string;
  subtitle: string;
  banca: string;
  cargo: string;
  ano: number;
  fonte: string;
  sourceUrl: string;
  subjects: ReadyEditalSubject[];
  categoria?: EditalCategoria;
  badges?: EditalBadge[];
  popularidade?: number;
  nivel?: EditalNivel;
  atualizadoEm?: string;
  destaque?: boolean;
};

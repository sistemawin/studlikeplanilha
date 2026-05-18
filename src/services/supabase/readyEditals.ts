import type { SupabaseClient } from "@supabase/supabase-js";
import type { Difficulty } from "@/types";
import type {
  EditalBadge,
  EditalCategoria,
  EditalNivel,
  ReadyEdital,
  ReadyEditalSubject,
} from "@/lib/readyEditals";

type ReadyEditalRow = {
  id: string;
  titulo: string;
  subtitulo: string | null;
  banca: string;
  cargo: string;
  ano: number;
  fonte: string | null;
  source_url: string | null;
  categoria: string | null;
  badges: string[] | null;
  popularidade: number | null;
  nivel: string | null;
  atualizado_em: string | null;
  destaque: boolean | null;
};

type ReadyEditalMateriaRow = {
  id: string;
  edital_id: string;
  nome: string;
  peso: number;
  cor: string;
  dificuldade_padrao: Difficulty;
  ordem: number;
};

type ReadyEditalTopicoRow = {
  id: string;
  materia_id: string;
  titulo: string;
  dificuldade: Difficulty;
  ordem: number;
};

type ReadyEditalMapperInput = ReadyEditalRow & {
  subjects: ReadyEditalSubject[];
};

const CATEGORIAS: ReadonlySet<string> = new Set([
  "policia",
  "tribunal",
  "fiscal",
  "bancario",
  "militar",
  "enem",
  "oab",
  "geral",
]);

const NIVEIS: ReadonlySet<string> = new Set(["Básico", "Intermediário", "Avançado"]);

function mapCategoria(value: string | null): EditalCategoria {
  return value && CATEGORIAS.has(value) ? (value as EditalCategoria) : "geral";
}

function mapNivel(value: string | null): EditalNivel | undefined {
  return value && NIVEIS.has(value) ? (value as EditalNivel) : undefined;
}

function mapBadges(value: string[] | null): EditalBadge[] | undefined {
  if (!value || value.length === 0) return undefined;
  return value.filter(Boolean) as EditalBadge[];
}

export function mapSupabaseReadyEdital(row: ReadyEditalMapperInput): ReadyEdital {
  return {
    id: row.id,
    title: row.titulo,
    subtitle: row.subtitulo ?? "",
    banca: row.banca,
    cargo: row.cargo,
    ano: row.ano,
    fonte: row.fonte ?? "",
    sourceUrl: row.source_url ?? "",
    categoria: mapCategoria(row.categoria),
    badges: mapBadges(row.badges),
    popularidade: row.popularidade ?? 0,
    nivel: mapNivel(row.nivel),
    atualizadoEm: row.atualizado_em ?? undefined,
    destaque: row.destaque ?? false,
    subjects: row.subjects,
  };
}

export async function listReadyEditals(supabase: SupabaseClient): Promise<ReadyEdital[]> {
  const { data: editalRows, error: editaisError } = await supabase
    .from("editais_prontos")
    .select("id,titulo,subtitulo,banca,cargo,ano,fonte,source_url,categoria,badges,popularidade,nivel,atualizado_em,destaque")
    .eq("publicado", true)
    .order("destaque", { ascending: false })
    .order("popularidade", { ascending: false })
    .order("atualizado_em", { ascending: false })
    .order("titulo", { ascending: true });

  if (editaisError) throw editaisError;
  const editais = (editalRows ?? []) as ReadyEditalRow[];
  if (editais.length === 0) return [];

  const editalIds = editais.map((edital) => edital.id);
  const { data: materiaRows, error: materiasError } = await supabase
    .from("editais_prontos_materias")
    .select("id,edital_id,nome,peso,cor,dificuldade_padrao,ordem")
    .in("edital_id", editalIds)
    .order("ordem", { ascending: true })
    .order("nome", { ascending: true });

  if (materiasError) throw materiasError;
  const materias = (materiaRows ?? []) as ReadyEditalMateriaRow[];
  const materiaIds = materias.map((materia) => materia.id);

  const topicos = materiaIds.length > 0
    ? await (async () => {
        const { data, error } = await supabase
          .from("editais_prontos_topicos")
          .select("id,materia_id,titulo,dificuldade,ordem")
          .in("materia_id", materiaIds)
          .order("ordem", { ascending: true })
          .order("titulo", { ascending: true });
        if (error) throw error;
        return (data ?? []) as ReadyEditalTopicoRow[];
      })()
    : [];

  const topicsByMateria = new Map<string, ReadyEditalTopicoRow[]>();
  for (const topic of topicos) {
    const list = topicsByMateria.get(topic.materia_id) ?? [];
    list.push(topic);
    topicsByMateria.set(topic.materia_id, list);
  }

  const subjectsByEdital = new Map<string, ReadyEditalSubject[]>();
  for (const materia of materias) {
    const list = subjectsByEdital.get(materia.edital_id) ?? [];
    list.push({
      nome: materia.nome,
      peso: materia.peso,
      cor: materia.cor,
      dificuldade: materia.dificuldade_padrao,
      topicos: (topicsByMateria.get(materia.id) ?? []).map((topic) => topic.titulo),
    });
    subjectsByEdital.set(materia.edital_id, list);
  }

  return editais.map((edital) =>
    mapSupabaseReadyEdital({
      ...edital,
      subjects: subjectsByEdital.get(edital.id) ?? [],
    }),
  );
}

export async function importOfficialReadyEdital(supabase: SupabaseClient, editalId: string) {
  const { data, error } = await supabase.rpc("import_ready_edital", { p_edital_id: editalId });
  if (error) throw error;
  return data as { editalId: string; materias: number; topicos: number } | null;
}

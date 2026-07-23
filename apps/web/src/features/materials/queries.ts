import "server-only";
import { BlockSchema, type Block, type MaterialKind } from "@pedagoos/pedagogy";
import { createClient } from "@/lib/supabase/server";

export interface MaterialListItem {
  id: string;
  lesson_id: string | null;
  kind: MaterialKind;
  title: string;
  status: string;
  current_version: number;
  locked: boolean;
  updated_at: string;
}

export interface MaterialDetail {
  id: string;
  organization_id: string;
  sequence_id: string;
  lesson_id: string | null;
  kind: MaterialKind;
  title: string;
  status: string;
  locked: boolean;
  current_version: number;
  blocks: Block[];
}

export interface MaterialVersionItem {
  version_number: number;
  title: string;
  status: string;
  label: string | null;
  created_at: string;
}

/** Parse une liste de blocs jsonb en écartant l'invalide (défense en profondeur). */
function parseBlocks(raw: unknown): Block[] {
  if (!Array.isArray(raw)) return [];
  const out: Block[] = [];
  for (const item of raw) {
    const parsed = BlockSchema.safeParse(item);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}

export async function listMaterials(sequenceId: string): Promise<MaterialListItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("materials")
    .select("id, lesson_id, kind, title, status, current_version, locked, updated_at")
    .eq("sequence_id", sequenceId)
    .order("created_at", { ascending: true });
  return (data ?? []) as unknown as MaterialListItem[];
}

export async function getMaterialDetail(
  materialId: string,
): Promise<MaterialDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("materials")
    .select(
      "id, organization_id, sequence_id, lesson_id, kind, title, status, locked, current_version, blocks",
    )
    .eq("id", materialId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id as string,
    organization_id: data.organization_id as string,
    sequence_id: data.sequence_id as string,
    lesson_id: (data.lesson_id as string | null) ?? null,
    kind: data.kind as MaterialKind,
    title: data.title as string,
    status: data.status as string,
    locked: data.locked as boolean,
    current_version: data.current_version as number,
    blocks: parseBlocks(data.blocks),
  };
}

export async function listMaterialVersions(
  materialId: string,
): Promise<MaterialVersionItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("material_versions")
    .select("version_number, title, status, label, created_at")
    .eq("material_id", materialId)
    .order("version_number", { ascending: false });
  return (data ?? []) as unknown as MaterialVersionItem[];
}

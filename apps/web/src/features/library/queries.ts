import "server-only";
import { createClient } from "@/lib/supabase/server";
import { demoSources } from "@/lib/demo-data";

export interface SourceDocumentRow {
  id: string;
  title: string;
  language: string;
  grade_level: string | null;
  tags: string[];
  mime_type: string;
  processing_status: "pending" | "processing" | "ready" | "awaiting_ocr" | "failed";
  created_at: string;
  subjects: { name: string } | null;
  schools: { name: string } | null;
}

export interface LibraryFormData {
  organizationId: string;
  schools: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
}

/** Documents visibles (RLS : éducateurs, périmètre org/école). */
export async function listSources(query: string | null): Promise<SourceDocumentRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const trimmed = query?.trim().toLowerCase() ?? "";
    const sources =
      trimmed.length === 0
        ? demoSources
        : demoSources.filter((source) =>
            [source.title, source.subjects?.name, source.tags.join(" ")]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(trimmed),
          );
    return sources as SourceDocumentRow[];
  }

  let request = supabase
    .from("source_documents")
    .select(
      "id, title, language, grade_level, tags, mime_type, processing_status, created_at, subjects(name), schools(name)",
    )
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  const trimmed = query?.trim() ?? "";
  if (trimmed.length > 0) {
    request = request.textSearch("text_search", trimmed, {
      type: "websearch",
      config: "simple",
    });
  }
  const { data } = await request;
  return (data ?? []) as unknown as SourceDocumentRow[];
}

/** Contexte du formulaire d'import pour la première organisation éducatrice. */
export async function getLibraryFormData(): Promise<LibraryFormData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memberships } = await supabase
    .from("memberships")
    .select("organization_id")
    .eq("profile_id", user.id)
    .eq("status", "active")
    .in("role", ["org_admin", "school_director", "pedagogical_lead", "teacher"]);
  const organizationId = memberships?.[0]?.organization_id as string | undefined;
  if (!organizationId) return null;

  const [{ data: schools }, { data: subjects }] = await Promise.all([
    supabase
      .from("schools")
      .select("id, name")
      .eq("organization_id", organizationId)
      .is("archived_at", null)
      .order("name"),
    supabase
      .from("subjects")
      .select("id, name")
      .eq("organization_id", organizationId)
      .order("name"),
  ]);

  return { organizationId, schools: schools ?? [], subjects: subjects ?? [] };
}

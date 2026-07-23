import "server-only";
import { LessonSequenceSchema, type LessonSequence } from "@pedagoos/pedagogy";
import { createClient } from "@/lib/supabase/server";
import { wizardStateSchema, type WizardState } from "./schemas";

export interface SequenceListItem {
  id: string;
  title: string;
  theme: string;
  status: string;
  created_at: string;
  classes: { name: string } | null;
}

export interface SequenceDetail {
  id: string;
  organization_id: string;
  class_id: string;
  title: string;
  theme: string;
  language: string;
  grade_level_hint: string | null;
  session_count: number;
  session_duration_minutes: number;
  difficulty: "easier" | "standard" | "harder";
  status: string;
  subject_name: string | null;
  wizardState: WizardState;
  structure: LessonSequence | null;
}

export interface NewSequenceFormData {
  organizationId: string;
  classes: { id: string; grade_level: string; name: string }[];
  subjects: { id: string; name: string }[];
}

export async function listSequences(): Promise<SequenceListItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lesson_sequences")
    .select("id, title, theme, status, created_at, classes(name)")
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []) as unknown as SequenceListItem[];
}

export async function getNewSequenceFormData(): Promise<NewSequenceFormData | null> {
  const supabase = await createClient();
  const { data: classes } = await supabase
    .from("classes")
    .select("id, grade_level, name, organization_id")
    .is("archived_at", null)
    .order("name");
  if (!classes || classes.length === 0) return null;

  const organizationId = classes[0]?.organization_id as string;
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name")
    .eq("organization_id", organizationId)
    .order("name");

  return {
    organizationId,
    classes: classes.map((c) => ({
      id: c.id as string,
      grade_level: c.grade_level as string,
      name: c.name as string,
    })),
    subjects: (subjects ?? []) as { id: string; name: string }[],
  };
}

export async function getSequenceDetail(
  sequenceId: string,
): Promise<SequenceDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lesson_sequences")
    .select(
      "id, organization_id, class_id, title, theme, language, session_count, session_duration_minutes, difficulty, status, wizard_state, structure, subjects(name), classes(grade_level)",
    )
    .eq("id", sequenceId)
    .maybeSingle();
  if (!data) return null;

  const wizardState = wizardStateSchema.parse(data.wizard_state ?? {});
  const parsedStructure = data.structure
    ? LessonSequenceSchema.safeParse(data.structure)
    : null;
  const subject = data.subjects as unknown as { name: string } | null;
  const cls = data.classes as unknown as { grade_level: string } | null;

  return {
    id: data.id as string,
    organization_id: data.organization_id as string,
    class_id: data.class_id as string,
    title: data.title as string,
    theme: data.theme as string,
    language: data.language as string,
    grade_level_hint: cls?.grade_level ?? null,
    session_count: data.session_count as number,
    session_duration_minutes: data.session_duration_minutes as number,
    difficulty: data.difficulty as "easier" | "standard" | "harder",
    status: data.status as string,
    subject_name: subject?.name ?? null,
    wizardState,
    structure: parsedStructure?.success ? parsedStructure.data : null,
  };
}

/** Documents disponibles pour la sélection de sources (étape 3). */
export async function listSelectableSources(
  organizationId: string,
): Promise<{ id: string; title: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("source_documents")
    .select("id, title")
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []) as { id: string; title: string }[];
}

import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  DEMO_CLASS_ID,
  demoClassDetail,
  demoClasses,
  demoTeachers,
} from "@/lib/demo-data";
import { ensureOrganizationDefaults } from "@/features/admin/onboarding-defaults";

export interface ClassListItem {
  id: string;
  name: string;
  grade_level: string;
  archived_at: string | null;
  schools: { name: string } | null;
  academic_years: { label: string } | null;
  subjects: { name: string } | null;
}

export interface ClassFormData {
  organizationId: string;
  schools: { id: string; name: string }[];
  years: { id: string; label: string; hebrew_label: string | null }[];
  subjects: { id: string; name: string }[];
}

export interface ClassDetail {
  id: string;
  organization_id: string;
  name: string;
  grade_level: string;
  archived_at: string | null;
  schools: { name: string } | null;
  academic_years: { label: string } | null;
  subjects: { name: string } | null;
  teachers: { profile_id: string; full_name: string }[];
  students: { id: string; first_name: string; last_name: string; note: string }[];
}

/** Classes visibles par l'utilisateur (la RLS fait le filtrage). */
export async function listClasses(): Promise<ClassListItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return demoClasses as unknown as ClassListItem[];
  }

  const { data } = await supabase
    .from("classes")
    .select(
      "id, name, grade_level, archived_at, schools(name), academic_years(label), subjects(name)",
    )
    .order("archived_at", { ascending: true, nullsFirst: true })
    .order("name");
  return (data ?? []) as unknown as ClassListItem[];
}

/**
 * Données du formulaire de création pour la première organisation où
 * l'utilisateur est org_admin ou directeur ; null s'il ne peut pas créer.
 */
export async function getClassFormData(): Promise<ClassFormData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memberships } = await supabase
    .from("memberships")
    .select("organization_id, role")
    .eq("profile_id", user.id)
    .eq("status", "active")
    .in("role", ["org_admin", "school_director"]);
  const organizationId = memberships?.[0]?.organization_id as string | undefined;
  if (!organizationId) return null;
  const canPrepareDefaults = memberships?.[0]?.role === "org_admin";

  if (canPrepareDefaults) {
    await ensureOrganizationDefaults(organizationId);
  }

  const [{ data: schools }, { data: years }, { data: subjects }] = await Promise.all([
    supabase
      .from("schools")
      .select("id, name")
      .eq("organization_id", organizationId)
      .is("archived_at", null)
      .order("name"),
    supabase
      .from("academic_years")
      .select("id, label, hebrew_label")
      .eq("organization_id", organizationId)
      .order("starts_on", { ascending: false }),
    supabase
      .from("subjects")
      .select("id, name")
      .eq("organization_id", organizationId)
      .order("name"),
  ]);

  return {
    organizationId,
    schools: schools ?? [],
    years: years ?? [],
    subjects: subjects ?? [],
  };
}

export async function getClassDetail(classId: string): Promise<ClassDetail | null> {
  if (classId === DEMO_CLASS_ID) {
    return demoClassDetail as unknown as ClassDetail;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("classes")
    .select(
      "id, organization_id, name, grade_level, archived_at, schools(name), academic_years(label), subjects(name)",
    )
    .eq("id", classId)
    .maybeSingle();
  if (!data) return null;

  const [{ data: teachers }, { data: students }] = await Promise.all([
    supabase
      .from("class_teachers")
      .select("profile_id, profiles(full_name)")
      .eq("class_id", classId),
    supabase
      .from("class_students")
      .select("students(id, first_name, last_name)")
      .eq("class_id", classId)
      .is("left_on", null),
  ]);

  const teacherRows = (teachers ?? []) as unknown as {
    profile_id: string;
    profiles: { full_name: string } | null;
  }[];
  const studentRows = (students ?? []) as unknown as {
    students: { id: string; first_name: string; last_name: string } | null;
  }[];
  const baseStudents = studentRows
    .flatMap((row) => (row.students ? [row.students] : []))
    .sort((a, b) => a.last_name.localeCompare(b.last_name));
  const studentIds = baseStudents.map((student) => student.id);
  let notes = new Map<string, string>();

  if (user && studentIds.length > 0) {
    const { data: noteRows } = await supabase
      .from("student_notes")
      .select("student_id, note")
      .eq("class_id", classId)
      .eq("author_id", user.id)
      .in("student_id", studentIds);

    notes = new Map(
      ((noteRows ?? []) as unknown as { student_id: string; note: string }[]).map(
        (row) => [row.student_id, row.note],
      ),
    );
  }

  return {
    ...(data as unknown as Omit<ClassDetail, "teachers" | "students">),
    teachers: teacherRows.map((row) => ({
      profile_id: row.profile_id,
      full_name: row.profiles?.full_name ?? "",
    })),
    students: baseStudents.map((student) => ({
      ...student,
      note: notes.get(student.id) ?? "",
    })),
  };
}

/** Professeurs de l'organisation (visible par org_admin via RLS memberships). */
export async function listOrgTeachers(
  organizationId: string,
): Promise<{ profile_id: string; full_name: string }[]> {
  if (organizationId === demoClassDetail.organization_id) {
    return demoTeachers;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select("profile_id, profiles(full_name)")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .in("role", ["teacher", "pedagogical_lead", "school_director"]);
  const rows = (data ?? []) as unknown as {
    profile_id: string;
    profiles: { full_name: string } | null;
  }[];
  const seen = new Set<string>();
  return rows
    .filter((row) => {
      if (seen.has(row.profile_id)) return false;
      seen.add(row.profile_id);
      return true;
    })
    .map((row) => ({
      profile_id: row.profile_id,
      full_name: row.profiles?.full_name ?? "",
    }))
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
}

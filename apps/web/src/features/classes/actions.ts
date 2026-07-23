"use server";

import { revalidatePath } from "next/cache";
import { AppError, toActionError, type ActionResult } from "@pedagoos/shared";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import {
  addStudentSchema,
  addTeacherSchema,
  classIdSchema,
  createClassSchema,
} from "./schemas";
import { parseStudentsCsv, type CsvError } from "@/features/students/csv";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AppError("unauthorized", "Session requise.");
  return { supabase, user };
}

export async function createClassAction(
  formData: FormData,
): Promise<ActionResult<{ classId: string }>> {
  try {
    const parsed = createClassSchema.safeParse({
      organizationId: formData.get("organizationId"),
      schoolId: formData.get("schoolId"),
      academicYearId: formData.get("academicYearId"),
      name: formData.get("name"),
      gradeLevel: formData.get("gradeLevel"),
      subjectId: formData.get("subjectId") ?? "",
    });
    if (!parsed.success) throw new AppError("validation_failed", "Entrée invalide.");
    const { supabase, user } = await requireUser();

    // Client utilisateur : la politique RLS classes_insert (org_admin ou
    // direction de l'établissement) est l'autorisation effective.
    const { data: created, error } = await supabase
      .from("classes")
      .insert({
        organization_id: parsed.data.organizationId,
        school_id: parsed.data.schoolId,
        academic_year_id: parsed.data.academicYearId,
        name: parsed.data.name,
        grade_level: parsed.data.gradeLevel,
        subject_id: parsed.data.subjectId ?? null,
      })
      .select("id")
      .single();
    if (error || !created) throw new AppError("forbidden", "Création refusée.");

    await writeAuditLog({
      organizationId: parsed.data.organizationId,
      actorId: user.id,
      action: "class.create",
      entityType: "class",
      entityId: created.id,
    });
    revalidatePath("/classes");
    return { ok: true, data: { classId: created.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function archiveClassAction(
  formData: FormData,
): Promise<ActionResult<{ archived: true }>> {
  try {
    const parsed = classIdSchema.safeParse({ classId: formData.get("classId") });
    if (!parsed.success) throw new AppError("validation_failed", "Entrée invalide.");
    const { supabase, user } = await requireUser();

    const { data: updated, error } = await supabase
      .from("classes")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", parsed.data.classId)
      .is("archived_at", null)
      .select("id, organization_id")
      .maybeSingle();
    if (error || !updated) throw new AppError("forbidden", "Archivage refusé.");

    await writeAuditLog({
      organizationId: updated.organization_id,
      actorId: user.id,
      action: "class.archive",
      entityType: "class",
      entityId: updated.id,
    });
    revalidatePath("/classes");
    revalidatePath(`/classes/${parsed.data.classId}`);
    return { ok: true, data: { archived: true } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function addTeacherAction(
  formData: FormData,
): Promise<ActionResult<{ added: true }>> {
  try {
    const parsed = addTeacherSchema.safeParse({
      classId: formData.get("classId"),
      profileId: formData.get("profileId"),
    });
    if (!parsed.success) throw new AppError("validation_failed", "Entrée invalide.");
    const { supabase, user } = await requireUser();

    const { data: cls } = await supabase
      .from("classes")
      .select("organization_id")
      .eq("id", parsed.data.classId)
      .maybeSingle();
    if (!cls) throw new AppError("not_found", "Classe introuvable.");

    // RLS class_teachers_write : org_admin ou direction de l'établissement.
    const { error } = await supabase.from("class_teachers").upsert(
      {
        class_id: parsed.data.classId,
        profile_id: parsed.data.profileId,
        role: "co_teacher",
      },
      { onConflict: "class_id,profile_id" },
    );
    if (error) throw new AppError("forbidden", "Association refusée.");

    await writeAuditLog({
      organizationId: cls.organization_id,
      actorId: user.id,
      action: "class.add_teacher",
      entityType: "class",
      entityId: parsed.data.classId,
    });
    revalidatePath(`/classes/${parsed.data.classId}`);
    return { ok: true, data: { added: true } };
  } catch (error) {
    return toActionError(error);
  }
}

export interface ImportReport {
  created: number;
  errors: { line: number; code: string }[];
}

async function callAddStudents(
  classId: string,
  students: { firstName: string; lastName: string; birthDate?: string }[],
): Promise<ImportReport> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("add_students_to_class", {
    p_class_id: classId,
    p_students: students,
  });
  if (error) {
    if (error.message.includes("forbidden")) {
      throw new AppError("forbidden", "Accès refusé à cette classe.");
    }
    throw new AppError("internal", "Ajout impossible.");
  }
  const report = data as { created: number; errors: { index: number; code: string }[] };
  return {
    created: report.created,
    errors: report.errors.map((e) => ({ line: e.index, code: e.code })),
  };
}

export async function addStudentAction(
  formData: FormData,
): Promise<ActionResult<{ created: number }>> {
  try {
    const parsed = addStudentSchema.safeParse({
      classId: formData.get("classId"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      birthDate: formData.get("birthDate") ?? "",
    });
    if (!parsed.success) throw new AppError("validation_failed", "Entrée invalide.");

    const report = await callAddStudents(parsed.data.classId, [
      {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        ...(parsed.data.birthDate ? { birthDate: parsed.data.birthDate } : {}),
      },
    ]);
    if (report.created !== 1) {
      throw new AppError("validation_failed", "Élève non créé.");
    }
    revalidatePath(`/classes/${parsed.data.classId}`);
    revalidatePath("/eleves");
    return { ok: true, data: { created: 1 } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function importStudentsCsvAction(
  formData: FormData,
): Promise<ActionResult<ImportReport>> {
  try {
    const parsedId = classIdSchema.safeParse({ classId: formData.get("classId") });
    const file = formData.get("file");
    if (!parsedId.success || !(file instanceof File)) {
      throw new AppError("validation_failed", "Entrée invalide.");
    }
    if (file.size > 1024 * 1024) {
      throw new AppError("validation_failed", "Fichier trop volumineux (max 1 Mo).");
    }

    const text = await file.text();
    const parsed = parseStudentsCsv(text);
    const parseErrors: CsvError[] = parsed.errors;

    let created = 0;
    let dbErrors: { line: number; code: string }[] = [];
    if (parsed.rows.length > 0) {
      const report = await callAddStudents(
        parsedId.data.classId,
        parsed.rows.map(({ line: _line, ...row }) => row),
      );
      created = report.created;
      // La fonction SQL rapporte l'index (1-based) dans le lot envoyé ;
      // on le retraduit en numéro de ligne du fichier d'origine.
      dbErrors = report.errors.map((e) => ({
        line: parsed.rows[e.line - 1]?.line ?? e.line,
        code: e.code,
      }));
    }

    revalidatePath(`/classes/${parsedId.data.classId}`);
    revalidatePath("/eleves");
    return {
      ok: true,
      data: { created, errors: [...parseErrors, ...dbErrors] },
    };
  } catch (error) {
    return toActionError(error);
  }
}

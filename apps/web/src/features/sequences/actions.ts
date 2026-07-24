"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AppError, toActionError, type ActionResult } from "@pedagoos/shared";
import {
  LessonSequenceSchema,
  findDanglingObjectiveIds,
  type LessonSequence,
} from "@pedagoos/pedagogy";
import {
  SequenceStructureInputSchema,
  generateSequenceStructure,
  sequenceStructurePromptV1,
  type SequenceStructureInput,
} from "@pedagoos/ai";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { getAIProvider, logAiGeneration } from "@/lib/ai";
import {
  createSequenceSchema,
  lessonMoveSchema,
  saveIntentionsSchema,
  saveSourcesSchema,
  sequenceIdSchema,
  updateLessonSchema,
  updateObjectiveSchema,
  wizardStateSchema,
  type WizardState,
} from "./schemas";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AppError("unauthorized", "Session requise.");
  return { supabase, user };
}

/** Étape 1 — crée la séquence en brouillon et ouvre l'assistant. */
export async function createSequenceAction(formData: FormData): Promise<void> {
  const parsed = createSequenceSchema.safeParse({
    organizationId: formData.get("organizationId"),
    classId: formData.get("classId"),
    subjectId: formData.get("subjectId") ?? "",
    theme: formData.get("theme"),
    gradeLevel: formData.get("gradeLevel"),
    language: formData.get("language"),
    sessionCount: formData.get("sessionCount"),
    sessionDurationMinutes: formData.get("sessionDurationMinutes"),
    difficulty: formData.get("difficulty"),
  });
  if (!parsed.success) throw new AppError("validation_failed", "Entrée invalide.");
  const { supabase, user } = await requireUser();

  const { data: created, error } = await supabase
    .from("lesson_sequences")
    .insert({
      organization_id: parsed.data.organizationId,
      class_id: parsed.data.classId,
      subject_id: parsed.data.subjectId ?? null,
      title: parsed.data.theme,
      theme: parsed.data.theme,
      created_by: user.id,
      language: parsed.data.language,
      session_count: parsed.data.sessionCount,
      session_duration_minutes: parsed.data.sessionDurationMinutes,
      difficulty: parsed.data.difficulty,
      status: "draft",
    })
    .select("id")
    .single();
  if (error || !created) throw new AppError("forbidden", "Création refusée.");

  await writeAuditLog({
    organizationId: parsed.data.organizationId,
    actorId: user.id,
    action: "sequence.create",
    entityType: "lesson_sequence",
    entityId: created.id,
  });
  redirect(`/sequences/${created.id}`);
}

async function loadWizardState(sequenceId: string): Promise<WizardState> {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("lesson_sequences")
    .select("wizard_state")
    .eq("id", sequenceId)
    .maybeSingle();
  return wizardStateSchema.parse(data?.wizard_state ?? {});
}

async function saveWizardState(
  sequenceId: string,
  state: WizardState,
): Promise<ActionResult<{ saved: true }>> {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("lesson_sequences")
    .update({ wizard_state: state })
    .eq("id", sequenceId);
  if (error) throw new AppError("forbidden", "Enregistrement refusé.");
  revalidatePath(`/sequences/${sequenceId}`);
  return { ok: true, data: { saved: true } };
}

/** Étape 2 — intentions pédagogiques. */
export async function saveIntentionsAction(
  formData: FormData,
): Promise<ActionResult<{ saved: true }>> {
  try {
    const parsed = saveIntentionsSchema.safeParse({
      sequenceId: formData.get("sequenceId"),
      desiredObjectives: formData.get("desiredObjectives") ?? "",
      prerequisites: formData.get("prerequisites") ?? "",
      constraints: formData.get("constraints") ?? "",
      learningType: formData.get("learningType") ?? "",
      differentiation: formData.get("differentiation") ?? "",
    });
    if (!parsed.success) throw new AppError("validation_failed", "Entrée invalide.");

    const current = await loadWizardState(parsed.data.sequenceId);
    return await saveWizardState(parsed.data.sequenceId, {
      ...current,
      desiredObjectives: parsed.data.desiredObjectives,
      prerequisites: parsed.data.prerequisites,
      constraints: parsed.data.constraints,
      ...(parsed.data.learningType ? { learningType: parsed.data.learningType } : {}),
      ...(parsed.data.differentiation
        ? { differentiation: parsed.data.differentiation }
        : {}),
    });
  } catch (error) {
    return toActionError(error);
  }
}

/** Étape 3 — sélection des sources. */
export async function saveSourcesAction(
  formData: FormData,
): Promise<ActionResult<{ saved: true }>> {
  try {
    const parsed = saveSourcesSchema.safeParse({
      sequenceId: formData.get("sequenceId"),
      sourceIds: formData.getAll("sourceIds"),
    });
    if (!parsed.success) throw new AppError("validation_failed", "Entrée invalide.");
    const current = await loadWizardState(parsed.data.sequenceId);
    return await saveWizardState(parsed.data.sequenceId, {
      ...current,
      sourceIds: parsed.data.sourceIds,
    });
  } catch (error) {
    return toActionError(error);
  }
}

/** Étape 4 — génère une PROPOSITION de structure (jamais les supports). */
export async function generateStructureAction(
  formData: FormData,
): Promise<ActionResult<{ generated: true }>> {
  try {
    const parsed = sequenceIdSchema.safeParse({
      sequenceId: formData.get("sequenceId"),
    });
    if (!parsed.success) throw new AppError("validation_failed", "Entrée invalide.");
    const { supabase, user } = await requireUser();

    const { data: seq } = await supabase
      .from("lesson_sequences")
      .select(
        "id, organization_id, theme, language, session_count, session_duration_minutes, difficulty, wizard_state, subjects(name), classes(grade_level)",
      )
      .eq("id", parsed.data.sequenceId)
      .maybeSingle();
    if (!seq) throw new AppError("not_found", "Séquence introuvable.");

    const wizard = wizardStateSchema.parse(seq.wizard_state ?? {});
    const subject = seq.subjects as unknown as { name: string } | null;
    const cls = seq.classes as unknown as { grade_level: string } | null;

    // Extraits des sources sélectionnées (jamais de source hors sélection).
    let sourceExcerpts: SequenceStructureInput["sourceExcerpts"] = [];
    if (wizard.sourceIds.length > 0) {
      const { data: sources } = await supabase
        .from("source_documents")
        .select("id, title, extracted_text")
        .in("id", wizard.sourceIds);
      sourceExcerpts = (sources ?? []).map((s) => ({
        sourceDocumentId: s.id as string,
        title: s.title as string,
        excerpt: ((s.extracted_text as string | null) ?? "").slice(0, 400),
      }));
    }

    const input = SequenceStructureInputSchema.parse({
      theme: seq.theme,
      subject: subject?.name ?? "Matière",
      gradeLevel: cls?.grade_level ?? "cp",
      language: seq.language,
      sessionCount: seq.session_count,
      sessionDurationMinutes: seq.session_duration_minutes,
      difficulty: seq.difficulty,
      desiredObjectives: wizard.desiredObjectives,
      prerequisites: wizard.prerequisites,
      constraints: wizard.constraints,
      learningType: wizard.learningType,
      differentiation: wizard.differentiation,
      sourceExcerpts,
    } satisfies SequenceStructureInput);

    // Capacité (ADR-0014) : le routeur choisit le niveau, l'escalade gère les
    // échecs de schéma. Le code métier ne nomme jamais de modèle.
    const provider = getAIProvider();
    const totalChars = sourceExcerpts.reduce((n, s) => n + s.excerpt.length, 0);
    const outcome = await generateSequenceStructure(provider, input, {
      documentChars: totalChars,
      difficulty: seq.difficulty as "easier" | "standard" | "harder",
      materialCount: seq.session_count as number,
    });
    const result = outcome.final;

    await logAiGeneration({
      organizationId: seq.organization_id as string,
      requestedBy: user.id,
      provider: result.provider,
      model: result.model,
      tier: result.tier,
      capability: "GenerateSequenceStructure",
      engine: "curriculum",
      promptName: sequenceStructurePromptV1.PROMPT_NAME,
      promptVersion: sequenceStructurePromptV1.PROMPT_VERSION,
      parameters: {
        difficulty: seq.difficulty,
        sessionCount: seq.session_count,
        escalated: outcome.escalated,
        attempts: outcome.attempts.length,
      },
      targetType: "sequence_structure",
      targetId: parsed.data.sequenceId,
      sourceDocumentIds: wizard.sourceIds,
      rawOutput: result.raw ?? null,
      validatedOutput: result.data ?? null,
      status: result.status,
      ...(result.error ? { error: result.error } : {}),
      durationMs: result.durationMs,
      ...(result.usage ? { usage: result.usage } : {}),
      ...(result.cacheHit !== undefined ? { cacheHit: result.cacheHit } : {}),
      ...(result.costEstimate !== undefined ? { costEstimate: result.costEstimate } : {}),
    });

    if (result.status !== "succeeded" || !result.data) {
      throw new AppError("ai_provider_failed", "Génération impossible.");
    }

    const { error: updateError } = await supabase
      .from("lesson_sequences")
      .update({
        structure: result.data,
        title: result.data.title,
        status: "structure_proposed",
      })
      .eq("id", parsed.data.sequenceId);
    if (updateError) throw new AppError("forbidden", "Enregistrement refusé.");

    revalidatePath(`/sequences/${parsed.data.sequenceId}`);
    return { ok: true, data: { generated: true } };
  } catch (error) {
    return toActionError(error);
  }
}

/** Charge et parse la structure éditable d'une séquence. */
async function loadStructure(sequenceId: string): Promise<{ structure: LessonSequence }> {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("lesson_sequences")
    .select("structure, status")
    .eq("id", sequenceId)
    .maybeSingle();
  if (!data?.structure) throw new AppError("not_found", "Structure absente.");
  const parsed = LessonSequenceSchema.safeParse(data.structure);
  if (!parsed.success) throw new AppError("internal", "Structure illisible.");
  return { structure: parsed.data };
}

async function persistStructure(sequenceId: string, structure: LessonSequence) {
  const { supabase } = await requireUser();
  // Re-validation systématique avant écriture (jamais de structure invalide).
  const validated = LessonSequenceSchema.parse(structure);
  if (findDanglingObjectiveIds(validated).length > 0) {
    throw new AppError("validation_failed", "Objectif référencé mais non déclaré.");
  }
  const { error } = await supabase
    .from("lesson_sequences")
    .update({ structure: validated })
    .eq("id", sequenceId);
  if (error) throw new AppError("forbidden", "Enregistrement refusé.");
  revalidatePath(`/sequences/${sequenceId}`);
}

export async function updateObjectiveAction(
  formData: FormData,
): Promise<ActionResult<{ saved: true }>> {
  try {
    const parsed = updateObjectiveSchema.safeParse({
      sequenceId: formData.get("sequenceId"),
      objectiveId: formData.get("objectiveId"),
      title: formData.get("title"),
      description: formData.get("description") ?? "",
      bloomLevel: formData.get("bloomLevel"),
    });
    if (!parsed.success) throw new AppError("validation_failed", "Entrée invalide.");
    const { structure } = await loadStructure(parsed.data.sequenceId);
    const objective = structure.objectives.find((o) => o.id === parsed.data.objectiveId);
    if (!objective) throw new AppError("not_found", "Objectif introuvable.");
    objective.title = parsed.data.title;
    objective.description = parsed.data.description || undefined;
    objective.bloomLevel = parsed.data.bloomLevel;
    await persistStructure(parsed.data.sequenceId, structure);
    return { ok: true, data: { saved: true } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateLessonAction(
  formData: FormData,
): Promise<ActionResult<{ saved: true }>> {
  try {
    const parsed = updateLessonSchema.safeParse({
      sequenceId: formData.get("sequenceId"),
      lessonId: formData.get("lessonId"),
      title: formData.get("title"),
      summary: formData.get("summary") ?? "",
    });
    if (!parsed.success) throw new AppError("validation_failed", "Entrée invalide.");
    const { structure } = await loadStructure(parsed.data.sequenceId);
    const lesson = structure.lessons.find((l) => l.id === parsed.data.lessonId);
    if (!lesson) throw new AppError("not_found", "Séance introuvable.");
    lesson.title = parsed.data.title;
    lesson.summary = parsed.data.summary || undefined;
    await persistStructure(parsed.data.sequenceId, structure);
    return { ok: true, data: { saved: true } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function moveLessonAction(
  formData: FormData,
): Promise<ActionResult<{ saved: true }>> {
  try {
    const parsed = lessonMoveSchema.safeParse({
      sequenceId: formData.get("sequenceId"),
      lessonId: formData.get("lessonId"),
      direction: formData.get("direction"),
    });
    if (!parsed.success) throw new AppError("validation_failed", "Entrée invalide.");
    const { structure } = await loadStructure(parsed.data.sequenceId);
    const ordered = [...structure.lessons].sort((a, b) => a.orderIndex - b.orderIndex);
    const index = ordered.findIndex((l) => l.id === parsed.data.lessonId);
    if (index === -1) throw new AppError("not_found", "Séance introuvable.");
    const swapWith = parsed.data.direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= ordered.length) {
      return { ok: true, data: { saved: true } };
    }
    const a = ordered[index];
    const b = ordered[swapWith];
    if (!a || !b) throw new AppError("internal", "Réordonnancement impossible.");
    const tmp = a.orderIndex;
    a.orderIndex = b.orderIndex;
    b.orderIndex = tmp;
    await persistStructure(parsed.data.sequenceId, structure);
    return { ok: true, data: { saved: true } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function regenerateStructureAction(
  formData: FormData,
): Promise<ActionResult<{ generated: true }>> {
  return generateStructureAction(formData);
}

/** Étape 5 → validation humaine explicite ; persiste la normalisation. */
export async function validateStructureAction(
  formData: FormData,
): Promise<ActionResult<{ validated: true }>> {
  try {
    const parsed = sequenceIdSchema.safeParse({
      sequenceId: formData.get("sequenceId"),
    });
    if (!parsed.success) throw new AppError("validation_failed", "Entrée invalide.");
    const { supabase } = await requireUser();
    const { structure } = await loadStructure(parsed.data.sequenceId);

    const { error } = await supabase.rpc("validate_sequence_structure", {
      p_sequence_id: parsed.data.sequenceId,
      p_structure: structure,
    });
    if (error) {
      if (error.message.includes("forbidden")) {
        throw new AppError("forbidden", "Validation refusée.");
      }
      throw new AppError("internal", "Validation impossible.");
    }
    revalidatePath(`/sequences/${parsed.data.sequenceId}`);
    return { ok: true, data: { validated: true } };
  } catch (error) {
    return toActionError(error);
  }
}

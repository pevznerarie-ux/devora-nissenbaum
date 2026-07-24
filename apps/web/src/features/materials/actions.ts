"use server";

import { revalidatePath } from "next/cache";
import { AppError, toActionError, type ActionResult } from "@pedagoos/shared";
import {
  LessonSequenceSchema,
  editIntentToInstruction,
  planRegeneration,
  type Block,
  type DependencyEdge,
  type MaterialKind,
} from "@pedagoos/pedagogy";
import {
  MaterialGenerationInputSchema,
  applyBlockEdit,
  generateMaterial,
  materialEditPromptV1,
  materialPromptV1,
  type MaterialGenerationInput,
} from "@pedagoos/ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { getAIProvider, logAiGeneration } from "@/lib/ai";
import {
  editIntentSchema,
  generateMaterialSchema,
  lockBlockSchema,
  materialIdSchema,
  restoreVersionSchema,
  saveBlocksSchema,
} from "./schemas";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AppError("unauthorized", "Session requise.");
  return { supabase, user };
}

interface SequenceContext {
  organizationId: string;
  language: "fr" | "en" | "he";
  subject: string;
  gradeLevel: string;
  sourceIds: string[];
  structure: ReturnType<typeof LessonSequenceSchema.parse>;
}

/** Charge le contexte d'une séquence validée (structure + cadre) pour générer un support. */
async function loadSequenceContext(
  supabase: SupabaseClient,
  sequenceId: string,
): Promise<SequenceContext> {
  const { data: seq } = await supabase
    .from("lesson_sequences")
    .select(
      "id, organization_id, language, wizard_state, structure, subjects(name), classes(grade_level)",
    )
    .eq("id", sequenceId)
    .maybeSingle();
  if (!seq?.structure)
    throw new AppError("not_found", "Séquence ou structure introuvable.");

  const structure = LessonSequenceSchema.safeParse(seq.structure);
  if (!structure.success) throw new AppError("internal", "Structure illisible.");
  const subject = seq.subjects as unknown as { name: string } | null;
  const cls = seq.classes as unknown as { grade_level: string } | null;
  const wizard = (seq.wizard_state ?? {}) as { sourceIds?: unknown };
  const sourceIds = Array.isArray(wizard.sourceIds)
    ? wizard.sourceIds.filter((v): v is string => typeof v === "string")
    : [];

  return {
    organizationId: seq.organization_id as string,
    language: (seq.language as "fr" | "en" | "he") ?? "fr",
    subject: subject?.name ?? "Matière",
    gradeLevel: cls?.grade_level ?? "cp",
    sourceIds,
    structure: structure.data,
  };
}

/** Construit l'entrée de génération d'un support à partir d'une séance de la structure. */
async function buildMaterialInput(
  supabase: SupabaseClient,
  ctx: SequenceContext,
  lessonId: string,
  kind: MaterialKind,
): Promise<{ input: MaterialGenerationInput; objectiveIds: string[] }> {
  const lesson = ctx.structure.lessons.find((l) => l.id === lessonId);
  if (!lesson) throw new AppError("not_found", "Séance introuvable dans la structure.");

  const objectives = ctx.structure.objectives.filter((o) =>
    lesson.objectiveIds.includes(o.id),
  );
  if (objectives.length === 0) {
    throw new AppError("validation_failed", "La séance ne vise aucun objectif déclaré.");
  }

  let sourceExcerpts: MaterialGenerationInput["sourceExcerpts"] = [];
  if (ctx.sourceIds.length > 0) {
    const { data: sources } = await supabase
      .from("source_documents")
      .select("id, title, extracted_text")
      .in("id", ctx.sourceIds);
    sourceExcerpts = (sources ?? []).map((s) => ({
      sourceDocumentId: s.id as string,
      title: s.title as string,
      excerpt: ((s.extracted_text as string | null) ?? "").slice(0, 400),
    }));
  }

  const input = MaterialGenerationInputSchema.parse({
    kind,
    language: ctx.language,
    subject: ctx.subject,
    gradeLevel: ctx.gradeLevel,
    lessonTitle: lesson.title,
    lessonSummary: lesson.summary ?? "",
    durationMinutes: lesson.durationMinutes,
    objectives: objectives.map((o) => ({ id: o.id, title: o.title })),
    constraints: [],
    sourceExcerpts,
  } satisfies MaterialGenerationInput);

  return { input, objectiveIds: objectives.map((o) => o.id) };
}

/** Enregistre les dépendances de régénération : séance → support, objectif → support. */
async function recordDependencies(
  supabase: SupabaseClient,
  organizationId: string,
  sequenceId: string,
  lessonId: string,
  materialId: string,
  objectiveIds: string[],
): Promise<void> {
  const rows = [
    {
      organization_id: organizationId,
      sequence_id: sequenceId,
      source_object_type: "lesson",
      source_object_id: lessonId,
      dependent_object_type: "material",
      dependent_object_id: materialId,
    },
    ...objectiveIds.map((objectiveId) => ({
      organization_id: organizationId,
      sequence_id: sequenceId,
      source_object_type: "objective",
      source_object_id: objectiveId,
      dependent_object_type: "material",
      dependent_object_id: materialId,
    })),
  ];
  await supabase.from("pedagogical_dependencies").upsert(rows, {
    onConflict: "source_object_id,dependent_object_id",
    ignoreDuplicates: true,
  });
}

/** Exécute la génération IA d'un support et journalise l'appel (ai_generations). */
async function runGeneration(
  ctx: SequenceContext,
  userId: string,
  input: MaterialGenerationInput,
  sequenceId: string,
  targetId: string | undefined,
): Promise<{ title: string; blocks: Block[] }> {
  const provider = getAIProvider();
  const totalChars = input.sourceExcerpts.reduce((n, s) => n + s.excerpt.length, 0);
  const outcome = await generateMaterial(provider, input, {
    documentChars: totalChars,
    materialCount: 1,
  });
  const result = outcome.final;

  await logAiGeneration({
    organizationId: ctx.organizationId,
    requestedBy: userId,
    provider: result.provider,
    model: result.model,
    tier: result.tier,
    capability: "GenerateMaterial",
    engine: "lesson",
    promptName: materialPromptV1.PROMPT_NAME,
    promptVersion: materialPromptV1.PROMPT_VERSION,
    parameters: {
      kind: input.kind,
      escalated: outcome.escalated,
      attempts: outcome.attempts.length,
    },
    targetType: "material",
    ...(targetId ? { targetId } : {}),
    sourceDocumentIds: input.sourceExcerpts.map((s) => s.sourceDocumentId),
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
    throw new AppError("ai_provider_failed", "Génération du support impossible.");
  }
  return { title: result.data.title, blocks: result.data.blocks };
}

/** Génère un support (blocs) pour une séance et l'ouvre dans l'éditeur. */
export async function generateMaterialAction(
  formData: FormData,
): Promise<ActionResult<{ materialId: string }>> {
  try {
    const parsed = generateMaterialSchema.safeParse({
      sequenceId: formData.get("sequenceId"),
      lessonId: formData.get("lessonId"),
      kind: formData.get("kind"),
    });
    if (!parsed.success) throw new AppError("validation_failed", "Entrée invalide.");
    const { supabase, user } = await requireUser();

    const ctx = await loadSequenceContext(supabase, parsed.data.sequenceId);
    const { input, objectiveIds } = await buildMaterialInput(
      supabase,
      ctx,
      parsed.data.lessonId,
      parsed.data.kind,
    );
    const { title, blocks } = await runGeneration(
      ctx,
      user.id,
      input,
      parsed.data.sequenceId,
      undefined,
    );

    const { data: created, error } = await supabase
      .from("materials")
      .insert({
        organization_id: ctx.organizationId,
        sequence_id: parsed.data.sequenceId,
        lesson_id: parsed.data.lessonId,
        kind: parsed.data.kind,
        title,
        blocks,
        status: "draft",
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error || !created)
      throw new AppError("forbidden", "Création du support refusée.");

    await recordDependencies(
      supabase,
      ctx.organizationId,
      parsed.data.sequenceId,
      parsed.data.lessonId,
      created.id as string,
      objectiveIds,
    );
    await writeAuditLog({
      organizationId: ctx.organizationId,
      actorId: user.id,
      action: "material.generate",
      entityType: "material",
      entityId: created.id as string,
      metadata: { kind: parsed.data.kind },
    });

    revalidatePath(`/sequences/${parsed.data.sequenceId}`);
    return { ok: true, data: { materialId: created.id as string } };
  } catch (error) {
    return toActionError(error);
  }
}

/** Charge un support et vérifie qu'il n'est pas verrouillé (sauf lecture). */
async function loadMaterial(supabase: SupabaseClient, materialId: string) {
  const { data } = await supabase
    .from("materials")
    .select(
      "id, organization_id, sequence_id, lesson_id, kind, title, blocks, status, locked, current_version",
    )
    .eq("id", materialId)
    .maybeSingle();
  if (!data) throw new AppError("not_found", "Support introuvable.");
  return data;
}

/** Autosave : remplace l'état de travail (blocs) du support. */
export async function saveBlocksAction(
  formData: FormData,
): Promise<ActionResult<{ saved: true }>> {
  try {
    const parsed = saveBlocksSchema.safeParse({
      materialId: formData.get("materialId"),
      blocks: formData.get("blocks"),
    });
    if (!parsed.success) throw new AppError("validation_failed", "Entrée invalide.");
    const { supabase } = await requireUser();
    const material = await loadMaterial(supabase, parsed.data.materialId);
    if (material.locked) throw new AppError("forbidden", "Support verrouillé.");

    const { error } = await supabase
      .from("materials")
      .update({ blocks: parsed.data.blocks })
      .eq("id", parsed.data.materialId);
    if (error) throw new AppError("forbidden", "Enregistrement refusé.");
    revalidatePath(`/sequences/${material.sequence_id}/materials/${material.id}`);
    return { ok: true, data: { saved: true } };
  } catch (error) {
    return toActionError(error);
  }
}

/** Édition par intentions : retouche IA d'un bloc ciblé (ADR-0010). */
export async function applyEditIntentAction(
  formData: FormData,
): Promise<ActionResult<{ saved: true }>> {
  try {
    const parsed = editIntentSchema.safeParse({
      materialId: formData.get("materialId"),
      blockId: formData.get("blockId"),
      quickAction: formData.get("quickAction") ?? "",
      instruction: formData.get("instruction") ?? "",
    });
    if (!parsed.success) throw new AppError("validation_failed", "Intention invalide.");
    const { supabase, user } = await requireUser();
    const material = await loadMaterial(supabase, parsed.data.materialId);
    if (material.locked) throw new AppError("forbidden", "Support verrouillé.");

    const ctx = await loadSequenceContext(supabase, material.sequence_id as string);
    const blocks = (material.blocks as Block[]) ?? [];
    const target = blocks.find((b) => b.id === parsed.data.blockId);
    if (!target) throw new AppError("not_found", "Bloc introuvable.");
    if (target.locked) throw new AppError("forbidden", "Bloc verrouillé.");

    const instruction = editIntentToInstruction({
      targetObjectId: parsed.data.blockId,
      ...(parsed.data.quickAction ? { quickAction: parsed.data.quickAction } : {}),
      ...(parsed.data.instruction ? { instruction: parsed.data.instruction } : {}),
    });

    const provider = getAIProvider();
    const outcome = await applyBlockEdit(provider, {
      language: ctx.language,
      subject: ctx.subject,
      gradeLevel: ctx.gradeLevel,
      instruction,
      block: target,
    });
    const result = outcome.final;

    await logAiGeneration({
      organizationId: ctx.organizationId,
      requestedBy: user.id,
      provider: result.provider,
      model: result.model,
      tier: result.tier,
      capability: "EditBlock",
      engine: "lesson",
      promptName: materialEditPromptV1.PROMPT_NAME,
      promptVersion: materialEditPromptV1.PROMPT_VERSION,
      parameters: { blockType: target.type, escalated: outcome.escalated },
      targetType: "material_block",
      targetId: parsed.data.materialId,
      sourceDocumentIds: [],
      rawOutput: result.raw ?? null,
      validatedOutput: result.data ?? null,
      status: result.status,
      ...(result.error ? { error: result.error } : {}),
      durationMs: result.durationMs,
      ...(result.usage ? { usage: result.usage } : {}),
    });

    if (result.status !== "succeeded" || !result.data) {
      throw new AppError("ai_provider_failed", "Retouche impossible.");
    }
    // Le bloc révisé conserve son id ; on préserve aussi son verrou.
    const revised: Block = { ...result.data, id: target.id, locked: target.locked };
    const nextBlocks = blocks.map((b) => (b.id === target.id ? revised : b));

    const { error } = await supabase
      .from("materials")
      .update({ blocks: nextBlocks })
      .eq("id", parsed.data.materialId);
    if (error) throw new AppError("forbidden", "Enregistrement refusé.");
    revalidatePath(`/sequences/${material.sequence_id}/materials/${material.id}`);
    return { ok: true, data: { saved: true } };
  } catch (error) {
    return toActionError(error);
  }
}

/** Verrouille/déverrouille un bloc (barrière de régénération — ADR-0011). */
export async function lockBlockAction(
  formData: FormData,
): Promise<ActionResult<{ saved: true }>> {
  try {
    const parsed = lockBlockSchema.safeParse({
      materialId: formData.get("materialId"),
      blockId: formData.get("blockId"),
      locked: formData.get("locked"),
    });
    if (!parsed.success) throw new AppError("validation_failed", "Entrée invalide.");
    const { supabase } = await requireUser();
    const material = await loadMaterial(supabase, parsed.data.materialId);
    const blocks = (material.blocks as Block[]) ?? [];
    const nextBlocks = blocks.map((b) =>
      b.id === parsed.data.blockId ? { ...b, locked: parsed.data.locked } : b,
    );
    const { error } = await supabase
      .from("materials")
      .update({ blocks: nextBlocks })
      .eq("id", parsed.data.materialId);
    if (error) throw new AppError("forbidden", "Enregistrement refusé.");
    revalidatePath(`/sequences/${material.sequence_id}/materials/${material.id}`);
    return { ok: true, data: { saved: true } };
  } catch (error) {
    return toActionError(error);
  }
}

/** Publie le support : fige un snapshot versionné (append-only) et passe published. */
export async function publishMaterialAction(
  formData: FormData,
): Promise<ActionResult<{ version: number }>> {
  try {
    const parsed = materialIdSchema.safeParse({ materialId: formData.get("materialId") });
    if (!parsed.success) throw new AppError("validation_failed", "Entrée invalide.");
    const { supabase, user } = await requireUser();
    const material = await loadMaterial(supabase, parsed.data.materialId);
    const nextVersion = (material.current_version as number) + 1;

    const { error: vErr } = await supabase.from("material_versions").insert({
      organization_id: material.organization_id,
      material_id: material.id,
      sequence_id: material.sequence_id,
      version_number: nextVersion,
      title: material.title,
      kind: material.kind,
      blocks: material.blocks,
      status: "published",
      created_by: user.id,
    });
    if (vErr) throw new AppError("forbidden", "Publication refusée.");

    const { error } = await supabase
      .from("materials")
      .update({ status: "published", current_version: nextVersion })
      .eq("id", material.id);
    if (error) throw new AppError("forbidden", "Publication refusée.");

    await writeAuditLog({
      organizationId: material.organization_id as string,
      actorId: user.id,
      action: "material.publish",
      entityType: "material",
      entityId: material.id as string,
      metadata: { version: nextVersion },
    });
    revalidatePath(`/sequences/${material.sequence_id}/materials/${material.id}`);
    return { ok: true, data: { version: nextVersion } };
  } catch (error) {
    return toActionError(error);
  }
}

/** Restaure un snapshot : réécrit l'état de travail depuis une version publiée. */
export async function restoreVersionAction(
  formData: FormData,
): Promise<ActionResult<{ restored: true }>> {
  try {
    const parsed = restoreVersionSchema.safeParse({
      materialId: formData.get("materialId"),
      versionNumber: formData.get("versionNumber"),
    });
    if (!parsed.success) throw new AppError("validation_failed", "Entrée invalide.");
    const { supabase } = await requireUser();
    const material = await loadMaterial(supabase, parsed.data.materialId);
    if (material.locked) throw new AppError("forbidden", "Support verrouillé.");

    const { data: version } = await supabase
      .from("material_versions")
      .select("blocks, title")
      .eq("material_id", parsed.data.materialId)
      .eq("version_number", parsed.data.versionNumber)
      .maybeSingle();
    if (!version) throw new AppError("not_found", "Version introuvable.");

    const { error } = await supabase
      .from("materials")
      .update({ blocks: version.blocks, title: version.title, status: "draft" })
      .eq("id", parsed.data.materialId);
    if (error) throw new AppError("forbidden", "Restauration refusée.");
    revalidatePath(`/sequences/${material.sequence_id}/materials/${material.id}`);
    return { ok: true, data: { restored: true } };
  } catch (error) {
    return toActionError(error);
  }
}

/**
 * Régénération partielle (ADR-0011) : à partir d'une séance modifiée, régénère
 * les supports dépendants NON verrouillés via le planificateur pur, en
 * conservant les autres (barrières). Chaque régénération fige d'abord un
 * snapshot de l'état courant (historique).
 */
export async function regenerateLessonMaterialsAction(
  formData: FormData,
): Promise<ActionResult<{ regenerated: number; skippedLocked: number }>> {
  try {
    const parsed = generateMaterialSchema
      .pick({ sequenceId: true, lessonId: true })
      .safeParse({
        sequenceId: formData.get("sequenceId"),
        lessonId: formData.get("lessonId"),
      });
    if (!parsed.success) throw new AppError("validation_failed", "Entrée invalide.");
    const { supabase, user } = await requireUser();
    const ctx = await loadSequenceContext(supabase, parsed.data.sequenceId);

    const { data: deps } = await supabase
      .from("pedagogical_dependencies")
      .select("source_object_id, dependent_object_id")
      .eq("sequence_id", parsed.data.sequenceId);
    const edges: DependencyEdge[] = (deps ?? []).map((d) => ({
      source: d.source_object_id as string,
      dependent: d.dependent_object_id as string,
    }));

    const { data: mats } = await supabase
      .from("materials")
      .select(
        "id, lesson_id, kind, current_version, blocks, title, organization_id, locked",
      )
      .eq("sequence_id", parsed.data.sequenceId);
    const materials = mats ?? [];
    const lockedIds = materials
      .filter((m) => m.locked as boolean)
      .map((m) => m.id as string);

    const plan = planRegeneration(edges, [parsed.data.lessonId], lockedIds);
    const affected = materials.filter((m) => plan.toRegenerate.includes(m.id as string));

    let regenerated = 0;
    for (const m of affected) {
      if (!m.lesson_id) continue;
      // Snapshot de l'état courant avant régénération (historique).
      const nextVersion = (m.current_version as number) + 1;
      await supabase.from("material_versions").insert({
        organization_id: m.organization_id,
        material_id: m.id,
        sequence_id: parsed.data.sequenceId,
        version_number: nextVersion,
        title: m.title,
        kind: m.kind,
        blocks: m.blocks,
        status: "archived",
        label: "avant régénération",
        created_by: user.id,
      });

      const { input } = await buildMaterialInput(
        supabase,
        ctx,
        m.lesson_id as string,
        m.kind as MaterialKind,
      );
      const { title, blocks } = await runGeneration(
        ctx,
        user.id,
        input,
        parsed.data.sequenceId,
        m.id as string,
      );
      await supabase
        .from("materials")
        .update({ blocks, title, status: "draft", current_version: nextVersion })
        .eq("id", m.id);
      regenerated += 1;
    }

    revalidatePath(`/sequences/${parsed.data.sequenceId}`);
    return {
      ok: true,
      data: { regenerated, skippedLocked: plan.skippedLocked.length },
    };
  } catch (error) {
    return toActionError(error);
  }
}

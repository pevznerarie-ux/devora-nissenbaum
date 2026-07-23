"use server";

import {
  AppError,
  isFeatureEnabled,
  toActionError,
  type ActionResult,
} from "@pedagoos/shared";
import {
  BlockSchema,
  classifyBlockForVisual,
  type Block,
  type VisualRequest,
} from "@pedagoos/pedagogy";
import { analyzeVisualNeeds, visualDirectorPromptV1 } from "@pedagoos/ai";
import { createClient } from "@/lib/supabase/server";
import { getAIProvider, logAiGeneration } from "@/lib/ai";
import { recommendVisualSchema } from "./schemas";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AppError("unauthorized", "Session requise.");
  return { supabase, user };
}

/**
 * Analyse le besoin visuel d'un bloc (Visual Director, ADR-0016). Lecture RLS,
 * exécution IA (mock par défaut), aucune persistance à ce stade : la
 * recommandation est proposée au professeur, qui garde la main. Gardé par le
 * feature flag `visual_director`.
 */
export async function recommendVisualForBlockAction(
  formData: FormData,
): Promise<ActionResult<VisualRequest>> {
  try {
    if (!isFeatureEnabled("visual_director")) {
      throw new AppError("forbidden", "Le Visual Director est désactivé.");
    }
    const parsed = recommendVisualSchema.safeParse({
      materialId: formData.get("materialId"),
      blockId: formData.get("blockId"),
    });
    if (!parsed.success) throw new AppError("validation_failed", "Entrée invalide.");
    const { supabase, user } = await requireUser();

    const { data: material } = await supabase
      .from("materials")
      .select("id, organization_id, blocks")
      .eq("id", parsed.data.materialId)
      .maybeSingle();
    if (!material) throw new AppError("not_found", "Support introuvable.");

    const blocks = Array.isArray(material.blocks) ? (material.blocks as unknown[]) : [];
    const rawBlock = blocks.find(
      (b): b is Block =>
        typeof b === "object" &&
        b !== null &&
        (b as { id?: unknown }).id === parsed.data.blockId,
    );
    const block = rawBlock ? BlockSchema.safeParse(rawBlock) : null;
    if (!block || !block.success) throw new AppError("not_found", "Bloc introuvable.");

    const signals = classifyBlockForVisual(block.data);
    const provider = getAIProvider();
    const outcome = await analyzeVisualNeeds(provider, {
      organizationId: material.organization_id as string,
      materialId: material.id as string,
      lessonBlockId: block.data.id,
      concept: signals.concept,
      blockText: signals.concept,
      pedagogicalPurpose: signals.pedagogicalPurpose,
      contentKind: signals.contentKind,
      hasPedagogicalValue: signals.hasPedagogicalValue,
      hasValidatedLibraryAsset: false,
      usedInGradedAssessment: false,
      orientation: "landscape",
    });
    const result = outcome.final;

    await logAiGeneration({
      organizationId: material.organization_id as string,
      requestedBy: user.id,
      provider: result.provider,
      model: result.model,
      tier: result.tier,
      capability: "AnalyzeVisualNeeds",
      engine: "visual_director",
      promptName: visualDirectorPromptV1.PROMPT_NAME,
      promptVersion: visualDirectorPromptV1.PROMPT_VERSION,
      parameters: { blockType: block.data.type, contentKind: signals.contentKind },
      targetType: "visual_request",
      targetId: material.id as string,
      sourceDocumentIds: [],
      rawOutput: result.raw ?? null,
      validatedOutput: result.data ?? null,
      status: result.status,
      ...(result.error ? { error: result.error } : {}),
      durationMs: result.durationMs,
      ...(result.usage ? { usage: result.usage } : {}),
    });

    if (result.status !== "succeeded" || !result.data) {
      throw new AppError("ai_provider_failed", "Analyse visuelle impossible.");
    }
    return { ok: true, data: result.data };
  } catch (error) {
    return toActionError(error);
  }
}

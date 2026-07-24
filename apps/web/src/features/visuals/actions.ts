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
import { analyzeVisualNeeds, designDiagram, visualDirectorPromptV1 } from "@pedagoos/ai";
import type {
  DiagramSpecification,
  DiagramType,
  RecommendedVisualType,
} from "@pedagoos/pedagogy";
import { createClient } from "@/lib/supabase/server";
import { getAIProvider, logAiGeneration } from "@/lib/ai";
import { previewDiagramSchema, recommendVisualSchema } from "./schemas";

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

/** Type de schéma déterminé par le type de visuel recommandé (Diagram Engine). */
function diagramTypeFor(recommended: RecommendedVisualType): DiagramType | null {
  switch (recommended) {
    case "vector_diagram":
      return "process";
    case "timeline":
      return "timeline";
    case "chart":
      return "bar_chart";
    case "map":
      return "simple_map";
    default:
      return null;
  }
}

/**
 * Prévisualise un schéma SVG pour un bloc (Diagram Engine, ADR-0016). Produit une
 * DiagramSpecification (rendu déterministe côté client). Pour une frise, agrège
 * les étapes chronologiques réelles du support. Gardé par le flag `diagrams`.
 */
export async function previewDiagramAction(
  formData: FormData,
): Promise<ActionResult<DiagramSpecification>> {
  try {
    if (!isFeatureEnabled("diagrams")) {
      throw new AppError("forbidden", "Le Diagram Engine est désactivé.");
    }
    const parsed = previewDiagramSchema.safeParse({
      materialId: formData.get("materialId"),
      blockId: formData.get("blockId"),
      recommendedType: formData.get("recommendedType"),
    });
    if (!parsed.success) throw new AppError("validation_failed", "Entrée invalide.");
    const { supabase } = await requireUser();

    const type = diagramTypeFor(parsed.data.recommendedType);
    if (type === null)
      throw new AppError("validation_failed", "Ce bloc n'appelle pas un schéma.");

    const { data: material } = await supabase
      .from("materials")
      .select("id, blocks")
      .eq("id", parsed.data.materialId)
      .maybeSingle();
    if (!material) throw new AppError("not_found", "Support introuvable.");

    const blocks = (Array.isArray(material.blocks) ? material.blocks : []) as unknown[];
    const rawBlock = blocks.find(
      (b): b is Block =>
        typeof b === "object" &&
        b !== null &&
        (b as { id?: unknown }).id === parsed.data.blockId,
    );
    const parsedBlock = rawBlock ? BlockSchema.safeParse(rawBlock) : null;
    if (!parsedBlock || !parsedBlock.success)
      throw new AppError("not_found", "Bloc introuvable.");

    const signals = classifyBlockForVisual(parsedBlock.data);

    // Frise : agrège les vraies étapes chronologiques du support.
    let items = [signals.concept];
    if (type === "timeline") {
      const steps = blocks
        .map((b) => (b && BlockSchema.safeParse(b).success ? BlockSchema.parse(b) : null))
        .filter((b): b is Block => b?.type === "timeline_step")
        .map((b) => (b.type === "timeline_step" ? b.title : ""))
        .filter((t) => t.length > 0);
      if (steps.length >= 2) items = steps;
    }

    const provider = getAIProvider();
    const outcome = await designDiagram(provider, {
      type,
      title: signals.concept,
      concept: signals.concept,
      language: "fr",
      items,
      values: [],
    });
    if (outcome.final.status !== "succeeded" || !outcome.final.data) {
      throw new AppError("ai_provider_failed", "Schéma impossible.");
    }
    return { ok: true, data: outcome.final.data };
  } catch (error) {
    return toActionError(error);
  }
}

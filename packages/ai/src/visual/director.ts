import { z } from "zod";
import {
  ContentKindSchema,
  ContentLanguageSchema,
  PedagogicalPurposeSchema,
  VisualOrientationSchema,
  VisualRequestSchema,
  type VisualRequest,
} from "@pedagoos/pedagogy";
import type { AIProvider } from "../provider";
import { chooseTier, type RoutingSignals } from "../router";
import { generateWithEscalation, type EscalationOutcome } from "../engine";
import { CAPABILITY_BASELINE } from "../capabilities";
import * as visualDirectorPromptV1 from "../prompts/visual-director/v1";

/**
 * Entrée du Visual Director (ADR-0016) pour UN bloc pédagogique. Les règles
 * déterministes (packages/pedagogy) tranchent les cas clairs ; le Director ne
 * décide que l'ambigu et enrichit le VisualRequest (légende, alt, requêtes).
 */
export const VisualDirectorInputSchema = z.object({
  organizationId: z.uuid(),
  materialId: z.uuid().optional(),
  lessonBlockId: z.uuid().optional(),
  concept: z.string().min(1),
  blockText: z.string().default(""),
  pedagogicalPurpose: PedagogicalPurposeSchema.optional(),
  /** Classification éventuelle du concept (sinon le Director tranche). */
  contentKind: ContentKindSchema.optional(),
  hasPedagogicalValue: z.boolean().default(true),
  hasValidatedLibraryAsset: z.boolean().default(false),
  usedInGradedAssessment: z.boolean().default(false),
  targetAge: z.number().int().min(3).max(20).optional(),
  schoolLevel: z.string().optional(),
  subject: z.string().optional(),
  language: ContentLanguageSchema.optional(),
  orientation: VisualOrientationSchema.default("landscape"),
});
export type VisualDirectorInput = z.infer<typeof VisualDirectorInputSchema>;

/**
 * Capacité « analyse des besoins visuels d'un bloc » (Visual Director, ADR-0016).
 * Produit un VisualRequest validé. Câblée prompt versionné → routeur → escalade ;
 * le MockAIProvider applique les règles déterministes hors ligne.
 */
export async function analyzeVisualNeeds(
  provider: AIProvider,
  input: VisualDirectorInput,
  signals: RoutingSignals = {},
): Promise<EscalationOutcome<VisualRequest>> {
  const parsed = VisualDirectorInputSchema.parse(input);
  const tier = chooseTier(CAPABILITY_BASELINE.AnalyzeVisualNeeds, signals);

  return generateWithEscalation<VisualRequest>(
    provider,
    {
      schema: VisualRequestSchema,
      promptName: visualDirectorPromptV1.PROMPT_NAME,
      promptVersion: visualDirectorPromptV1.PROMPT_VERSION,
      system: visualDirectorPromptV1.buildSystemPrompt(),
      user: visualDirectorPromptV1.buildUserPrompt(parsed),
      modelTier: tier,
      context: parsed,
    },
    { startTier: tier },
  );
}

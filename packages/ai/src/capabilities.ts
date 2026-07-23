import type { LessonSequence } from "@pedagoos/pedagogy";
import { LessonSequenceSchema } from "@pedagoos/pedagogy";
import type { AIProvider, ModelTier } from "./provider";
import { chooseTier, type RoutingSignals } from "./router";
import { generateWithEscalation, type EscalationOutcome } from "./engine";
import {
  SequenceStructureInputSchema,
  type SequenceStructureInput,
} from "./sequence-structure";
import * as sequenceStructurePromptV1 from "./prompts/sequence-structure/v1";

/**
 * Surface publique par CAPACITÉ (ADR-0014). Le code métier appelle une capacité
 * et fournit des signaux ; le niveau de base + le routeur choisissent le modèle,
 * et l'exécution suit l'échelle d'escalade. Aucun identifiant de modèle ici.
 */
export type Capability =
  | "GenerateSequenceStructure"
  | "GenerateLesson"
  | "GenerateTeacherGuide"
  | "GenerateStudentHandout"
  | "GenerateSlides"
  | "GenerateAssessment"
  | "Differentiate"
  | "Translate"
  | "Extract"
  | "Summarize"
  | "Classify"
  | "GenerateVariants"
  | "ReviewLesson"
  | "QualityAudit"
  | "GenerateAnnualCurriculum"
  | "GenerateIllustrationSpecification";

/** Niveau de base par capacité (config — ADR-0014 §2). */
export const CAPABILITY_BASELINE: Record<Capability, ModelTier> = {
  GenerateSequenceStructure: "standard",
  GenerateLesson: "standard",
  GenerateTeacherGuide: "standard",
  GenerateStudentHandout: "standard",
  GenerateSlides: "standard",
  GenerateAssessment: "standard",
  Differentiate: "standard",
  Translate: "economy",
  Extract: "economy",
  Summarize: "economy",
  Classify: "economy",
  GenerateVariants: "economy",
  ReviewLesson: "standard",
  QualityAudit: "premium",
  GenerateAnnualCurriculum: "premium",
  GenerateIllustrationSpecification: "standard",
};

/**
 * Capacité « proposition de structure de séquence » (le Blueprint, ADR-0010).
 * Câblée de bout en bout : prompt versionné → routeur → escalade.
 */
export async function generateSequenceStructure(
  provider: AIProvider,
  input: SequenceStructureInput,
  signals: RoutingSignals = {},
): Promise<EscalationOutcome<LessonSequence>> {
  const parsed = SequenceStructureInputSchema.parse(input);
  const tier = chooseTier(CAPABILITY_BASELINE.GenerateSequenceStructure, signals);

  return generateWithEscalation<LessonSequence>(
    provider,
    {
      schema: LessonSequenceSchema,
      promptName: sequenceStructurePromptV1.PROMPT_NAME,
      promptVersion: sequenceStructurePromptV1.PROMPT_VERSION,
      system: sequenceStructurePromptV1.buildSystemPrompt(),
      user: sequenceStructurePromptV1.buildUserPrompt(parsed),
      modelTier: tier,
      context: parsed,
    },
    { startTier: tier },
  );
}

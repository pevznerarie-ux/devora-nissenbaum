import type {
  Block,
  LessonSequence,
  MaterialContent,
  MaterialKind,
} from "@pedagoos/pedagogy";
import {
  BlockSchema,
  LessonSequenceSchema,
  MaterialContentSchema,
} from "@pedagoos/pedagogy";
import type { AIProvider, ModelTier } from "./provider";
import { chooseTier, type RoutingSignals } from "./router";
import { generateWithEscalation, type EscalationOutcome } from "./engine";
import {
  SequenceStructureInputSchema,
  type SequenceStructureInput,
} from "./sequence-structure";
import {
  MaterialEditInputSchema,
  MaterialGenerationInputSchema,
  type MaterialEditInput,
  type MaterialGenerationInput,
} from "./material";
import * as sequenceStructurePromptV1 from "./prompts/sequence-structure/v1";
import * as materialPromptV1 from "./prompts/material/v1";
import * as materialEditPromptV1 from "./prompts/material-edit/v1";

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
  | "GenerateIllustrationSpecification"
  | "EditBlock";

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
  EditBlock: "economy",
};

/** Capacité de génération de support en fonction du type (ADR-0014). */
const MATERIAL_KIND_CAPABILITY: Record<MaterialKind, Capability> = {
  teacher_guide: "GenerateTeacherGuide",
  student_handout: "GenerateStudentHandout",
  presentation: "GenerateSlides",
  exercise_set: "GenerateStudentHandout",
  assessment: "GenerateAssessment",
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

/**
 * Capacité « génération d'un support par blocs » (Phase 8, ADR-0005). Le type
 * de support choisit le niveau de base ; la sortie est un `MaterialContent`
 * validé (blocs typés). Câblée prompt versionné → routeur → escalade.
 */
export async function generateMaterial(
  provider: AIProvider,
  input: MaterialGenerationInput,
  signals: RoutingSignals = {},
): Promise<EscalationOutcome<MaterialContent>> {
  const parsed = MaterialGenerationInputSchema.parse(input);
  const baseline = CAPABILITY_BASELINE[MATERIAL_KIND_CAPABILITY[parsed.kind]];
  const tier = chooseTier(baseline, signals);

  return generateWithEscalation<MaterialContent>(
    provider,
    {
      schema: MaterialContentSchema,
      promptName: materialPromptV1.PROMPT_NAME,
      promptVersion: materialPromptV1.PROMPT_VERSION,
      system: materialPromptV1.buildSystemPrompt(parsed.kind),
      user: materialPromptV1.buildUserPrompt(parsed),
      modelTier: tier,
      context: parsed,
    },
    { startTier: tier },
  );
}

/**
 * Capacité « retouche d'un bloc » (édition par intentions, ADR-0010). Révise UN
 * bloc selon une instruction ; le bloc conserve son `id` et son `type`.
 */
export async function applyBlockEdit(
  provider: AIProvider,
  input: MaterialEditInput,
  signals: RoutingSignals = {},
): Promise<EscalationOutcome<Block>> {
  const parsed = MaterialEditInputSchema.parse(input);
  const tier = chooseTier(CAPABILITY_BASELINE.EditBlock, signals);

  return generateWithEscalation<Block>(
    provider,
    {
      schema: BlockSchema,
      promptName: materialEditPromptV1.PROMPT_NAME,
      promptVersion: materialEditPromptV1.PROMPT_VERSION,
      system: materialEditPromptV1.buildSystemPrompt(),
      user: materialEditPromptV1.buildUserPrompt(parsed),
      modelTier: tier,
      context: parsed,
    },
    { startTier: tier },
  );
}

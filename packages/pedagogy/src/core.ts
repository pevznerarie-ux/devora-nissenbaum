import { z } from "zod";

/**
 * Modèle pédagogique — briques de base (ADR-0005).
 * Package pur : aucune dépendance à la base, à Next.js ou à un fournisseur IA.
 * Ces schémas sont LE contrat entre l'IA, l'éditeur, la base et les exports.
 */

export const uuid = z.uuid();

/** Langue d'un contenu pédagogique (indépendante de la locale UI — ADR-0008). */
export const ContentLanguageSchema = z.enum(["fr", "en", "he"]);
export type ContentLanguage = z.infer<typeof ContentLanguageSchema>;

/**
 * Statut épistémique d'une affirmation produite par l'IA (CLAUDE.md §6.7) :
 * jamais une hypothèse présentée comme un fait.
 */
export const EpistemicStatusSchema = z.enum([
  "fact",
  "interpretation",
  "pedagogical_proposal",
  "uncertain",
]);
export type EpistemicStatus = z.infer<typeof EpistemicStatusSchema>;

/** Référence à une source réelle de la bibliothèque — jamais inventée. */
export const SourceCitationSchema = z.object({
  sourceDocumentId: uuid,
  /** Localisation dans la source (page, chapitre…). */
  locator: z.string().min(1).optional(),
  /** Extrait court justifiant l'usage (pas de reproduction longue). */
  excerpt: z.string().min(1).max(500).optional(),
});
export type SourceCitation = z.infer<typeof SourceCitationSchema>;

export const BloomLevelSchema = z.enum([
  "remember",
  "understand",
  "apply",
  "analyze",
  "evaluate",
  "create",
]);
export type BloomLevel = z.infer<typeof BloomLevelSchema>;

export const CompetencySchema = z.object({
  id: uuid,
  code: z.string().min(1).optional(),
  label: z.string().min(1),
  description: z.string().optional(),
  parentId: uuid.optional(),
});
export type Competency = z.infer<typeof CompetencySchema>;

export const LearningObjectiveSchema = z.object({
  id: uuid,
  title: z.string().min(1),
  description: z.string().optional(),
  bloomLevel: BloomLevelSchema,
  competencyIds: z.array(uuid).default([]),
  citations: z.array(SourceCitationSchema).default([]),
});
export type LearningObjective = z.infer<typeof LearningObjectiveSchema>;

export const PrerequisiteSchema = z.object({
  id: uuid,
  label: z.string().min(1),
  description: z.string().optional(),
  /** Comment vérifier rapidement que le prérequis est acquis. */
  checkSuggestion: z.string().optional(),
});
export type Prerequisite = z.infer<typeof PrerequisiteSchema>;

/** Erreur fréquente / conception erronée à anticiper. */
export const MisconceptionSchema = z.object({
  id: uuid,
  description: z.string().min(1),
  whyItHappens: z.string().optional(),
  remediationHint: z.string().optional(),
  objectiveIds: z.array(uuid).default([]),
});
export type Misconception = z.infer<typeof MisconceptionSchema>;

export const DifferentiationStrategySchema = z.object({
  id: uuid,
  /** Public visé : soutien, standard, approfondissement… */
  audience: z.enum(["support", "standard", "advanced"]),
  description: z.string().min(1),
  objectiveIds: z.array(uuid).default([]),
});
export type DifferentiationStrategy = z.infer<typeof DifferentiationStrategySchema>;

export const RemediationPlanSchema = z.object({
  id: uuid,
  objectiveId: uuid,
  trigger: z.string().min(1),
  steps: z.array(z.string().min(1)).min(1),
  exerciseIds: z.array(uuid).default([]),
});
export type RemediationPlan = z.infer<typeof RemediationPlanSchema>;

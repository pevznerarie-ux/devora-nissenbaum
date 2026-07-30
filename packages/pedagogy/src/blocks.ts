import { z } from "zod";
import { EpistemicStatusSchema, SourceCitationSchema, uuid } from "./core";
import { ExerciseCategorySchema } from "./assessment";

/**
 * Blocs pédagogiques typés (ADR-0005) — LE contrat entre l'IA, l'éditeur, la
 * base (`material_versions.blocks` jsonb) et les exports. Package pur : aucune
 * dépendance à la base, à Next.js ou à un fournisseur IA.
 *
 * Chaque bloc porte `audience` (teacher/student/both) et `answerKey` : les
 * variantes d'export (support élève sans corrigé, fiche professeur avec
 * corrigé, présentation…) sont un simple filtrage, jamais une re-génération.
 */

/** Type des supports produits pour une séance (ADR-0010). */
export const MaterialKindSchema = z.enum([
  "teacher_guide",
  "student_handout",
  "presentation",
  "exercise_set",
  "assessment",
]);
export type MaterialKind = z.infer<typeof MaterialKindSchema>;

/** À qui s'adresse un bloc — pilote le filtrage des variantes d'export. */
export const BlockAudienceSchema = z.enum(["teacher", "student", "both"]);
export type BlockAudience = z.infer<typeof BlockAudienceSchema>;

/** Type discriminant d'un bloc (sous-ensemble ADR-0005). */
export const BlockTypeSchema = z.enum([
  "objectives",
  "vocabulary",
  "timeline_step",
  "explanation",
  "example",
  "discussion_question",
  "expected_answer",
  "misconception",
  "differentiation",
  "summary",
  "exercise",
  "assessment_question",
  "document_ref",
  "answer_space",
  "slide",
]);
export type BlockType = z.infer<typeof BlockTypeSchema>;

/**
 * Champs communs à tout bloc. `answerKey` marque un contenu de correction
 * (réponse attendue, barème) exclu des variantes élève ; `audience` restreint
 * l'export au bon public.
 */
/**
 * Illustration attachée à un bloc : référence (source citée, licence) plus que
 * l'image elle-même. Choisie par le professeur (recherche libre, schéma ou
 * import), elle reste liée au bloc, suit le versionnement du support et ressort
 * à l'export. Le crédit (licence/auteur) est conservé pour l'affichage.
 */
export const BlockIllustrationSchema = z.object({
  kind: z.enum(["search", "diagram", "upload"]).default("search"),
  previewUrl: z.string().min(1),
  fileUrl: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().optional(),
  author: z.string().optional(),
  sourceName: z.string().optional(),
  sourceUrl: z.string().optional(),
  licenseName: z.string().optional(),
  licenseUrl: z.string().optional(),
  isPublicDomain: z.boolean().default(false),
  attributionRequired: z.boolean().default(true),
  /** Identifiant chez le fournisseur (déduplication, retour à la source). */
  providerId: z.string().optional(),
});
export type BlockIllustration = z.infer<typeof BlockIllustrationSchema>;

const blockCommon = {
  id: uuid,
  audience: BlockAudienceSchema.default("both"),
  answerKey: z.boolean().default(false),
  /** Objectifs visés par ce bloc — traçabilité et régénération partielle. */
  objectiveIds: z.array(uuid).default([]),
  /** Verrou d'édition : un bloc verrouillé n'est jamais régénéré (ADR-0011). */
  locked: z.boolean().default(false),
  /** Illustration choisie par le professeur (optionnelle). */
  illustration: BlockIllustrationSchema.optional(),
};

// -------------------------------------------------------------- blocs typés

export const ObjectivesBlockSchema = z.object({
  ...blockCommon,
  type: z.literal("objectives"),
  items: z.array(z.object({ objectiveId: uuid, label: z.string().min(1) })).min(1),
});

export const VocabularyBlockSchema = z.object({
  ...blockCommon,
  type: z.literal("vocabulary"),
  terms: z
    .array(
      z.object({
        term: z.string().min(1),
        definition: z.string().min(1),
        citations: z.array(SourceCitationSchema).default([]),
      }),
    )
    .min(1),
});

export const TimelineStepBlockSchema = z.object({
  ...blockCommon,
  type: z.literal("timeline_step"),
  index: z.number().int().min(0),
  title: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  teacherNote: z.string().optional(),
  studentNote: z.string().optional(),
});

export const ExplanationBlockSchema = z.object({
  ...blockCommon,
  type: z.literal("explanation"),
  title: z.string().optional(),
  /** Texte à mise en forme restreinte (gras/italique/listes) — ADR-0005. */
  body: z.string().min(1),
  epistemic: EpistemicStatusSchema.default("fact"),
  citations: z.array(SourceCitationSchema).default([]),
});

export const ExampleBlockSchema = z.object({
  ...blockCommon,
  type: z.literal("example"),
  prompt: z.string().min(1),
  worked: z.string().min(1),
  citations: z.array(SourceCitationSchema).default([]),
});

export const DiscussionQuestionBlockSchema = z.object({
  ...blockCommon,
  type: z.literal("discussion_question"),
  question: z.string().min(1),
  expectedAnswer: z.string().optional(),
});

export const ExpectedAnswerBlockSchema = z.object({
  ...blockCommon,
  type: z.literal("expected_answer"),
  answer: z.string().min(1),
  acceptableVariations: z.array(z.string().min(1)).default([]),
  epistemic: EpistemicStatusSchema.default("fact"),
  citations: z.array(SourceCitationSchema).default([]),
});

export const MisconceptionBlockSchema = z.object({
  ...blockCommon,
  type: z.literal("misconception"),
  description: z.string().min(1),
  whyItHappens: z.string().optional(),
  remediationHint: z.string().optional(),
});

export const DifferentiationBlockSchema = z.object({
  ...blockCommon,
  type: z.literal("differentiation"),
  level: z.enum(["support", "standard", "advanced"]),
  description: z.string().min(1),
});

export const SummaryBlockSchema = z.object({
  ...blockCommon,
  type: z.literal("summary"),
  points: z.array(z.string().min(1)).min(1),
});

export const ExerciseBlockSchema = z.object({
  ...blockCommon,
  type: z.literal("exercise"),
  title: z.string().min(1),
  category: ExerciseCategorySchema,
  difficulty: z.number().int().min(1).max(5),
  statement: z.string().min(1),
  /** Réponse attendue : bloc marqué `answerKey` à l'export élève. */
  expectedAnswer: z.string().optional(),
  citations: z.array(SourceCitationSchema).default([]),
});

export const AssessmentQuestionBlockSchema = z.object({
  ...blockCommon,
  type: z.literal("assessment_question"),
  orderIndex: z.number().int().min(0),
  statement: z.string().min(1),
  points: z.number().positive(),
  difficulty: z.number().int().min(1).max(5),
  expectedAnswer: z.string().min(1),
  gradingCriteria: z.array(z.string().min(1)).default([]),
});

export const DocumentRefBlockSchema = z.object({
  ...blockCommon,
  type: z.literal("document_ref"),
  sourceDocumentId: uuid,
  locator: z.string().min(1).optional(),
  note: z.string().optional(),
});

export const AnswerSpaceBlockSchema = z.object({
  ...blockCommon,
  type: z.literal("answer_space"),
  label: z.string().optional(),
  lines: z.number().int().min(1).max(60).default(3),
});

export const SlideBlockSchema = z.object({
  ...blockCommon,
  type: z.literal("slide"),
  title: z.string().min(1),
  bullets: z.array(z.string().min(1)).default([]),
  speakerNotes: z.string().optional(),
});

/** Union discriminée de tous les blocs — persistée dans `material_versions.blocks`. */
export const BlockSchema = z.discriminatedUnion("type", [
  ObjectivesBlockSchema,
  VocabularyBlockSchema,
  TimelineStepBlockSchema,
  ExplanationBlockSchema,
  ExampleBlockSchema,
  DiscussionQuestionBlockSchema,
  ExpectedAnswerBlockSchema,
  MisconceptionBlockSchema,
  DifferentiationBlockSchema,
  SummaryBlockSchema,
  ExerciseBlockSchema,
  AssessmentQuestionBlockSchema,
  DocumentRefBlockSchema,
  AnswerSpaceBlockSchema,
  SlideBlockSchema,
]);
export type Block = z.infer<typeof BlockSchema>;

/** Contenu d'un support : liste ordonnée de blocs + métadonnées de génération. */
export const MaterialContentSchema = z.object({
  kind: MaterialKindSchema,
  title: z.string().min(1),
  blocks: z.array(BlockSchema).default([]),
  /** Citations globales du support (les blocs peuvent en porter d'autres). */
  citations: z.array(SourceCitationSchema).default([]),
  notes: z.string().optional(),
});
export type MaterialContent = z.infer<typeof MaterialContentSchema>;

// ----------------------------------------------------- variantes d'export

/** Paramètres d'une variante d'export (ADR-0005 : filtrage, pas de régénération). */
export interface ExportVariant {
  /** Public de la variante : élève ne voit jamais les blocs `teacher`. */
  audience: "teacher" | "student";
  /** Inclure les blocs de correction (`answerKey`). Élève : false par défaut. */
  includeAnswerKey: boolean;
}

/**
 * Un bloc est-il visible pour un public donné ? Le professeur voit tout (il a
 * besoin du support élève dans sa fiche) ; l'élève ne voit jamais un bloc
 * réservé au professeur (`teacher`).
 */
function isVisibleTo(block: Block, audience: ExportVariant["audience"]): boolean {
  if (audience === "teacher") return true;
  return block.audience !== "teacher";
}

/**
 * Filtre les blocs pour une variante d'export. La correction n'apparaît que si
 * `includeAnswerKey` est vrai ; un public élève ne voit jamais un bloc réservé
 * au professeur. Fonction pure, base du sous-système d'export (Phase 9).
 */
export function filterBlocksForVariant(
  blocks: readonly Block[],
  variant: ExportVariant,
): Block[] {
  return blocks.filter((block) => {
    if (!isVisibleTo(block, variant.audience)) return false;
    if (block.answerKey && !variant.includeAnswerKey) return false;
    return true;
  });
}

/** Variante canonique « support élève » (sans corrigé, sans blocs professeur). */
export const STUDENT_VARIANT: ExportVariant = {
  audience: "student",
  includeAnswerKey: false,
};

/** Variante canonique « fiche professeur » (tout, corrigé inclus). */
export const TEACHER_VARIANT: ExportVariant = {
  audience: "teacher",
  includeAnswerKey: true,
};

// -------------------------------------------------- manipulations d'édition

/**
 * Déplace le bloc `blockId` à l'index `toIndex` (réordonnancement de l'éditeur).
 * Retourne un nouveau tableau ; l'entrée n'est pas mutée. Index hors bornes
 * borné à [0, n-1]. Bloc introuvable : tableau inchangé (copie).
 */
export function reorderBlocks(
  blocks: readonly Block[],
  blockId: string,
  toIndex: number,
): Block[] {
  const from = blocks.findIndex((b) => b.id === blockId);
  if (from === -1) return [...blocks];
  const next = [...blocks];
  const [moved] = next.splice(from, 1);
  if (!moved) return next;
  const clamped = Math.max(0, Math.min(toIndex, next.length));
  next.splice(clamped, 0, moved);
  return next;
}

import { z } from "zod";
import { ExpectedAnswerSchema, SourceCitationSchema, uuid } from "./sequence-deps";

export const ExerciseCategorySchema = z.enum([
  "memorization",
  "comprehension",
  "application",
  "analysis",
  "extension",
  "remediation",
]);
export type ExerciseCategory = z.infer<typeof ExerciseCategorySchema>;

export const ExerciseSchema = z.object({
  id: uuid,
  title: z.string().min(1),
  category: ExerciseCategorySchema,
  /** 1 (facile) → 5 (difficile). */
  difficulty: z.number().int().min(1).max(5),
  statement: z.string().min(1),
  expectedAnswer: ExpectedAnswerSchema.optional(),
  objectiveIds: z.array(uuid).min(1),
  citations: z.array(SourceCitationSchema).default([]),
});
export type Exercise = z.infer<typeof ExerciseSchema>;

/** Critère de barème : niveaux de maîtrise et points associés. */
export const RubricSchema = z.object({
  id: uuid,
  title: z.string().min(1),
  criteria: z
    .array(
      z.object({
        id: uuid,
        label: z.string().min(1),
        levels: z
          .array(
            z.object({
              label: z.string().min(1),
              description: z.string().optional(),
              points: z.number().min(0),
            }),
          )
          .min(2),
      }),
    )
    .min(1),
});
export type Rubric = z.infer<typeof RubricSchema>;

export const AssessmentQuestionSchema = z.object({
  id: uuid,
  orderIndex: z.number().int().min(0),
  statement: z.string().min(1),
  objectiveId: uuid,
  competencyIds: z.array(uuid).default([]),
  difficulty: z.number().int().min(1).max(5),
  points: z.number().positive(),
  expectedAnswer: ExpectedAnswerSchema,
  gradingCriteria: z.array(z.string().min(1)).default([]),
  rubricId: uuid.optional(),
});
export type AssessmentQuestion = z.infer<typeof AssessmentQuestionSchema>;

export const AssessmentSchema = z.object({
  id: uuid,
  title: z.string().min(1),
  instructions: z.string().optional(),
  questions: z.array(AssessmentQuestionSchema).min(1),
  rubrics: z.array(RubricSchema).default([]),
  /** Corrigé professeur : dérivé des expectedAnswer + critères, jamais séparé. */
  totalPoints: z.number().positive(),
});
export type Assessment = z.infer<typeof AssessmentSchema>;

/**
 * Alignement cours ↔ évaluation : toute question doit viser un objectif de la
 * séquence ; le total des points doit correspondre à la somme des questions.
 */
export function validateAssessmentAlignment(
  assessment: Assessment,
  declaredObjectiveIds: readonly string[],
): { misalignedQuestionIds: string[]; pointsMismatch: boolean } {
  const declared = new Set(declaredObjectiveIds);
  const misalignedQuestionIds = assessment.questions
    .filter((q) => !declared.has(q.objectiveId))
    .map((q) => q.id);
  const sum = assessment.questions.reduce((acc, q) => acc + q.points, 0);
  return {
    misalignedQuestionIds,
    pointsMismatch: Math.abs(sum - assessment.totalPoints) > 1e-9,
  };
}

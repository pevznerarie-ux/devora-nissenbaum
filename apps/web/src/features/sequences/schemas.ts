import { z } from "zod";
import { GRADE_LEVELS, LOCALES, type GradeLevel, type Locale } from "@pedagoos/shared";

/** Étape 1 — cadre de la séquence (colonnes de lesson_sequences). */
export const createSequenceSchema = z.object({
  organizationId: z.uuid(),
  classId: z.uuid(),
  subjectId: z
    .uuid()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  theme: z.string().trim().min(1).max(200),
  gradeLevel: z.enum(GRADE_LEVELS as readonly [GradeLevel, ...GradeLevel[]]),
  language: z.enum(LOCALES as readonly [Locale, ...Locale[]]),
  sessionCount: z.coerce.number().int().min(1).max(20),
  sessionDurationMinutes: z.coerce.number().int().min(15).max(240),
  difficulty: z.enum(["easier", "standard", "harder"]),
});

/** Découpe un textarea (une entrée par ligne) en tableau borné. */
const linesToArray = (max: number) =>
  z
    .string()
    .max(4000)
    .transform((value) =>
      value
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .slice(0, max),
    );

/** Étapes 2 & 3 — intentions et sources, stockées dans wizard_state. */
export const wizardStateSchema = z.object({
  desiredObjectives: z.array(z.string()).default([]),
  prerequisites: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]),
  learningType: z.string().max(200).optional(),
  differentiation: z.string().max(500).optional(),
  sourceIds: z.array(z.uuid()).default([]),
});
export type WizardState = z.infer<typeof wizardStateSchema>;

export const saveIntentionsSchema = z.object({
  sequenceId: z.uuid(),
  desiredObjectives: linesToArray(20),
  prerequisites: linesToArray(20),
  constraints: linesToArray(20),
  learningType: z.string().trim().max(200).optional(),
  differentiation: z.string().trim().max(500).optional(),
});

export const saveSourcesSchema = z.object({
  sequenceId: z.uuid(),
  sourceIds: z.array(z.uuid()).max(50).default([]),
});

export const sequenceIdSchema = z.object({ sequenceId: z.uuid() });

export const updateObjectiveSchema = z.object({
  sequenceId: z.uuid(),
  objectiveId: z.uuid(),
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(1000).optional(),
  bloomLevel: z.enum([
    "remember",
    "understand",
    "apply",
    "analyze",
    "evaluate",
    "create",
  ]),
});

export const updateLessonSchema = z.object({
  sequenceId: z.uuid(),
  lessonId: z.uuid(),
  title: z.string().trim().min(1).max(300),
  summary: z.string().trim().max(1000).optional(),
});

export const lessonMoveSchema = z.object({
  sequenceId: z.uuid(),
  lessonId: z.uuid(),
  direction: z.enum(["up", "down"]),
});

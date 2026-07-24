import { z } from "zod";
import {
  ContentLanguageSchema,
  EpistemicStatusSchema,
  LearningObjectiveSchema,
  MisconceptionSchema,
  PrerequisiteSchema,
  SourceCitationSchema,
  uuid,
} from "./core";

/** Consigne destinée au professeur (fiche professeur). */
export const TeacherInstructionSchema = z.object({
  id: uuid,
  text: z.string().min(1),
  epistemic: EpistemicStatusSchema.default("pedagogical_proposal"),
  citations: z.array(SourceCitationSchema).default([]),
});
export type TeacherInstruction = z.infer<typeof TeacherInstructionSchema>;

/** Consigne destinée à l'élève (support élève). */
export const StudentInstructionSchema = z.object({
  id: uuid,
  text: z.string().min(1),
});
export type StudentInstruction = z.infer<typeof StudentInstructionSchema>;

export const ExpectedAnswerSchema = z.object({
  id: uuid,
  text: z.string().min(1),
  /** Éléments acceptables / partiels pour guider la correction. */
  acceptableVariations: z.array(z.string().min(1)).default([]),
  epistemic: EpistemicStatusSchema.default("fact"),
  citations: z.array(SourceCitationSchema).default([]),
});
export type ExpectedAnswer = z.infer<typeof ExpectedAnswerSchema>;

export const DiscussionQuestionSchema = z.object({
  id: uuid,
  question: z.string().min(1),
  expectedAnswer: ExpectedAnswerSchema.optional(),
  objectiveIds: z.array(uuid).default([]),
});
export type DiscussionQuestion = z.infer<typeof DiscussionQuestionSchema>;

export const ActivitySchema = z.object({
  id: uuid,
  title: z.string().min(1),
  kind: z.enum(["individual", "pair", "group", "whole_class"]),
  durationMinutes: z.number().int().positive(),
  teacherInstructions: z.array(TeacherInstructionSchema).default([]),
  studentInstructions: z.array(StudentInstructionSchema).default([]),
  materials: z.array(z.string().min(1)).default([]),
  objectiveIds: z.array(uuid).default([]),
});
export type Activity = z.infer<typeof ActivitySchema>;

/** Phase d'une séance : le déroulé minute par minute est une suite de phases. */
export const LessonPhaseSchema = z.object({
  id: uuid,
  title: z.string().min(1),
  kind: z.enum([
    "warmup",
    "recall",
    "instruction",
    "guided_practice",
    "independent_practice",
    "discussion",
    "synthesis",
    "assessment",
    "homework_briefing",
  ]),
  startMinute: z.number().int().min(0),
  durationMinutes: z.number().int().positive(),
  teacherInstructions: z.array(TeacherInstructionSchema).default([]),
  studentInstructions: z.array(StudentInstructionSchema).default([]),
  discussionQuestions: z.array(DiscussionQuestionSchema).default([]),
  activities: z.array(ActivitySchema).default([]),
  misconceptions: z.array(MisconceptionSchema).default([]),
  objectiveIds: z.array(uuid).default([]),
});
export type LessonPhase = z.infer<typeof LessonPhaseSchema>;

export const LessonSchema = z.object({
  id: uuid,
  orderIndex: z.number().int().min(0),
  title: z.string().min(1),
  summary: z.string().optional(),
  durationMinutes: z.number().int().positive(),
  objectiveIds: z.array(uuid).min(1),
  phases: z.array(LessonPhaseSchema).default([]),
});
export type Lesson = z.infer<typeof LessonSchema>;

/**
 * Structure d'une séquence — sortie de l'étape 4 de l'assistant (proposition),
 * validée humainement à l'étape 5 avant toute génération de supports.
 */
export const LessonSequenceSchema = z.object({
  title: z.string().min(1),
  theme: z.string().min(1),
  language: ContentLanguageSchema,
  objectives: z.array(LearningObjectiveSchema).min(1),
  prerequisites: z.array(PrerequisiteSchema).default([]),
  lessons: z.array(LessonSchema).min(1),
  citations: z.array(SourceCitationSchema).default([]),
  /** Progression revendiquée : chaque séance doit référencer des objectifs déclarés. */
  notes: z.string().optional(),
});
export type LessonSequence = z.infer<typeof LessonSequenceSchema>;

/** Vérifie la cohérence interne : tout objectiveId référencé est déclaré. */
export function findDanglingObjectiveIds(sequence: LessonSequence): string[] {
  const declared = new Set(sequence.objectives.map((o) => o.id));
  const referenced = sequence.lessons.flatMap((l) => [
    ...l.objectiveIds,
    ...l.phases.flatMap((p) => p.objectiveIds),
  ]);
  return [...new Set(referenced.filter((id) => !declared.has(id)))];
}

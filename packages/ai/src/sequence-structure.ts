import { z } from "zod";
import { ContentLanguageSchema } from "@pedagoos/pedagogy";

/**
 * Entrées consolidées des étapes 1-3 de l'assistant de séquence, transmises
 * à la génération de structure (étape 4). Un objet stable et validé : il est
 * stocké dans lesson_sequences.wizard_state et rejoué à chaque génération.
 */
export const SequenceStructureInputSchema = z.object({
  theme: z.string().min(1),
  subject: z.string().min(1),
  gradeLevel: z.string().min(1),
  language: ContentLanguageSchema,
  sessionCount: z.number().int().min(1).max(20),
  sessionDurationMinutes: z.number().int().min(15).max(240),
  difficulty: z.enum(["easier", "standard", "harder"]),
  desiredObjectives: z.array(z.string().min(1)).default([]),
  prerequisites: z.array(z.string().min(1)).default([]),
  constraints: z.array(z.string().min(1)).default([]),
  learningType: z.string().optional(),
  differentiation: z.string().optional(),
  /** Extraits de sources sélectionnées — la génération DOIT s'y référer. */
  sourceExcerpts: z
    .array(
      z.object({
        sourceDocumentId: z.uuid(),
        title: z.string().min(1),
        excerpt: z.string().default(""),
      }),
    )
    .default([]),
});

export type SequenceStructureInput = z.infer<typeof SequenceStructureInputSchema>;

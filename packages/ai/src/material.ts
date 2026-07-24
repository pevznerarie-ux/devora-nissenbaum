import { z } from "zod";
import {
  BlockSchema,
  ContentLanguageSchema,
  MaterialKindSchema,
} from "@pedagoos/pedagogy";

/**
 * Entrées de génération d'un support (Phase 8). Dérivées de la séquence validée
 * et d'une séance : la génération produit des BLOCS typés (ADR-0005), jamais du
 * texte libre. Objet stable, rejouable (régénération partielle — ADR-0011).
 */
export const MaterialGenerationInputSchema = z.object({
  kind: MaterialKindSchema,
  language: ContentLanguageSchema,
  subject: z.string().min(1),
  gradeLevel: z.string().min(1),
  lessonTitle: z.string().min(1),
  lessonSummary: z.string().default(""),
  durationMinutes: z.number().int().min(15).max(240).default(55),
  objectives: z.array(z.object({ id: z.uuid(), title: z.string().min(1) })).min(1),
  constraints: z.array(z.string().min(1)).default([]),
  differentiation: z.string().optional(),
  /** Extraits de sources — la génération DOIT s'y référer, sans rien inventer. */
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
export type MaterialGenerationInput = z.infer<typeof MaterialGenerationInputSchema>;

/**
 * Entrées de retouche d'un bloc unique (édition par intentions — ADR-0010).
 * Le bloc conserve son `id` et son `type` ; seul son contenu est révisé selon
 * l'instruction dérivée de l'EditIntent (action rapide et/ou instruction).
 */
export const MaterialEditInputSchema = z.object({
  language: ContentLanguageSchema,
  subject: z.string().min(1),
  gradeLevel: z.string().min(1),
  /** L'instruction consolidée (action rapide traduite + instruction ciblée). */
  instruction: z.string().min(1),
  block: BlockSchema,
});
export type MaterialEditInput = z.infer<typeof MaterialEditInputSchema>;

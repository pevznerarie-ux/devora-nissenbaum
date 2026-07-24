import { z } from "zod";
import { ContentLanguageSchema, uuid } from "../core";
import {
  PedagogicalPurposeSchema,
  PreferredSourceSchema,
  RecommendedVisualTypeSchema,
  VisualOrientationSchema,
} from "./enums";

/**
 * VisualRequest (ADR-0016) — sortie du Visual Director pour UN bloc pédagogique.
 * Décrit POURQUOI un visuel est utile, sa fonction, le type recommandé, les
 * contraintes et les alternatives. Produit AVANT toute recherche ou génération.
 * `visualNeeded: false` est une issue normale et fréquente.
 */
export const VisualRequestSchema = z.object({
  id: uuid,
  organizationId: uuid,
  /** Cible : un bloc au sein d'un support (les blocs vivent en jsonb, id stable). */
  materialId: uuid.optional(),
  lessonBlockId: uuid.optional(),
  slideId: uuid.optional(),

  visualNeeded: z.boolean(),

  pedagogicalPurpose: PedagogicalPurposeSchema,
  recommendedType: RecommendedVisualTypeSchema,
  preferredSource: PreferredSourceSchema,
  /** Types de repli si la source privilégiée échoue. */
  fallbackTypes: z.array(RecommendedVisualTypeSchema).default([]),

  concept: z.string().min(1),
  description: z.string().min(1),
  caption: z.string().optional(),
  altText: z.string().optional(),

  targetAge: z.number().int().min(3).max(20).optional(),
  schoolLevel: z.string().optional(),
  subject: z.string().optional(),
  language: ContentLanguageSchema.optional(),

  orientation: VisualOrientationSchema.default("landscape"),
  aspectRatio: z.string().optional(),
  minimumWidth: z.number().int().positive().optional(),
  minimumHeight: z.number().int().positive().optional(),

  /** Ce que le visuel doit obligatoirement représenter / respecter. */
  accuracyRequirements: z.array(z.string().min(1)).default([]),
  requiredElements: z.array(z.string().min(1)).default([]),
  prohibitedElements: z.array(z.string().min(1)).default([]),

  searchQueries: z.array(z.string().min(1)).default([]),
  negativeSearchTerms: z.array(z.string().min(1)).default([]),

  styleKitId: uuid.optional(),
  /** Validation humaine obligatoire (sujets sensibles, contrôle noté…). */
  requiresHumanReview: z.boolean().default(false),
});
export type VisualRequest = z.infer<typeof VisualRequestSchema>;

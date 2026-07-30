import { z } from "zod";
import { RecommendedVisualTypeSchema } from "@pedagoos/pedagogy";

/** Analyse du besoin visuel d'un bloc (Visual Director — ADR-0016). */
export const recommendVisualSchema = z.object({
  materialId: z.uuid(),
  blockId: z.uuid(),
});

/** Prévisualisation d'un schéma pour un bloc (Diagram Engine — ADR-0016). */
export const previewDiagramSchema = z.object({
  materialId: z.uuid(),
  blockId: z.uuid(),
  recommendedType: RecommendedVisualTypeSchema,
});

/** Recherche d'images libres pour illustrer un bloc (Visual Search — ADR-0016). */
export const searchImagesSchema = z.object({
  materialId: z.uuid(),
  blockId: z.uuid(),
});

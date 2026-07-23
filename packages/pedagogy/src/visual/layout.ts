import { z } from "zod";
import { uuid } from "../core";

/**
 * Variantes de mise en page (ADR-0016) — un même asset décliné pour chaque
 * support, par RECADRAGE (jamais d'étirement non proportionnel). Conserve le
 * sujet principal et des zones libres pour le texte.
 */
export const LayoutTargetSchema = z.enum([
  "slide_16_9",
  "student_a4",
  "teacher_guide",
  "thumbnail",
  "full_width",
  "half_page",
  "mobile",
]);
export type LayoutTarget = z.infer<typeof LayoutTargetSchema>;

/** Recadrage relatif (0–1) : conserve le focus, ne déforme jamais. */
export const CropRectSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
});

export const VisualLayoutVariantSchema = z.object({
  id: uuid.optional(),
  assetId: uuid,
  target: LayoutTargetSchema,
  aspectRatio: z.string().min(1),
  crop: CropRectSchema.optional(),
  /** Point d'intérêt à préserver au recadrage (0–1). */
  focusX: z.number().min(0).max(1).default(0.5),
  focusY: z.number().min(0).max(1).default(0.5),
  storagePath: z.string().optional(),
});
export type VisualLayoutVariant = z.infer<typeof VisualLayoutVariantSchema>;

/** Dispositions de diapositive (ADR-0016) — compositions variées mais cohérentes. */
export const SlideLayoutSchema = z.enum([
  "title_left_visual_right",
  "visual_left_text_right",
  "visual_full_bleed",
  "centered_visual",
  "comparison_two_visuals",
  "diagram_full_width",
  "timeline_full_width",
  "quote_with_source",
  "question_slide",
  "summary_slide",
]);
export type SlideLayout = z.infer<typeof SlideLayoutSchema>;

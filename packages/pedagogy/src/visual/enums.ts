import { z } from "zod";

/**
 * Énumérations du Visual Intelligence Engine (ADR-0013 / ADR-0016). Pur : aucun
 * accès base, réseau ou fournisseur. Ces types sont LE contrat entre le moteur
 * de décision, l'IA, la base, l'éditeur et les exports.
 */

/** Fonction pédagogique d'un visuel (pourquoi il est là). */
export const PedagogicalPurposeSchema = z.enum([
  "explain",
  "demonstrate",
  "contextualize",
  "compare",
  "memorize",
  "illustrate",
  "document",
  "engage",
  "assess",
]);
export type PedagogicalPurpose = z.infer<typeof PedagogicalPurposeSchema>;

/** Type de visuel recommandé (« aucune image » est une réponse légitime). */
export const RecommendedVisualTypeSchema = z.enum([
  "none",
  "real_photo",
  "ai_illustration",
  "vector_diagram",
  "timeline",
  "chart",
  "map",
  "historical_source",
  "library_asset",
  "teacher_upload",
]);
export type RecommendedVisualType = z.infer<typeof RecommendedVisualTypeSchema>;

/** Source privilégiée pour obtenir le visuel. */
export const PreferredSourceSchema = z.enum([
  "internal_library",
  "unsplash",
  "pexels",
  "wikimedia",
  "institutional_archive",
  "openai",
  "google",
  "generated_svg",
  "teacher",
]);
export type PreferredSource = z.infer<typeof PreferredSourceSchema>;

/** Nature d'un asset stocké dans la médiathèque. */
export const VisualAssetTypeSchema = z.enum([
  "photo",
  "illustration",
  "diagram",
  "timeline",
  "chart",
  "map",
  "historical_document",
  "uploaded_image",
]);
export type VisualAssetType = z.infer<typeof VisualAssetTypeSchema>;

/** Provenance juridique d'un asset (pilote l'attribution). */
export const VisualSourceTypeSchema = z.enum([
  "generated",
  "stock",
  "public_domain",
  "licensed",
  "teacher_upload",
  "internal",
]);
export type VisualSourceType = z.infer<typeof VisualSourceTypeSchema>;

/** Orientation / composition demandée. */
export const VisualOrientationSchema = z.enum([
  "landscape",
  "portrait",
  "square",
  "slide_right",
  "slide_left",
  "full_bleed",
]);
export type VisualOrientation = z.infer<typeof VisualOrientationSchema>;

export const VisualQualityStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "requires_review",
]);
export type VisualQualityStatus = z.infer<typeof VisualQualityStatusSchema>;

export const VisualModerationStatusSchema = z.enum(["pending", "approved", "rejected"]);
export type VisualModerationStatus = z.infer<typeof VisualModerationStatusSchema>;

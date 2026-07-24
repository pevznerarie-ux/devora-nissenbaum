import { z } from "zod";
import { uuid } from "../core";
import {
  VisualAssetTypeSchema,
  VisualModerationStatusSchema,
  VisualQualityStatusSchema,
  VisualSourceTypeSchema,
} from "./enums";

/**
 * VisualAsset (ADR-0016) — un visuel stocké dans la médiathèque. Contient les
 * métadonnées d'affichage, de licence, de génération (prompt/coût/modèle) et de
 * confidentialité. Les fichiers vivent dans un bucket PRIVÉ ; seul le chemin est
 * stocké (accès par URL signée courte, jamais d'URL publique).
 */
export const VisualAssetSchema = z.object({
  id: uuid,
  organizationId: uuid,

  assetType: VisualAssetTypeSchema,
  sourceType: VisualSourceTypeSchema,

  storagePath: z.string().min(1),
  thumbnailPath: z.string().optional(),

  width: z.number().int().positive(),
  height: z.number().int().positive(),
  mimeType: z.string().min(1),
  fileSize: z.number().int().nonnegative(),

  title: z.string().optional(),
  description: z.string().optional(),
  caption: z.string().optional(),
  altText: z.string().optional(),

  // Licence / crédits (voir license.ts pour la logique d'attribution).
  creator: z.string().optional(),
  sourceName: z.string().optional(),
  sourceUrl: z.string().optional(),
  licenseName: z.string().optional(),
  licenseUrl: z.string().optional(),
  attributionText: z.string().optional(),
  attributionRequired: z.boolean().default(true),

  // Génération IA (le cas échéant) — traçabilité et réutilisation.
  generationProvider: z.string().optional(),
  generationModel: z.string().optional(),
  generationPrompt: z.string().optional(),
  negativePrompt: z.string().optional(),
  seed: z.string().optional(),
  generationCost: z.number().nonnegative().optional(),

  qualityStatus: VisualQualityStatusSchema.default("pending"),
  moderationStatus: VisualModerationStatusSchema.default("pending"),

  // Confidentialité (ADR-0016) — garde-fous données élèves / mineurs.
  containsPersonalData: z.boolean().default(false),
  containsMinor: z.boolean().default(false),
  consentStatus: z
    .enum(["not_required", "pending", "granted", "denied"])
    .default("not_required"),
  retentionPolicy: z.string().optional(),
  /** Faux par défaut : un visuel personnel n'est jamais envoyé à une IA externe. */
  externalAiProcessingAllowed: z.boolean().default(false),

  createdBy: uuid,
  createdAt: z.string().optional(),
});
export type VisualAsset = z.infer<typeof VisualAssetSchema>;

/**
 * Garde-fou pur (ADR-0016 / CLAUDE §5.7) : un asset contenant des données
 * personnelles ou un mineur ne peut jamais être transmis à un fournisseur IA
 * externe sans autorisation explicite. À appeler AVANT tout envoi provider.
 */
export function maySendToExternalAi(
  asset: Pick<
    VisualAsset,
    "containsPersonalData" | "containsMinor" | "externalAiProcessingAllowed"
  >,
): boolean {
  if (!asset.containsPersonalData && !asset.containsMinor) return true;
  return asset.externalAiProcessingAllowed;
}

import { z } from "zod";
import { uuid } from "../core";

/**
 * VisualCharacter (ADR-0016) — personnage récurrent (élève, professeur, guide,
 * figure historique stylisée). Le système utilise des images de référence quand
 * le fournisseur le permet. La cohérence parfaite N'EST PAS promise : validation
 * humaine toujours prévue.
 */
export const VisualCharacterSchema = z.object({
  id: uuid,
  organizationId: uuid.optional(),
  name: z.string().min(1),
  description: z.string().min(1),
  ageRange: z.string().optional(),
  appearance: z.string().min(1),
  clothing: z.string().optional(),
  /** Traits fixes à préserver d'une image à l'autre. */
  fixedTraits: z.array(z.string().min(1)).default([]),
  referenceAssetIds: z.array(uuid).default([]),
  styleKitId: uuid.optional(),
  canonicalPrompts: z.array(z.string().min(1)).default([]),
  approvedVariantAssetIds: z.array(uuid).default([]),
});
export type VisualCharacter = z.infer<typeof VisualCharacterSchema>;

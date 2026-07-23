import { z } from "zod";
import { uuid } from "../core";

/**
 * Licences et crédits (ADR-0016). Aucun visuel externe n'entre sans métadonnées
 * de source ; un visuel sans licence claire est marqué non publiable. Le
 * générateur de crédits est PUR (réutilisé par tous les exports, Phase 9).
 */
export const VisualLicenseSchema = z.object({
  id: uuid.optional(),
  provider: z.string().min(1).optional(),
  creator: z.string().optional(),
  /** Page de présentation de la source (pas l'URL directe du fichier). */
  sourcePageUrl: z.string().optional(),
  sourceFileUrl: z.string().optional(),
  licenseName: z.string().optional(),
  licenseUrl: z.string().optional(),
  isPublicDomain: z.boolean().default(false),
  attributionRequired: z.boolean().default(true),
  attributionText: z.string().optional(),
  retrievedAt: z.string().optional(),
  restrictions: z.array(z.string().min(1)).default([]),
  /** Faux par défaut : sans licence claire, on ne publie pas. */
  publishable: z.boolean().default(false),
});
export type VisualLicense = z.infer<typeof VisualLicenseSchema>;

/**
 * Construit une ligne de crédit à partir d'une licence. Ne suppose jamais qu'une
 * image est libre : sans auteur ni licence, renvoie une mention explicite.
 */
export function buildAttributionText(license: VisualLicense): string {
  if (license.attributionText && license.attributionText.trim().length > 0) {
    return license.attributionText.trim();
  }
  const parts: string[] = [];
  if (license.creator) parts.push(license.creator);
  if (license.provider) parts.push(license.provider);
  if (license.licenseName) parts.push(license.licenseName);
  if (parts.length === 0) return "Source non renseignée — visuel non publiable.";
  return parts.join(" · ");
}

/** Agrège les crédits d'un ensemble de licences (page de crédits, exports). */
export function buildCreditsList(licenses: readonly VisualLicense[]): string[] {
  return licenses
    .filter((l) => l.attributionRequired || !l.isPublicDomain)
    .map(buildAttributionText);
}

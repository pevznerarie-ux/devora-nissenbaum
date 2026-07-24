/**
 * Feature flags (ADR-0016) — le logiciel doit fonctionner même si certains
 * fournisseurs ou moteurs sont désactivés. Lecture CÔTÉ SERVEUR uniquement
 * (variables d'environnement non préfixées `NEXT_PUBLIC_`). Un back-end de
 * flags (PostHog) pourra se brancher plus tard derrière cette même surface.
 */

export const FEATURE_FLAGS = [
  "visual_director",
  "stock_photo_search",
  "ai_image_generation",
  "diagrams",
  "timelines",
  "charts",
  "maps",
  "wikimedia_sources",
  "visual_quality_review",
  "visual_semantic_search",
  "recurring_characters",
] as const;

export type FeatureFlag = (typeof FEATURE_FLAGS)[number];

/** Flags actifs par défaut quand aucune configuration n'est fournie (MVP mock). */
const DEFAULT_ENABLED: Record<FeatureFlag, boolean> = {
  visual_director: true,
  stock_photo_search: false,
  ai_image_generation: false,
  diagrams: true,
  timelines: true,
  charts: true,
  maps: true,
  wikimedia_sources: false,
  visual_quality_review: true,
  visual_semantic_search: false,
  recurring_characters: false,
};

function envKey(flag: FeatureFlag): string {
  return `FEATURE_${flag.toUpperCase()}`;
}

/**
 * Résout l'état d'un flag à partir d'un environnement (défaut `process.env`).
 * `1`/`true`/`on` activent, `0`/`false`/`off` désactivent ; sinon le défaut.
 */
export function isFeatureEnabled(
  flag: FeatureFlag,
  env: Record<string, string | undefined> = typeof process !== "undefined"
    ? process.env
    : {},
): boolean {
  const raw = env[envKey(flag)];
  if (raw === undefined) return DEFAULT_ENABLED[flag];
  const normalized = raw.trim().toLowerCase();
  if (["1", "true", "on", "yes"].includes(normalized)) return true;
  if (["0", "false", "off", "no"].includes(normalized)) return false;
  return DEFAULT_ENABLED[flag];
}

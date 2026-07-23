/**
 * Buckets Storage — tous PRIVÉS (docs/data-model.md §10). Accès uniquement
 * par URL signée à durée courte. Les chemins sont préfixés par l'organisation
 * pour que les politiques Storage répliquent l'isolation multi-tenant.
 */
export const STORAGE_BUCKETS = ["sources", "exports", "ai-raw", "scans"] as const;
export type StorageBucket = (typeof STORAGE_BUCKETS)[number];

/** Durée de vie maximale d'une URL signée (secondes). */
export const SIGNED_URL_MAX_AGE_SECONDS = 600;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function buildStoragePath(organizationId: string, ...segments: string[]): string {
  if (!UUID_RE.test(organizationId)) {
    throw new Error("organizationId invalide pour un chemin Storage.");
  }
  for (const segment of segments) {
    if (segment.length === 0 || segment.includes("..") || segment.includes("/")) {
      throw new Error("Segment de chemin Storage invalide.");
    }
  }
  return [organizationId, ...segments].join("/");
}

/** Extrait l'organization_id d'un chemin Storage (premier segment). */
export function organizationIdFromPath(path: string): string {
  const first = path.split("/")[0] ?? "";
  if (!UUID_RE.test(first)) {
    throw new Error("Chemin Storage sans préfixe d'organisation.");
  }
  return first;
}

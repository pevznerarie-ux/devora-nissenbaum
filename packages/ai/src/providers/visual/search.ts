import type { VisualOrientation } from "@pedagoos/pedagogy";

/**
 * Abstraction de recherche de visuels (ADR-0016) — vraies photos et sources
 * authentiques. La logique métier ne dépend jamais d'un fournisseur précis.
 * Tous les appels sont exécutés CÔTÉ SERVEUR (aucune clé côté client).
 */
export interface VisualSearchRequest {
  /** Requêtes (souvent en anglais + langue du cours). */
  queries: string[];
  negativeTerms?: string[];
  orientation?: VisualOrientation;
  minimumWidth?: number;
  minimumHeight?: number;
  /** Limite de résultats retenus (on ne renvoie jamais une galerie infinie). */
  limit?: number;
  /** Restreindre au domaine public / sources authentiques. */
  publicDomainOnly?: boolean;
}

export interface VisualSearchResult {
  providerId: string;
  provider: string;
  previewUrl: string;
  fileUrl: string;
  width: number;
  height: number;
  orientation: VisualOrientation;
  author?: string;
  sourceName?: string;
  sourceUrl?: string;
  licenseName?: string;
  licenseUrl?: string;
  attributionRequired: boolean;
  isPublicDomain: boolean;
  keywords: string[];
  relevanceScore: number;
  safe: boolean;
  hasWatermark: boolean;
  /** Détection de mineurs si le fournisseur l'expose (sinon indéfini). */
  containsMinor?: boolean;
}

export interface VisualSearchProvider {
  readonly name: string;
  search(request: VisualSearchRequest): Promise<VisualSearchResult[]>;
}

function orientationOf(width: number, height: number): VisualOrientation {
  if (width === height) return "square";
  return width > height ? "landscape" : "portrait";
}

/**
 * Fournisseur de recherche factice : déterministe, sans réseau ni clé (CI et dev
 * hors ligne). Fabrique quelques résultats plausibles avec des licences fictives
 * clairement identifiées comme telles, filtre par dimensions et déduplique.
 */
export class MockVisualSearchProvider implements VisualSearchProvider {
  readonly name = "mock-search";

  async search(request: VisualSearchRequest): Promise<VisualSearchResult[]> {
    const limit = request.limit ?? 3;
    const width = Math.max(request.minimumWidth ?? 1600, 1600);
    const height = Math.max(request.minimumHeight ?? 1066, 1066);
    const seen = new Set<string>();
    const results: VisualSearchResult[] = [];

    request.queries.forEach((query, i) => {
      const providerId = `mock-${i}-${query.slice(0, 24)}`;
      if (seen.has(providerId)) return; // déduplication
      seen.add(providerId);
      results.push({
        providerId,
        provider: this.name,
        previewUrl: `mock://preview/${encodeURIComponent(query)}`,
        fileUrl: `mock://file/${encodeURIComponent(query)}`,
        width,
        height,
        orientation: request.orientation ?? orientationOf(width, height),
        author: "Mock Author",
        sourceName: "Mock Library",
        sourceUrl: "mock://source",
        licenseName: request.publicDomainOnly ? "Public Domain (mock)" : "Mock License",
        licenseUrl: "mock://license",
        attributionRequired: !request.publicDomainOnly,
        isPublicDomain: Boolean(request.publicDomainOnly),
        keywords: query.split(/\s+/).filter(Boolean),
        relevanceScore: 1 - i * 0.1,
        safe: true,
        hasWatermark: false,
      });
    });

    return results
      .filter(
        (r) =>
          r.width >= (request.minimumWidth ?? 0) &&
          r.height >= (request.minimumHeight ?? 0),
      )
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }
}

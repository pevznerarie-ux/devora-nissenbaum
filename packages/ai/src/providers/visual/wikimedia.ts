import type { VisualOrientation } from "@pedagoos/pedagogy";
import type {
  VisualSearchProvider,
  VisualSearchRequest,
  VisualSearchResult,
} from "./search";

/**
 * Fournisseur de recherche réel adossé à Wikimedia Commons (ADR-0016) — images
 * et documents authentiques, licences libres et claires. Exécuté CÔTÉ SERVEUR
 * uniquement. Aucune clé requise, mais un `User-Agent` descriptif est exigé par
 * la politique d'API de Wikimedia.
 *
 * La couche métier ne dépend jamais de ce fournisseur : elle passe par
 * l'interface `VisualSearchProvider`. `fetchImpl` est injectable pour les tests.
 */
export interface WikimediaSearchOptions {
  /** Point d'accès de l'API MediaWiki (Commons par défaut). */
  endpoint?: string;
  /** User-Agent descriptif (contact inclus) — requis par Wikimedia. */
  userAgent?: string;
  /** Largeur des miniatures d'aperçu demandées. */
  previewWidth?: number;
  /** Implémentation de fetch (par défaut celle de l'environnement). */
  fetchImpl?: typeof fetch;
}

const DEFAULT_ENDPOINT = "https://commons.wikimedia.org/w/api.php";
const DEFAULT_UA = "PedagoOS/1.0 (education; visual-engine)";
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/svg+xml", "image/webp"]);

interface ExtValue {
  value?: string;
}
interface CommonsImageInfo {
  url?: string;
  descriptionurl?: string;
  thumburl?: string;
  thumbwidth?: number;
  thumbheight?: number;
  width?: number;
  height?: number;
  mime?: string;
  extmetadata?: Record<string, ExtValue>;
}
interface CommonsPage {
  index?: number;
  title?: string;
  imageinfo?: CommonsImageInfo[];
}
interface CommonsResponse {
  query?: { pages?: Record<string, CommonsPage> };
}

/** Retire le balisage HTML des champs extmetadata (souvent des liens). */
function stripHtml(html: string | undefined): string | undefined {
  if (!html) return undefined;
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 0 ? text : undefined;
}

function ext(
  meta: Record<string, ExtValue> | undefined,
  key: string,
): string | undefined {
  return meta?.[key]?.value;
}

function orientationOf(width: number, height: number): VisualOrientation {
  if (width === height) return "square";
  return width > height ? "landscape" : "portrait";
}

function isPublicDomain(meta: Record<string, ExtValue> | undefined): boolean {
  const license = (ext(meta, "License") ?? "").toLowerCase();
  const shortName = (ext(meta, "LicenseShortName") ?? "").toLowerCase();
  return (
    license === "pd" ||
    license.includes("public domain") ||
    shortName.includes("public domain") ||
    license.startsWith("cc0") ||
    shortName.includes("cc0")
  );
}

function requiresAttribution(
  meta: Record<string, ExtValue> | undefined,
  pd: boolean,
): boolean {
  const explicit = ext(meta, "AttributionRequired");
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  // Par défaut : le domaine public / CC0 ne l'exige pas, tout le reste oui.
  return !pd;
}

export class WikimediaSearchProvider implements VisualSearchProvider {
  readonly name = "wikimedia-commons";
  private readonly endpoint: string;
  private readonly userAgent: string;
  private readonly previewWidth: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: WikimediaSearchOptions = {}) {
    this.endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
    this.userAgent = options.userAgent ?? DEFAULT_UA;
    this.previewWidth = options.previewWidth ?? 800;
    const f = options.fetchImpl ?? globalThis.fetch;
    if (!f) {
      throw new Error("WikimediaSearchProvider : aucune implémentation de fetch.");
    }
    this.fetchImpl = f;
  }

  async search(request: VisualSearchRequest): Promise<VisualSearchResult[]> {
    const limit = request.limit ?? 3;
    // On demande un peu plus que la limite pour compenser le filtrage (mime,
    // dimensions, licence) puis on tronque après tri.
    const apiLimit = Math.min(Math.max(limit * 3, limit), 40);
    const seen = new Set<string>();
    const collected: VisualSearchResult[] = [];

    for (const query of request.queries) {
      const results = await this.searchOne(query, apiLimit, request);
      for (const r of results) {
        if (seen.has(r.providerId)) continue; // déduplication inter-requêtes
        seen.add(r.providerId);
        collected.push(r);
      }
    }

    return collected
      .filter((r) => r.width >= (request.minimumWidth ?? 0))
      .filter((r) => r.height >= (request.minimumHeight ?? 0))
      .filter((r) => (request.publicDomainOnly ? r.isPublicDomain : true))
      .filter((r) => (request.orientation ? r.orientation === request.orientation : true))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  private async searchOne(
    query: string,
    apiLimit: number,
    request: VisualSearchRequest,
  ): Promise<VisualSearchResult[]> {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      generator: "search",
      gsrsearch: query,
      gsrnamespace: "6", // espace « Fichier »
      gsrlimit: String(apiLimit),
      prop: "imageinfo",
      iiprop: "url|size|mime|extmetadata",
      iiurlwidth: String(this.previewWidth),
      origin: "*",
    });

    let body: CommonsResponse;
    try {
      const res = await this.fetchImpl(`${this.endpoint}?${params.toString()}`, {
        headers: { "User-Agent": this.userAgent, Accept: "application/json" },
      });
      if (!res.ok) return [];
      body = (await res.json()) as CommonsResponse;
    } catch {
      // Réseau indisponible / réponse invalide : dégradation silencieuse, la
      // couche appelante retombe sur schéma vectoriel ou aucun visuel.
      return [];
    }

    const pages = body.query?.pages;
    if (!pages) return [];

    const keywords = query.split(/\s+/).filter(Boolean);
    const rows = Object.values(pages).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    const out: VisualSearchResult[] = [];

    rows.forEach((page, position) => {
      const info = page.imageinfo?.[0];
      if (!info?.url) return;
      if (info.mime && !ALLOWED_MIME.has(info.mime)) return;
      const width = info.width ?? info.thumbwidth ?? 0;
      const height = info.height ?? info.thumbheight ?? 0;
      if (width === 0 || height === 0) return;

      const meta = info.extmetadata;
      const pd = isPublicDomain(meta);
      const negativeHit = (request.negativeTerms ?? []).some((term) =>
        (page.title ?? "").toLowerCase().includes(term.toLowerCase()),
      );
      if (negativeHit) return;

      // `exactOptionalPropertyTypes` : on n'ajoute les champs optionnels que
      // lorsqu'ils ont une valeur (jamais `undefined` explicite).
      const author = stripHtml(ext(meta, "Artist"));
      const licenseName = ext(meta, "LicenseShortName");
      const licenseUrl = ext(meta, "LicenseUrl");

      out.push({
        providerId: page.title ?? info.url,
        provider: this.name,
        previewUrl: info.thumburl ?? info.url,
        fileUrl: info.url,
        width,
        height,
        orientation: orientationOf(width, height),
        sourceName: "Wikimedia Commons",
        attributionRequired: requiresAttribution(meta, pd),
        isPublicDomain: pd,
        keywords,
        // Score décroissant selon le rang de pertinence renvoyé par l'API.
        relevanceScore: 1 - position / Math.max(apiLimit, 1),
        safe: true,
        hasWatermark: false,
        ...(author !== undefined ? { author } : {}),
        ...(info.descriptionurl !== undefined ? { sourceUrl: info.descriptionurl } : {}),
        ...(licenseName !== undefined ? { licenseName } : {}),
        ...(licenseUrl !== undefined ? { licenseUrl } : {}),
      });
    });

    return out;
  }
}

/**
 * Abstraction de génération d'images (ADR-0016) — illustrations IA. La logique
 * métier peut choisir le fournisseur, changer, gérer un fallback, comparer les
 * coûts et journaliser. Aucune clé côté client ; appels serveur uniquement.
 */
export interface ImageGenerationRequest {
  /** Prompt dérivé d'une ImagePromptSpecification (packages/pedagogy). */
  prompt: string;
  negativePrompt?: string;
  aspectRatio: string;
  /** Images de référence (personnages récurrents, style) si supporté. */
  referenceImagePaths?: string[];
  seed?: string;
}

export interface ImageEditRequest extends ImageGenerationRequest {
  sourceImagePath: string;
}

export interface ImageVariationRequest {
  sourceImagePath: string;
  count: number;
  aspectRatio: string;
}

export interface GeneratedImageResult {
  provider: string;
  model: string;
  /** Données de l'image (chemin temporaire ou data URI selon le fournisseur). */
  imageRef: string;
  width: number;
  height: number;
  mimeType: string;
  seed?: string;
  cost?: number;
  durationMs: number;
  status: "succeeded" | "refused" | "provider_failed";
  error?: string;
}

export interface ImageGenerationProvider {
  readonly name: string;
  generate(request: ImageGenerationRequest): Promise<GeneratedImageResult>;
  edit(request: ImageEditRequest): Promise<GeneratedImageResult>;
  createVariations(request: ImageVariationRequest): Promise<GeneratedImageResult[]>;
}

function dimsFor(aspectRatio: string): { width: number; height: number } {
  const [w, h] = aspectRatio.split(":").map((n) => Number.parseInt(n, 10));
  if (w && h) {
    const base = 1024;
    return w >= h
      ? { width: base, height: Math.round((base * h) / w) }
      : { width: Math.round((base * w) / h), height: base };
  }
  return { width: 1024, height: 1024 };
}

/**
 * Fournisseur de génération factice : déterministe, sans réseau ni clé ni coût.
 * Renvoie une référence d'image mock ; permet de développer tout le flux
 * (spec → prompt → génération → qualité → médiathèque) hors ligne.
 */
export class MockImageProvider implements ImageGenerationProvider {
  readonly name = "mock-image";
  readonly model = "mock-image-v1";

  private result(
    prompt: string,
    aspectRatio: string,
    seed?: string,
  ): GeneratedImageResult {
    const { width, height } = dimsFor(aspectRatio);
    return {
      provider: this.name,
      model: this.model,
      imageRef: `mock://image/${encodeURIComponent(prompt.slice(0, 40))}`,
      width,
      height,
      mimeType: "image/png",
      ...(seed ? { seed } : {}),
      cost: 0,
      durationMs: 0,
      status: "succeeded",
    };
  }

  async generate(request: ImageGenerationRequest): Promise<GeneratedImageResult> {
    return this.result(request.prompt, request.aspectRatio, request.seed);
  }

  async edit(request: ImageEditRequest): Promise<GeneratedImageResult> {
    return this.result(request.prompt, request.aspectRatio, request.seed);
  }

  async createVariations(
    request: ImageVariationRequest,
  ): Promise<GeneratedImageResult[]> {
    return Array.from({ length: Math.max(1, request.count) }, (_, i) =>
      this.result(`variation ${i}`, request.aspectRatio, String(i)),
    );
  }
}

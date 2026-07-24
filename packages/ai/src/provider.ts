import type { z } from "zod";

/**
 * Couche d'abstraction IA (ADR-0004, ADR-0014). La logique métier ne dépend
 * jamais d'un fournisseur ni d'un modèle précis : elle passe par une capacité,
 * le routeur choisit un NIVEAU, et le provider résout niveau → modèle. Toute
 * génération produit une sortie STRUCTURÉE validée par un schéma Zod ; une
 * sortie invalide est une erreur enregistrée, jamais corrigée silencieusement.
 */

/** Niveau de modèle (ADR-0014). Le code métier ne nomme jamais de modèle. */
export type ModelTier = "economy" | "standard" | "premium";

/** Nombre de tokens consommés (monitoring — ADR-0014 §7). */
export interface TokenUsage {
  input: number;
  output: number;
  cacheRead: number;
  cacheCreation: number;
}

export interface StructuredGenerationRequest<T> {
  /** Schéma cible : la sortie brute du modèle est parsée puis validée. */
  schema: z.ZodType<T>;
  /** Prompt versionné (fichier immuable) — journalisé dans ai_generations. */
  promptName: string;
  promptVersion: string;
  system: string;
  user: string;
  /** Niveau demandé ; le provider le résout en modèle concret (config). */
  modelTier?: ModelTier;
  maxTokens?: number;
  /**
   * Contexte structuré de la demande (entrées de l'assistant, extraits de
   * sources…). Le MockAIProvider s'en sert pour fabriquer une proposition
   * plausible et déterministe ; les providers réels le passent en contexte.
   */
  context?: Record<string, unknown>;
}

export type GenerationStatus = "succeeded" | "schema_failed" | "provider_failed";

export interface StructuredGenerationResult<T> {
  status: GenerationStatus;
  data?: T;
  /** Sortie brute (avant validation) — tracée pour audit et débogage. */
  raw?: unknown;
  error?: string;
  provider: string;
  model: string;
  tier: ModelTier;
  durationMs: number;
  usage?: TokenUsage;
  cacheHit?: boolean;
  /** Estimation de coût (USD) si calculable ; jamais pour le mock. */
  costEstimate?: number;
}

export interface DocumentAnalysisRequest {
  text: string;
  instruction: string;
}

export interface DocumentAnalysisResult {
  summary: string;
  provider: string;
  model: string;
}

export interface ImageAnalysisRequest {
  imagePath: string;
  instruction: string;
}

export interface ImageAnalysisResult {
  text: string;
  confidence: number;
  provider: string;
  model: string;
}

export interface AIProvider {
  generateStructured<T>(
    request: StructuredGenerationRequest<T>,
  ): Promise<StructuredGenerationResult<T>>;
  analyzeDocument(request: DocumentAnalysisRequest): Promise<DocumentAnalysisResult>;
  analyzeImage(request: ImageAnalysisRequest): Promise<ImageAnalysisResult>;
}

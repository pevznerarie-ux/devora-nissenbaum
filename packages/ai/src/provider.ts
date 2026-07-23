import type { z } from "zod";

/**
 * Couche d'abstraction IA (ADR-0004). La logique métier ne dépend jamais d'un
 * fournisseur précis : elle passe par `AIProvider`. Toute génération produit
 * une sortie STRUCTURÉE validée par un schéma Zod ; une sortie invalide est
 * une erreur enregistrée, jamais silencieusement corrigée (CLAUDE.md §6.5).
 */

export interface StructuredGenerationRequest<T> {
  /** Schéma cible : la sortie brute du modèle est parsée puis validée. */
  schema: z.ZodType<T>;
  /** Prompt versionné (fichier immuable) — journalisé dans ai_generations. */
  promptName: string;
  promptVersion: string;
  system: string;
  user: string;
  temperature?: number;
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
  durationMs: number;
  /** Estimation de coût si le fournisseur la fournit (jamais pour le mock). */
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

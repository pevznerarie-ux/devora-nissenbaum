import type { ModelTier, TokenUsage } from "./provider";

/**
 * Configuration des modèles par niveau (ADR-0014). Les identifiants sont des
 * VALEURS DE CONFIGURATION — jamais codés en dur dans le métier. Remplacer un
 * modèle = changer cette table (ou l'écraser via variables d'environnement).
 *
 * Tarifs USD par million de tokens (référence Anthropic ; à réviser au besoin).
 * Le cache en lecture coûte ~0,1× l'entrée ; l'écriture de cache ~1,25×.
 */
export interface ModelConfig {
  model: string;
  inputPer1M: number;
  outputPer1M: number;
  cacheReadPer1M: number;
  cacheCreationPer1M: number;
}

export const DEFAULT_MODELS: Record<ModelTier, ModelConfig> = {
  economy: {
    model: "claude-haiku-4-5",
    inputPer1M: 1,
    outputPer1M: 5,
    cacheReadPer1M: 0.1,
    cacheCreationPer1M: 1.25,
  },
  standard: {
    model: "claude-sonnet-5",
    inputPer1M: 3,
    outputPer1M: 15,
    cacheReadPer1M: 0.3,
    cacheCreationPer1M: 3.75,
  },
  premium: {
    model: "claude-opus-4-8",
    inputPer1M: 5,
    outputPer1M: 25,
    cacheReadPer1M: 0.5,
    cacheCreationPer1M: 6.25,
  },
};

/** Niveau immédiatement supérieur pour l'escalade, ou null au sommet. */
export function nextTierUp(tier: ModelTier): ModelTier | null {
  if (tier === "economy") return "standard";
  if (tier === "standard") return "premium";
  return null;
}

/** Coût estimé (USD) d'un appel à partir de l'usage réel de tokens. */
export function estimateCost(config: ModelConfig, usage: TokenUsage): number {
  return (
    (usage.input * config.inputPer1M +
      usage.output * config.outputPer1M +
      usage.cacheRead * config.cacheReadPer1M +
      usage.cacheCreation * config.cacheCreationPer1M) /
    1_000_000
  );
}

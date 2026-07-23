import type { ModelTier } from "./provider";

/**
 * Routeur IA (ADR-0014 §3). Le code métier demande une capacité et fournit des
 * signaux ; le routeur choisit le NIVEAU de modèle. Aucun identifiant de modèle
 * n'apparaît ici — uniquement des niveaux abstraits.
 */
export interface RoutingSignals {
  /** Taille cumulée des documents fournis (caractères). */
  documentChars?: number;
  /** Difficulté déclarée de la tâche. */
  difficulty?: "easier" | "standard" | "harder";
  /** Nombre de langues cibles (traduction multilingue). */
  languageCount?: number;
  /** Nombre de supports/objets à produire. */
  materialCount?: number;
  /** Tâche premium par nature (curriculum annuel, audit…). */
  premium?: boolean;
  /** Tâche légère par nature (extraction, résumé, classification…). */
  lightweight?: boolean;
}

/** Niveau par défaut d'une capacité, avant application des signaux. */
export type CapabilityBaseline = ModelTier;

/**
 * Choisit un niveau à partir d'un niveau de base et des signaux. Politique
 * volontairement simple et lisible ; les seuils sont des paramètres ajustables
 * avec les données réelles de monitoring (ADR-0014).
 */
export function chooseTier(
  baseline: CapabilityBaseline,
  signals: RoutingSignals = {},
): ModelTier {
  if (signals.premium) return "premium";
  if (signals.lightweight) return "economy";

  let tier: ModelTier = baseline;

  // Documents volumineux ou tâche difficile → au moins standard.
  const heavy =
    (signals.documentChars ?? 0) > 30_000 ||
    signals.difficulty === "harder" ||
    (signals.materialCount ?? 0) > 8 ||
    (signals.languageCount ?? 0) > 2;
  if (heavy && tier === "economy") tier = "standard";

  // Tâche manifestement triviale sur une capacité standard → économie.
  const trivial =
    (signals.documentChars ?? 0) < 2_000 &&
    signals.difficulty === "easier" &&
    (signals.materialCount ?? 0) <= 1;
  if (trivial && tier === "standard") tier = "economy";

  return tier;
}

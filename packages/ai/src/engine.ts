import type {
  AIProvider,
  ModelTier,
  StructuredGenerationRequest,
  StructuredGenerationResult,
} from "./provider";
import { nextTierUp } from "./models";

/**
 * Exécution d'une génération structurée avec l'échelle d'escalade d'ADR-0014 §4 :
 *   1. réparation automatique bornée (on renvoie l'erreur de schéma au modèle) ;
 *   2. nouvelle génération ;
 *   3. escalade vers un niveau supérieur ;
 *   4. échec explicite journalisé si tout échoue (jamais de correction silencieuse).
 *
 * Chaque tentative est retournée pour journalisation (`ai_generations`).
 */
export interface EscalationOptions {
  startTier?: ModelTier;
  /** Nombre de réparations par niveau avant d'escalader (défaut 1). */
  repairsPerTier?: number;
  /** Autorise l'escalade au niveau supérieur (défaut true). */
  allowEscalation?: boolean;
}

export interface EscalationOutcome<T> {
  final: StructuredGenerationResult<T>;
  attempts: StructuredGenerationResult<T>[];
  escalated: boolean;
}

export async function generateWithEscalation<T>(
  provider: AIProvider,
  request: StructuredGenerationRequest<T>,
  options: EscalationOptions = {},
): Promise<EscalationOutcome<T>> {
  const repairsPerTier = options.repairsPerTier ?? 1;
  const allowEscalation = options.allowEscalation ?? true;
  const attempts: StructuredGenerationResult<T>[] = [];

  let tier: ModelTier | null = options.startTier ?? request.modelTier ?? "standard";
  let escalated = false;

  while (tier !== null) {
    // Tentative initiale + réparations bornées sur ce niveau.
    for (let attempt = 0; attempt <= repairsPerTier; attempt++) {
      const isRepair = attempt > 0;
      const previous = attempts[attempts.length - 1];
      const user = isRepair
        ? `${request.user}\n\n[Correction] La sortie précédente était invalide : ${previous?.error ?? "schéma non respecté"}. Renvoie un JSON STRICTEMENT conforme au schéma.`
        : request.user;

      const result = await provider.generateStructured({
        ...request,
        modelTier: tier,
        user,
      });
      attempts.push(result);

      if (result.status === "succeeded") {
        return { final: result, attempts, escalated };
      }
      // Un échec fournisseur (réseau, quota) ne se répare pas : on escalade.
      if (result.status === "provider_failed") break;
    }

    if (!allowEscalation) break;
    const up = nextTierUp(tier);
    if (up === null) break;
    tier = up;
    escalated = true;
  }

  const final = attempts[attempts.length - 1];
  if (!final) {
    throw new Error("Aucune tentative de génération n'a été exécutée.");
  }
  return { final, attempts, escalated };
}

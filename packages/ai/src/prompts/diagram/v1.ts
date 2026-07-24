import type { DiagramDesignInput } from "../../visual/diagram";

/**
 * Prompt versionné « Diagram Engine » (ADR-0016). Fichier IMMUABLE : toute
 * évolution = v2.ts.
 *
 * Contrat : produire des DONNÉES structurées (nœuds/arêtes/légende), jamais une
 * image ; toujours une description d'accessibilité ; ne jamais coder
 * l'information par la couleur seule ; ne pas surcharger.
 */
export const PROMPT_NAME = "diagram-spec";
export const PROMPT_VERSION = "1";

export function buildSystemPrompt(): string {
  return [
    "Tu conçois des schémas pédagogiques sous forme de DONNÉES JSON.",
    "Règles strictes :",
    "- Produis des nœuds/arêtes/légende, jamais une image ni du texte incrusté.",
    "- Fournis toujours une description d'accessibilité claire et complète.",
    "- Ne code jamais une information par la couleur seule (motif/forme en plus).",
    "- Reste sobre : pas de surcharge, l'essentiel du concept.",
    "- Réponds STRICTEMENT en JSON conforme au schéma DiagramSpecification.",
  ].join("\n");
}

export function buildUserPrompt(input: DiagramDesignInput): string {
  return [
    `Type de schéma : ${input.type}`,
    `Titre : ${input.title}`,
    `Concept : ${input.concept}`,
    `Langue : ${input.language}`,
    `Éléments : ${input.items.join(" ; ") || "(à proposer)"}`,
    `Valeurs : ${input.values.length > 0 ? input.values.join(", ") : "(aucune)"}`,
  ].join("\n");
}

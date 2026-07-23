import type { VisualDirectorInput } from "../../visual/director";

/**
 * Prompt versionné « Visual Director » (ADR-0016). Fichier IMMUABLE : toute
 * évolution = v2.ts. `promptName` + `promptVersion` sont journalisés.
 *
 * Contrat : décider si un visuel apporte une réelle valeur ; choisir le type le
 * plus JUSTE (ne jamais générer une image quand une vraie photo ou une source
 * authentique convient mieux ; ne jamais produire en bitmap ce qui doit être un
 * schéma SVG) ; « aucun visuel » est une réponse légitime ; signaler les sujets
 * sensibles pour validation humaine ; produire légende et texte alternatif.
 */
export const PROMPT_NAME = "visual-director";
export const PROMPT_VERSION = "1";

export function buildSystemPrompt(): string {
  return [
    "Tu es directeur artistique pédagogique.",
    "Pour un bloc de cours, tu décides s'il faut un visuel et lequel.",
    "Règles strictes :",
    "- « Aucun visuel » est une réponse légitime et fréquente ; pas d'image décorative.",
    "- Données → graphique ; chronologie → frise ; processus/structure → schéma SVG.",
    "- Personnage/œuvre historique réel → source authentique ; lieu/animal/plante → vraie photo.",
    "- Scène fictive → illustration IA. Carte pédagogique → carte vectorielle.",
    "- Un visuel déjà validé en médiathèque est proposé avant toute génération.",
    "- Sujet sensible (religion, guerre, corps, mineurs, contrôle noté…) → validation humaine.",
    "- Fournis toujours une légende et un texte alternatif.",
    "- Réponds STRICTEMENT en JSON conforme au schéma VisualRequest, sans texte autour.",
  ].join("\n");
}

export function buildUserPrompt(input: VisualDirectorInput): string {
  return [
    `Concept : ${input.concept}`,
    `Contenu du bloc : ${input.blockText || "(non fourni)"}`,
    `Fonction pédagogique visée : ${input.pedagogicalPurpose ?? "(à déterminer)"}`,
    `Nature du concept : ${input.contentKind ?? "(à déterminer)"}`,
    `Matière : ${input.subject ?? "(non précisée)"}`,
    `Âge cible : ${input.targetAge ?? "(non précisé)"}`,
    `Langue : ${input.language ?? "(non précisée)"}`,
    `Orientation souhaitée : ${input.orientation}`,
    `Un visuel validé existe en médiathèque : ${input.hasValidatedLibraryAsset ? "oui" : "non"}`,
    `Utilisé dans un contrôle noté : ${input.usedInGradedAssessment ? "oui" : "non"}`,
  ].join("\n");
}

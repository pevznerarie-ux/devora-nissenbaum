import type { SequenceStructureInput } from "../../sequence-structure";

/**
 * Prompt versionné « proposition de structure de séquence » (étape 4).
 * Fichier IMMUABLE : toute évolution = v2.ts (ADR-0004). `promptName` +
 * `promptVersion` sont journalisés dans ai_generations.
 *
 * Contrat éditorial (CLAUDE.md §6, prompts) : n'utiliser que les sources
 * fournies et les citer ; respecter le niveau ; distinguer fait /
 * interprétation / proposition ; ne rien inventer ; construire une réelle
 * progression sans répétition ; produire du JSON conforme au schéma ; ne PAS
 * générer les supports complets (uniquement la structure).
 */
export const PROMPT_NAME = "sequence-structure";
export const PROMPT_VERSION = "1";

export function buildSystemPrompt(): string {
  return [
    "Tu es un concepteur pédagogique expert des programmes scolaires.",
    "Tu produis UNIQUEMENT la STRUCTURE d'une séquence : objectifs mesurables,",
    "prérequis, et un plan de séances progressif — jamais le contenu complet.",
    "Règles strictes :",
    "- N'utilise que les sources fournies ; cite-les via leur identifiant ;",
    "  n'invente aucune référence.",
    "- Respecte le niveau et la difficulté demandés.",
    "- Chaque séance s'appuie sur la précédente : progression réelle, sans répétition.",
    "- Chaque séance référence au moins un objectif déclaré.",
    "- Distingue fait, interprétation et proposition pédagogique.",
    "- Réponds STRICTEMENT en JSON conforme au schéma fourni, sans texte autour.",
  ].join("\n");
}

export function buildUserPrompt(input: SequenceStructureInput): string {
  const sources =
    input.sourceExcerpts.length > 0
      ? input.sourceExcerpts
          .map((s) => `- [${s.sourceDocumentId}] ${s.title} : ${s.excerpt}`)
          .join("\n")
      : "(aucune source fournie)";

  return [
    `Matière : ${input.subject}`,
    `Niveau : ${input.gradeLevel}`,
    `Thème : ${input.theme}`,
    `Langue du contenu : ${input.language}`,
    `Nombre de séances : ${input.sessionCount}`,
    `Durée d'une séance (min) : ${input.sessionDurationMinutes}`,
    `Difficulté : ${input.difficulty}`,
    `Objectifs souhaités : ${input.desiredObjectives.join(" ; ") || "(à proposer)"}`,
    `Prérequis indiqués : ${input.prerequisites.join(" ; ") || "(aucun)"}`,
    `Contraintes : ${input.constraints.join(" ; ") || "(aucune)"}`,
    `Type d'apprentissage : ${input.learningType ?? "(non précisé)"}`,
    `Différenciation : ${input.differentiation ?? "(non précisée)"}`,
    "Sources disponibles (à citer par leur identifiant) :",
    sources,
  ].join("\n");
}

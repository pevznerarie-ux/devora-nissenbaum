import type { MaterialEditInput } from "../../material";

/**
 * Prompt versionné « retouche d'un bloc » (édition par intentions — ADR-0010).
 * Fichier IMMUABLE : toute évolution = v2.ts.
 *
 * Le modèle révise UN bloc en conservant son `id` et son `type`. Il n'y a pas
 * de conversation : l'instruction est fournie une fois (action rapide traduite
 * et/ou instruction ciblée), la sortie est le bloc révisé, validé par schéma.
 */
export const PROMPT_NAME = "material-edit";
export const PROMPT_VERSION = "1";

export function buildSystemPrompt(): string {
  return [
    "Tu révises UN bloc pédagogique typé selon une instruction précise.",
    "Règles strictes :",
    "- Conserve exactement le même `id` et le même `type` de bloc.",
    "- Applique l'instruction sans en dépasser la portée.",
    "- Préserve `audience` et `answerKey` sauf demande explicite contraire.",
    "- N'invente aucune source ; ne cite que des sources déjà présentes.",
    "- Réponds STRICTEMENT en JSON conforme au schéma du bloc, sans texte autour.",
  ].join("\n");
}

export function buildUserPrompt(input: MaterialEditInput): string {
  return [
    `Matière : ${input.subject}`,
    `Niveau : ${input.gradeLevel}`,
    `Langue du contenu : ${input.language}`,
    `Instruction : ${input.instruction}`,
    "Bloc actuel (JSON) :",
    JSON.stringify(input.block),
  ].join("\n");
}

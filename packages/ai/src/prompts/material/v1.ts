import type { MaterialGenerationInput } from "../../material";

/**
 * Prompt versionné « génération d'un support par blocs » (Phase 8, ADR-0005).
 * Fichier IMMUABLE : toute évolution = v2.ts. `promptName` + `promptVersion`
 * sont journalisés dans ai_generations.
 *
 * Contrat éditorial : produire des blocs typés conformes au schéma, adaptés au
 * type de support ; marquer `audience` et `answerKey` correctement (le corrigé
 * n'est jamais visible côté élève) ; ne citer que les sources fournies ;
 * distinguer fait / interprétation / proposition ; ne rien inventer.
 */
export const PROMPT_NAME = "material-generation";
export const PROMPT_VERSION = "1";

const KIND_GUIDANCE: Record<MaterialGenerationInput["kind"], string> = {
  teacher_guide:
    "Fiche professeur : déroulé (timeline_step), points de vigilance (misconception, audience teacher), synthèse.",
  student_handout:
    "Support élève : objectifs, explication claire, exemples, exercices (audience student).",
  presentation:
    "Présentation écran : blocs slide (titre + puces courtes + notes orateur).",
  exercise_set:
    "Jeu d'exercices gradués ; chaque corrigé est un bloc expected_answer marqué answerKey.",
  assessment:
    "Évaluation : questions (assessment_question) alignées aux objectifs, avec points et corrigé (answerKey).",
};

export function buildSystemPrompt(kind: MaterialGenerationInput["kind"]): string {
  return [
    "Tu es un concepteur de supports pédagogiques.",
    "Tu produis un support sous forme de BLOCS typés conformes au schéma fourni,",
    "jamais du texte libre ni un document mis en page.",
    `Type de support attendu : ${KIND_GUIDANCE[kind]}`,
    "Règles strictes :",
    "- N'utilise que les sources fournies ; cite-les par identifiant ; n'invente rien.",
    "- Renseigne `audience` (teacher/student/both) et `answerKey` avec justesse :",
    "  aucun corrigé ni note professeur ne doit fuiter dans la variante élève.",
    "- Chaque bloc vise au moins un objectif déclaré (objectiveIds).",
    "- Respecte le niveau et la durée ; distingue fait / interprétation / proposition.",
    "- Réponds STRICTEMENT en JSON conforme au schéma, sans texte autour.",
  ].join("\n");
}

export function buildUserPrompt(input: MaterialGenerationInput): string {
  const objectives = input.objectives.map((o) => `- [${o.id}] ${o.title}`).join("\n");
  const sources =
    input.sourceExcerpts.length > 0
      ? input.sourceExcerpts
          .map((s) => `- [${s.sourceDocumentId}] ${s.title} : ${s.excerpt}`)
          .join("\n")
      : "(aucune source fournie)";

  return [
    `Type de support : ${input.kind}`,
    `Matière : ${input.subject}`,
    `Niveau : ${input.gradeLevel}`,
    `Séance : ${input.lessonTitle}`,
    `Résumé de la séance : ${input.lessonSummary || "(aucun)"}`,
    `Durée (min) : ${input.durationMinutes}`,
    `Langue du contenu : ${input.language}`,
    `Différenciation : ${input.differentiation ?? "(non précisée)"}`,
    `Contraintes : ${input.constraints.join(" ; ") || "(aucune)"}`,
    "Objectifs (à référencer par identifiant) :",
    objectives,
    "Sources disponibles (à citer par identifiant) :",
    sources,
  ].join("\n");
}

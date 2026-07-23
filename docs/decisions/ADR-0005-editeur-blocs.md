# ADR-0005 — Éditeur par blocs pédagogiques structurés (pas de WYSIWYG générique)

Statut : acceptée · Date : 2026-07-23

## Contexte
Tous les supports (fiche professeur, support élève, présentation, exercices,
évaluation) doivent être éditables, versionnés, exportables en plusieurs
variantes, et rester des **données structurées** reliées aux objectifs et
compétences. Un éditeur riche générique (ProseMirror/TipTap complet) serait
coûteux et casserait la structure.

## Décision
- Chaque support est une liste ordonnée de **blocs pédagogiques typés**,
  définis dans `packages/pedagogy` (Zod) : ex. `objectives`, `vocabulary`,
  `timeline_step`, `explanation`, `example`, `discussion_question`,
  `expected_answer`, `misconception`, `differentiation`, `summary`,
  `exercise`, `assessment_question`, `document_ref`, `answer_space`,
  `slide`… Chaque bloc porte `audience` (`teacher/student/both`) et
  `answerKey: boolean` pour dériver les variantes d'export par filtrage.
- L'éditeur manipule ces blocs (ajout, édition par formulaires, réordonnancement,
  suppression) ; le texte riche à l'intérieur d'un bloc est limité à un
  sous-ensemble (gras, italique, listes, formules simples).
- Persistance : `material_versions.blocks` (jsonb validé Zod) — voir ADR-0009.
  Pas de table `lesson_blocks` par bloc au MVP (réévaluée si collaboration
  temps réel).
- Les mêmes blocs alimentent l'affichage écran, l'export PDF/DOCX et les
  slides PPTX (blocs `slide`).

## Conséquences
- L'IA génère directement des blocs valides ; l'édition ne dégrade jamais la
  structure ; les variantes d'export sont un simple filtrage.
- Limite assumée : mise en forme libre restreinte ; c'est un choix produit
  (sobriété, cohérence des supports).

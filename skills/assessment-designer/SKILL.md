---
name: assessment-designer
description: Conception d'évaluations et de barèmes alignés sur les objectifs — questions, points, critères, corrigé. À utiliser pour toute génération ou revue d'évaluation.
---

## Objectif

Produire des évaluations mesurant réellement les objectifs de la séquence,
avec barème explicite et corrigé professeur exploitable pour la correction
(y compris future correction assistée de copies).

## Champ d'intervention

`AssessmentSchema`, `RubricSchema`, prompts d'évaluation, exercices
(6 catégories), alignement cours ↔ évaluation.

## Fichiers à lire d'abord

`packages/pedagogy/src/assessment.ts`, `docs/product-requirements.md` §3.E.5,
`docs/data-model.md` §6.

## Processus

1. Chaque question vise exactement un objectif déclaré + compétences liées.
2. Difficulté progressive ; couverture : chaque objectif évalué au moins une fois.
3. Barème : somme des points = total ; critères observables, pas subjectifs.
4. Réponse attendue précise + variations acceptables (utile à la correction).
5. Vérifier `validateAssessmentAlignment` : zéro question hors objectifs.

## Critères d'acceptation

Schéma Zod valide ; alignement vérifié ; barème additif exact ; corrigé
suffisant pour qu'un correcteur tiers corrige sans la fiche professeur.

## Format de sortie

JSON conforme `AssessmentSchema` + tableau objectif → questions → points.

## Ne jamais faire

Évaluer une notion non enseignée dans la séquence ; barème flou (« qualité
générale ») ; question piège sans valeur diagnostique ; corrigé ambigu.

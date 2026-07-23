---
name: lesson-material-designer
description: Conception des supports (fiche professeur, support élève, présentation) à partir d'une structure validée. À utiliser pour la génération et l'éditeur de blocs.
---

## Objectif

Produire des supports complets, structurés en blocs pédagogiques, fidèles à la
structure validée et adaptés à l'audience (professeur / élève / écran).

## Champ d'intervention

Blocs `materials`, prompts de génération de supports, variantes d'export,
déroulé minute par minute, espaces de réponse élève, slides.

## Fichiers à lire d'abord

`packages/pedagogy/src/*`, ADR-0005, ADR-0009,
`docs/product-requirements.md` §3.E-F.

## Processus

1. Partir exclusivement de la structure validée (jamais la contredire).
2. Fiche professeur : toutes les rubriques exigées (objectifs → devoir).
3. Support élève : langage simple, espaces de réponse, pas de corrigé.
4. Présentation : une idée par écran, peu de texte, synthèses intermédiaires,
   écran final de récapitulatif.
5. Chaque bloc porte `audience` et `answerKey` corrects (les variantes d'export
   en dépendent).

## Critères d'acceptation

Blocs valides Zod ; aucune réponse attendue dans un bloc audience=student sans
answerKey ; chaque bloc rattaché à un objectif ou une phase ; citations présentes.

## Format de sortie

Liste ordonnée de blocs JSON valides + résumé des choix pédagogiques.

## Ne jamais faire

Produire du texte libre hors blocs ; mettre le corrigé dans le support élève ;
inventer un document ou une illustration non fournis ; surcharger les slides.

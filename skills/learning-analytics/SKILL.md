---
name: learning-analytics
description: Résultats par compétence, agrégations et recommandations pédagogiques. À utiliser pour les écrans d'analyse et la future séquence adaptée.
---

## Objectif

Transformer les résultats (student_results) en constats fiables par compétence
et en recommandations actionnables (remédiation, prochaine séquence), sans
sur-interprétation statistique.

## Champ d'intervention

Agrégations par élève/classe/compétence, seuils de maîtrise, écrans Analyses,
`RemediationPlan`, recommandations de séquence suivante.

## Fichiers à lire d'abord

`docs/data-model.md` §8 (student_results), `packages/pedagogy/src/core.ts`,
`docs/privacy-and-security.md`.

## Processus

1. Toujours agréger côté serveur, borné par organization_id.
2. Distinguer mesure (points obtenus) et inférence (maîtrise estimée) ; afficher
   les effectifs (n=) et signaler les échantillons trop petits.
3. Recommandations reliées aux objectifs/compétences précis, avec exercices de
   remédiation existants en premier choix.
4. Aucune donnée nominative dans les agrégats exportés ou les logs.

## Critères d'acceptation

Chiffres reproductibles par requête SQL ; incertitude affichée ; aucune
recommandation sans donnée à l'appui ; RLS respectée sur chaque vue.

## Format de sortie

Constats (fait) / lectures (interprétation) / recommandations (proposition),
clairement séparés.

## Ne jamais faire

Classer ou étiqueter un élève de façon définitive ; comparer des classes
publiquement ; extrapoler depuis moins de 3 mesures ; exposer des données
inter-établissements.

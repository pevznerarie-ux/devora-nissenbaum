# Visual Intelligence Engine — stratégie de tests

## Unitaires (purs)

schémas Zod · règles de décision (`chooseRecommendedType`) · builder de prompt ·
crédits/attribution · chartes par défaut · garde-fou données mineurs.

## Fournisseurs mockés

`MockVisualSearchProvider`, `MockImageProvider`, `MockVisualQualityReviewer` —
déterministes, sans réseau ni clé (le dev local fonctionne hors ligne).

## Intégration

déduplication · licences · adaptation aux supports · fallback fournisseur ·
gestion des erreurs (fournisseur indisponible, quota, aucun résultat…).

## RLS

isolation inter-organisations sur chaque table visuelle (job CI `rls`).

## E2E (scénario cible)

séquence → analyse des blocs → recommandations (photo animal, schéma cycle,
illustration scène fictive) → choix professeur → sauvegarde assets → génération
support élève + slides → crédits présents → permissions respectées.

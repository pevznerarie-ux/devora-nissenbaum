# ADR-0011 — Objets pédagogiques versionnés, graphe de dépendances, régénération partielle

Statut : acceptée · Date : 2026-07-23

## Contexte

Modifier un élément (ex. la séance 2) ne doit **jamais** régénérer l'ensemble
du dossier. Il faut recalculer uniquement les parties dépendantes, tout
conserver par ailleurs, et ne perdre aucune information.

## Décision

**Chaque objet pédagogique** (objectif, séance, phase, activité, exercice,
question d'évaluation, bloc de support, slide, illustration) porte :

```
id            identifiant stable
version       numéro de version (incrémenté à chaque modification)
status        proposed | draft | validated | published | archived
locked        booléen — objet figé, jamais régénéré automatiquement
dependencies  liste d'ids dont cet objet dérive
```

**Graphe de dépendances.** Les arêtes relient un objet source à ses dérivés,
p. ex. `séance 2 → { fiche prof (partie séance 2), slides séance 2, exercices
liés, question de contrôle correspondante }`. Le graphe est explicite et
persisté, pas déduit à la volée.

**Régénération partielle.** À la modification d'un objet, un **planificateur**
calcule la fermeture transitive de ses dépendants **non verrouillés**, ne
régénère que ceux‑là, et conserve tout le reste à l'identique. Un objet
`locked` n'est jamais régénéré (le professeur l'a figé).

**Historique et versions.** Toute modification crée une nouvelle version
immuable (étend `material_versions`, ADR-0009, à une granularité par objet).
Le professeur peut : comparer deux versions (diff), restaurer une version
antérieure, conserver certains éléments lors d'une restauration, et fusionner
plusieurs versions (choix élément par élément). **Aucune information n'est
jamais perdue** — l'historique est append‑only.

## Conséquences

- Le modèle de données ajoute, sur chaque objet pédagogique, les colonnes
  `version/status/locked` et une table d'arêtes `pedagogical_dependencies`
  (voir data-model.md). Les versions par objet vivent en `object_versions`.
- La génération devient incrémentale : coût et latence proportionnels à
  l'ampleur du changement, pas à la taille du dossier.
- La fusion de versions impose une UI de résolution (choix par objet) ;
  pas de fusion automatique silencieuse (cohérent avec ADR-0009).

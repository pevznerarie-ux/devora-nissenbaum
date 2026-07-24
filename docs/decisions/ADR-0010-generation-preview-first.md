# ADR-0010 — Génération en deux temps (Preview-First) et édition par intentions

Statut : acceptée · Date : 2026-07-23

## Contexte

PedagoOS ne doit **jamais** produire directement un dossier pédagogique complet
(plusieurs dizaines de pages) : le professeur doit valider la direction
pédagogique avant toute génération coûteuse. C'est aussi un levier de coût IA
majeur (générer un aperçu bon marché avant le dossier complet).

## Décision

**Flux obligatoire** (généralise l'assistant existant) :

```
Demande professeur → Analyse des sources → Blueprint pédagogique
→ Aperçu interactif → Validation/modifications → Génération complète
→ Contrôle qualité → Export
```

- Le **Blueprint** = la structure de séquence validée aujourd'hui
  (`LessonSequenceSchema` : objectifs + plan de séances). Statut
  `structure_validated`.
- L'**aperçu interactif** est une étape nouvelle : ~5 écrans d'**échantillons
  réalistes** générés à faible coût (pas les documents complets) —
  1. vue d'ensemble (titre, niveau, durée, compétences, objectifs, prérequis,
     résultats attendus) ; 2) plan de séquence (par séance : objectif, activité
     principale, durée, matériel, production attendue) ; 3) extrait de fiche
     professeur ; 4) page exemple du support élève ; 5) quelques slides + quelques
     exercices de niveaux variés + quelques questions de contrôle avec type de
     barème. Nouveau statut de séquence : `preview_ready`.
- **Génération complète** uniquement après validation explicite de l'aperçu
  (statut `materials_generated`), suivie d'un **contrôle qualité** (Review +
  Quality engines, ADR-0012) avant `published`/export.

**Édition avant génération — par intentions contextuelles, pas par chat.**
Le professeur peut tout modifier (simplifier, approfondir, plus d'exercices,
slides plus visuelles, plus de collaboration, changer le nombre de séances,
remplacer une activité, changer le style pédagogique…). Deux mécanismes, tous
deux **structurés et bornés à un objet**, jamais une zone de chat libre :

1. **Actions rapides** contextuelles sur l'objet cliqué (boutons : simplifier /
   approfondir / plus d'exercices / moins de texte / plus visuel / plus de
   manipulation…).
2. **Instruction ciblée** attachée à un objet précis (« la séance 3 est trop
   théorique », « les exercices sont trop faciles », « plus de travail
   collaboratif »). Elle produit un **EditIntent** structuré
   `{ targetObjectId, instruction, quickAction? }` traité par le moteur
   concerné, qui ne régénère que l'objet visé et ses dépendances (ADR-0011).

## Conséquences

- L'assistant passe de 6 à un flux à étapes : cadre → intentions → sources →
  **blueprint** → **aperçu** → génération → **QC** → export.
- Coût maîtrisé : l'aperçu consomme peu de tokens ; le dossier complet n'est
  produit qu'après accord.
- Reste fidèle aux interdictions : aucune interface « chat avec l'IA »
  générique ; les EditIntents sont contextuels et validés par schéma Zod.

# ADR-0013 — Sous-système d'illustrations : décision visuelle, spécification JSON, ImageProvider

Statut : acceptée · Date : 2026-07-23

## Contexte

Les illustrations sont fondamentales dans PedagoOS et **ne sont jamais générées
au hasard**. Chaque visuel doit servir un objectif pédagogique précis, et le
bon _type_ de visuel doit être choisi selon le concept. L'objectif n'est pas de
remplir les supports d'images, mais de mettre **le bon visuel au bon endroit**.

## Décision

### 1. Moteur de décision visuelle

Avant chaque génération, pour chaque point d'un cours :

```
Leçon → analyse pédagogique → identifier où une image améliore réellement
la compréhension → choisir le type : photo | illustration IA | schéma | icône
| aucune image
```

Le moteur détermine d'abord **pourquoi** une illustration est utile, **quel
concept** elle aide à comprendre, et **quelle modalité** est la meilleure —
avant toute production. « Aucune image » est une réponse légitime et fréquente.

### 2. Trois types de visuels

- **Type 1 — Photographies réelles** (animaux, métiers, pays, monuments,
  plantes, objets, expériences scientifiques, géographie, histoire) :
  **Photo Selection Engine** sélectionne des photographies **sous licence**
  (banques autorisées). L'utilisateur ne doit pas voir une image IA quand une
  vraie photo est plus pertinente.
- **Type 2 — Illustrations IA** (sciences, maths, scènes historiques, schémas
  figuratifs, personnages fictifs, concepts abstraits, anatomie simplifiée) :
  **Illustration Engine** génère une illustration respectant une **charte
  graphique cohérente** (style, palette, âge cible).
- **Type 3 — Schémas pédagogiques** (diagrammes, cartes mentales, frises
  chronologiques, cartes, tableaux comparatifs, organigrammes, expériences) :
  **Diagram Engine** privilégie un **schéma vectoriel clair** (SVG) plutôt
  qu'une illustration artistique.

### 3. Spécification JSON avant image

PedagoOS ne génère **jamais** directement une image. Il produit d'abord un
objet JSON décrivant le visuel (validé par schéma Zod), p. ex. :

```json
{
  "purpose": "Comprendre le cycle de l'eau",
  "image_type": "diagram",
  "style": "modern educational",
  "target_age": 9,
  "language": "fr",
  "must_show": ["évaporation", "condensation", "précipitations", "ruissellement"],
  "objective_id": "…"
}
```

Un moteur spécialisé transforme ensuite cette spécification en image.

### 4. Abstraction `ImageProvider`

Comme `AIProvider` (ADR-0004) et `OCRProvider` (ADR-0007), une interface
`ImageProvider` isole la production d'image du reste de l'application :
`selectPhoto(spec)`, `generateIllustration(spec)`, `renderDiagram(spec)`.
Implémentations réelles (banque de photos sous licence, générateur d'images IA,
moteur SVG) interchangeables sans toucher au métier. **Au MVP : interfaces +
spécifications JSON + `MockImageProvider`** (même patron « interface et mock
d'abord » que l'OCR) ; les fournisseurs réels et leurs licences sont branchés
plus tard (décisions ouvertes : choix de la banque photo et du générateur IA).

## Conséquences

- Chaque illustration est liée à un `objective_id` et stockée avec sa `spec`
  JSON, son `image_type`, sa source (photo licenciée / IA / SVG) et sa licence.
- Changement de fournisseur d'images sans impact sur le reste (comme l'IA texte).
- Droits : la version canonique partagée (A-016) ne rediffuse pas de photo sous
  licence non transférable ; elle référence la spec, pas l'actif sous droits.
- Décisions ouvertes : fournisseur de photos sous licence et générateur
  d'illustrations IA (voir OPEN-QUESTIONS D-10, D-11).

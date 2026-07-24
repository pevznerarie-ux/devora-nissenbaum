# ADR-0008 — i18n fr/en/he, RTL, centralisation du branding

Statut : acceptée · Date : 2026-07-23

## Contexte

Localisation française dès le départ ; anglais et hébreu prévus dans
l'architecture, y compris les contenus RTL. Le nom « PedagoOS » est provisoire
et doit pouvoir changer sans chasse aux chaînes.

## Décision

- **Branding** : `packages/shared/src/branding.ts` exporte `PRODUCT_NAME` (et
  dérivés : nom court, nom légal, domaine). Interdiction de coder le nom en dur
  (UI, emails, exports, prompts, métadonnées) ; règle vérifiée par lint (regex
  sur « PedagoOS » hors branding.ts et docs).
- **i18n UI** : `next-intl`, messages par locale dans
  `packages/shared/src/i18n/{fr,en,he}.json` ; `fr` seule locale complète au
  MVP, `en`/`he` présentes en squelette pour garantir l'architecture.
- **Deux langues distinctes** : la langue de l'**UI** (préférence utilisateur)
  et la langue du **contenu pédagogique** (champ `language` sur les entités :
  documents, séquences, supports). Un support en hébreu se rend RTL dans une
  UI française.
- **RTL** : `dir` positionné par langue (UI au niveau `<html>`, contenu au
  niveau du conteneur du support) ; uniquement des propriétés CSS logiques et
  utilitaires Tailwind logiques (`ps-*`, `pe-*`, `text-start`, `start-*`) —
  jamais `left/right` directionnels ; exports PDF/PPTX RTL (voir ADR-0006).
- Formats dates/nombres via `Intl` avec la locale du contexte.

## Conséquences

- Renommage du produit = un fichier.
- Le coût RTL est payé en continu (conventions) plutôt qu'en refonte tardive.

## Renforcements D-8 (2026-07-23)

Le premier déploiement visible reste **français complet**, mais l'hébreu (RTL)
n'est jamais un ajout après coup — l'infrastructure est prête dès maintenant :

- **Code langue par contenu** : chaque entité pédagogique et chaque document
  porte son `language` (déjà en place). L'anglais existe dans le modèle mais
  n'est pas prioritaire au MVP.
- **Design system ltr/rtl** : `dir` piloté par la langue, **propriétés
  logiques uniquement** ; aucune concaténation supposant un sens gauche-droite.
- **RTL de bout en bout** : polices, tableaux, listes, numérotation et
  **exports** (PDF/PPTX) préparés pour le RTL.
- **Schémas JSON indépendants de la langue** : les schémas Zod du modèle
  pédagogique ne codent aucune langue ; la langue est une donnée, pas une
  structure.
- **Champs multilingues multi-versions** : un même contenu peut coexister en
  plusieurs langues comme **versions liées** (fr ↔ he), pas par écrasement —
  cohérent avec le Translation Engine (ADR-0012) et le versionnement (ADR-0011).

Principe : aucune décision technique ne doit bloquer l'hébreu.

# ADR-0016 — Visual Intelligence Engine : direction de la production visuelle

Statut : acceptée · Date : 2026-07-23 · Affine et étend ADR-0013.

## Contexte

L'ADR-0013 a posé le principe « le bon visuel au bon endroit » : décision
visuelle avant production, spécification JSON avant image, abstraction
`ImageProvider`, `MockImageProvider` d'abord. Le besoin s'est précisé : le
logiciel ne doit pas « ajouter des images » mais **diriger toute la production
visuelle** d'un support — décider s'il faut un visuel, lequel (photo réelle,
illustration IA, schéma vectoriel, carte, frise, graphique, source authentique,
image importée, asset de médiathèque), avec quelle exactitude, quel style selon
l'âge, quel format selon le support, quel contrôle qualité, quels droits, et
avec validation humaine.

## Décision

### 1. Nom et périmètre

Le module est nommé **Visual Intelligence Engine** (provisoire, centralisé dans
`shared/branding.ts` → `VISUAL_ENGINE_NAME`). Il intervient **après validation
du contenu pédagogique** et **avant la génération finale** des supports (fiche
professeur, support élève, slides, exercices, contrôle).

### 2. Sous-modules

- **Visual Director** — analyse chaque bloc, décide si un visuel est utile, sa
  fonction, le type recommandé, les contraintes, les alternatives ; produit un
  `VisualRequest`. « Aucun visuel » est une réponse légitime.
- **Visual Search Engine** — vraies photos et sources authentiques via plusieurs
  fournisseurs ; normalisation, déduplication, licences.
- **AI Illustration Engine** — génération/variation d'illustrations selon une
  charte, avec prompt structuré.
- **Diagram Engine** — schémas/frises/graphiques/cartes en **SVG** à partir de
  données JSON (jamais une image bitmap contenant du texte).
- **Visual Quality Reviewer** — analyse automatique avant validation humaine.
- **Media Library** — stockage, versions, licences, crédits, prompts, coûts,
  usages, réutilisation.
- **Visual Layout Adapter** — variantes par support (slide 16:9, A4, vignette…)
  par recadrage, jamais par étirement.

### 3. Réutilisation de l'architecture existante (ne rien dupliquer)

- **Visual Director** et **Quality Reviewer** sont de **nouvelles capacités IA**
  (`AnalyzeVisualNeeds`, `DesignImagePrompt`, `DesignDiagram`,
  `ReviewVisualQuality`) au-dessus de la couche existante (capacité → routeur →
  escalade → `AIProvider`, ADR-0014). Aucune nouvelle plomberie IA.
- **Media Library** suit le patron de la bibliothèque de sources : bucket privé,
  chemins préfixés `organization_id`, URL signées ≤ 600 s, RLS `is_educator` /
  `can_access_sequence`.
- **Rattachement aux blocs** : les blocs vivent en jsonb (ADR-0005, pas de table
  `lesson_blocks`) → table de liaison **`visual_usages(material_id, block_id,
asset_id, layout)`** ; un type de bloc `visual_ref` optionnel pourra ancrer le
  visuel dans le support (décision D-3 inchangée).
- **Modèle pur** : tous les schémas Zod, les **12 règles déterministes**
  (`chooseRecommendedType`), le builder de prompt et le générateur de crédits
  vivent dans `packages/pedagogy/src/visual/` (aucune dépendance base/réseau).

### 4. Fournisseurs abstraits (server-only)

Deux interfaces distinctes affinent l'`ImageProvider` d'ADR-0013 :
`VisualSearchProvider` (recherche : Unsplash, Pexels, **Wikimedia**, archives)
et `ImageGenerationProvider` (génération : OpenAI, Gemini). Le Diagram Engine
est **déterministe** (SVG), sans fournisseur. Au MVP : **mocks** + Wikimedia
(domaine public, sans clé) ; les autres fournisseurs sont différés (D-10/D-11) et
derrière **feature flags**. Aucune clé API côté client ; tous les appels serveur.

### 5. Règles déterministes avant IA

Douze règles tranchent les cas clairs sans appeler l'IA (données→graphique,
chronologie→frise, processus→schéma, personnage/œuvre historique→source
authentique, lieu/animal/plante→photo, scène fictive→illustration IA,
carte→carte vectorielle, asset validé→médiathèque, sujet sensible→validation
humaine, sans valeur→aucun visuel). Le Visual Director ne tranche que l'ambigu.

### 6. Exécution synchrone + table de statut (MVP)

Pas de worker/file au MVP : recherche, génération et contrôle qualité s'exécutent
dans les server actions (comme la génération de supports actuelle), avec une
table `visual_generation_jobs` porteuse des statuts
(queued/processing/completed/failed/cancelled) pour brancher une file réelle
plus tard sans changer le modèle.

### 7. Sécurité et confidentialité

Buckets **privés** `visuals` (pédagogique) et `visuals-personal` (données
élèves), URL signées. Aucun visuel externe sans métadonnées de licence ; un
visuel sans licence claire est **non publiable**. Les visuels marqués
`contains_minor`/`contains_personal_data` ne sont **jamais** envoyés à un
fournisseur IA externe sans `external_ai_processing_allowed` explicite (garde-fou
pur `maySendToExternalAi`). Aucun fichier utilisateur pour entraîner un modèle.

## Conséquences

- Un échec de production visuelle **ne bloque pas** la génération d'un cours :
  l'emplacement reste vide, le professeur reprend la main.
- Les visuels sont réutilisables ; licences, crédits, coûts et usages tracés.
- L'intégration aux **exports** (PDF/PPTX) dépend du package
  `document-generation` (roadmap Phase 9, non encore construit) : séquencée après.
- Décisions ouvertes maintenues : fournisseur photos (D-10), générateur IA et
  charte (D-11) — instruits par banc d'essai, ADR dédiés.

## Ordre d'implémentation (MVP)

Fondations pures + flags → Media Library → Visual Director (mock) → Diagram
Engine (SVG) → recherche photos (mock + Wikimedia) → illustrations IA (mock) →
Quality Reviewer → variantes supports → tests E2E. Exports et personnages
récurrents plus tard.

# Visual Intelligence Engine — architecture

## Emplacement dans le monorepo

- `packages/pedagogy/src/visual/` — **pur** : schémas Zod, règles déterministes
  (`chooseRecommendedType`), builder de prompt, générateur de crédits, garde-fous.
- `packages/ai/src/visual/` _(à venir)_ — capacités IA (Visual Director, prompt
  designer, diagram designer, quality reviewer) sur la couche capacité→routeur→
  escalade→`AIProvider` (ADR-0014).
- `packages/ai/src/providers/visual/` _(à venir)_ — `VisualSearchProvider`,
  `ImageGenerationProvider` + mocks + Wikimedia.
- `packages/ui/src/diagram/` _(à venir)_ — composants SVG React par type.
- `apps/web/src/features/visuals/` _(à venir)_ — server actions, queries, UI.

## Rattachement aux blocs

Les blocs vivent en jsonb (ADR-0005). Liaison via `visual_usages(material_id,
block_id, asset_id, layout)`. Régénération branchée sur `pedagogical_dependencies`.

## Exécution

Synchrone au MVP + table `visual_generation_jobs` (statuts) ; file réelle
branchable plus tard sans changer le modèle (ADR-0016 §6).

## Feature flags

`packages/shared/src/feature-flags.ts` — le logiciel fonctionne même si des
fournisseurs sont désactivés.

# Visual Intelligence Engine — vue d'ensemble

> Nom provisoire centralisé : `VISUAL_ENGINE_NAME` (`packages/shared/src/branding.ts`).
> Décision de référence : `docs/decisions/ADR-0016-visual-intelligence-engine.md`.

Le module dirige toute la production visuelle d'un support pédagogique : décider
s'il faut un visuel, lequel, avec quelle exactitude, quel style, quel format,
quel contrôle qualité et quels droits — toujours avec validation humaine.

## Flux général

```
contenu pédagogique validé
→ analyse des blocs (Visual Director)
→ VisualRequest (besoin, fonction, type, contraintes)
→ règles déterministes | classification IA
→ recherche (photos/sources) | génération (illustration) | rendu (schéma SVG)
→ contrôle qualité
→ vérification des droits
→ validation professeur
→ variantes par support (Layout Adapter)
→ stockage médiathèque
→ réutilisation future
```

## Sous-modules

Visual Director · Visual Search Engine · AI Illustration Engine · Diagram Engine
· Visual Quality Reviewer · Media Library · Visual Layout Adapter.

## Principe central

Pour chaque bloc, choisir entre : aucune image · photo réelle · illustration IA
· schéma vectoriel · graphique · carte · frise · source authentique · asset
médiathèque · image importée. Ne jamais générer une image quand une photo réelle
ou une source authentique est plus juste ; ne jamais produire en bitmap ce qui
doit être un SVG.

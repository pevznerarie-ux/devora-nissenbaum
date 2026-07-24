# ADR-0004 — Couche AIProvider abstraite, sorties structurées Zod, prompts versionnés

Statut : acceptée · Date : 2026-07-23

## Contexte

Toute la valeur pédagogique passe par des générations IA, mais la logique
métier ne doit dépendre d'aucun fournisseur, les sorties doivent être des
données structurées fiables, et chaque appel doit être traçable.

## Décision

- Package indépendant `packages/ai` exposant :

```ts
interface AIProvider {
  generateStructured<T>(
    req: StructuredGenerationRequest<T>,
  ): Promise<StructuredGenerationResult<T>>;
  analyzeDocument(req: DocumentAnalysisRequest): Promise<DocumentAnalysisResult>;
  analyzeImage(req: ImageAnalysisRequest): Promise<ImageAnalysisResult>;
}
```

- Implémentations : `AnthropicProvider` (défaut — A-004), `OpenAIProvider`,
  `MockAIProvider` (déterministe, utilisé en CI et développement).
- `generateStructured` reçoit un **schéma Zod cible** ; parsing + validation ;
  en cas d'échec de schéma : une relance bornée (avec l'erreur de validation en
  contexte), puis échec explicite `schema_failed` — jamais de réparation
  silencieuse.
- Prompts versionnés en fichiers immuables `src/prompts/<nom>/vN.ts` ; toute
  évolution = nouvelle version ; `prompt_name` + `prompt_version` journalisés.
- Journalisation systématique dans `ai_generations` (fournisseur, modèle,
  version du prompt, paramètres, utilisateur, objet, sortie brute en bucket
  privé, sortie validée, erreurs, durée, coût estimé).
- Contrat éditorial des prompts : citer les sources fournies, respecter le
  niveau, distinguer fait/interprétation/proposition, signaler l'incertain,
  ne jamais inventer de référence, respecter les objectifs validés, garantir
  progression et alignement cours ↔ évaluation.

## Conséquences

- Changement de fournisseur par configuration ; tests sans réseau ni coût.
- Les sorties brutes volumineuses vivent dans Storage (`ai-raw`), pas en table.

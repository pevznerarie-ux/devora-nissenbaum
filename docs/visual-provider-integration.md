# Visual Intelligence Engine — intégration des fournisseurs

Aucune clé API côté client. Tous les appels fournisseurs sont **serveur**.

## Recherche — `VisualSearchProvider`

`MockVisualSearchProvider` (dev) · `WikimediaSearchProvider` (domaine public,
sans clé, MVP) · Unsplash / Pexels (différés, D-10, flags). Chaque résultat :
id fournisseur, aperçu, URL fichier, dimensions, orientation, auteur, source,
licence, attribution, lien original, mots-clés, score, sécurité, filigrane,
indicateur mineur si détectable.

## Génération — `ImageGenerationProvider`

`MockImageProvider` (dev) · OpenAI / Gemini (différés, D-11, flags). Méthodes
`generate` / `edit` / `createVariations`. Journaliser fournisseur, modèle,
durée, coût, prompt, images de référence, erreurs.

## Sources authentiques

Architecture extensible (musées, bibliothèques nationales, archives, NASA…).
Premier fournisseur : Wikimedia. Les reconstitutions sont marquées comme telles.

## Variables d'environnement

Voir `.env.example` (aucune valeur réelle). Fournisseurs derrière feature flags.

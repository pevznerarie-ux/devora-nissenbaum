# Décisions ouvertes — arbitrage utilisateur requis

À trancher avant ou pendant le Sprint 1 ; chaque réponse devient un ADR ou une
mise à jour de `docs/assumptions.md`.

| # | Question | Options | Recommandation | Échéance |
|---|---|---|---|---|
| D-1 | ~~Où vit PedagoOS ?~~ **Tranchée le 2026-07-23** : PedagoOS vit dans ce dépôt ; les fichiers du projet boutique hérité ont été supprimés sur décision de l'utilisateur (cf. A-001). | — | — | Close |
| D-2 | Hébergement production de `apps/web` (contrainte : Chromium serveur pour les PDF). | (a) Vercel + fonction dédiée export ; (b) conteneur (Fly.io/Railway/Cloud Run) | **(b)** conteneur : Playwright/Chromium sans contorsions | Avant Phase 9 |
| D-3 | Granularité de l'éditeur en base. | (a) blocs en jsonb dans `material_versions` ; (b) table `lesson_blocks` par bloc | **(a)** au MVP (ADR-0005/0009) ; (b) seulement si collaboration temps réel | Sprint 1 (validation ADR) |
| D-4 | Fournisseur IA par défaut et modèles exacts (A-004), et budget coût/génération. | Anthropic / OpenAI / mixte par tâche | **Anthropic** par défaut, choix du modèle par type de tâche configurable | Avant Phase 7 |
| D-5 | OCR manuscrit : Google Cloud Vision ou Document AI. | Vision (simple, moins cher) / Document AI (structure, meilleure écriture manuscrite) | Instruire par un banc d'essai sur copies réelles ; ADR au démarrage du module scan | Module scan |
| D-6 | Référentiels officiels de compétences (socle commun, programmes) : import par organisation (A-010) ou référentiel partagé maintenu par la plateforme ? | import / partagé / hybride | Hybride à terme ; **import** au MVP | Avant Phase 6 |
| D-7 | SMTP/emails transactionnels (A-009). | SMTP Supabase par défaut / Resend ou équivalent | SMTP Supabase au MVP derrière une interface | Sprint 1 |
| D-8 | Langue(s) réellement nécessaires au premier déploiement (fr seul ? he ?) — influence la priorité du travail RTL. | fr / fr+he / fr+en+he | Architecture RTL dès le début (ADR-0008), traductions he/en à la demande | Avant Phase 8 |

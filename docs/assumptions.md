# PedagoOS — Hypothèses

Chaque hypothèse est explicite, numérotée, et doit être confirmée ou infirmée
par l'utilisateur. Une hypothèse infirmée déclenche la mise à jour des docs et,
si besoin, un ADR.

| # | Hypothèse | Impact si infirmée |
|---|---|---|
| A-001 | **Dépôt** — *résolue le 2026-07-23* : ce dépôt contenait un projet antérieur sans rapport (site vitrine + CRM boutique). L'utilisateur a décidé de développer PedagoOS ici et a autorisé la suppression des fichiers hérités (`index.html`, `crm.html`, `crm.js`, `commande.html`, `styles.css`, `QUESTIONNAIRE.md`), effectuée sur cette branche. L'historique git conserve l'ancien projet. | — |
| A-002 | Hébergement : Supabase cloud (projet managé) + Vercel ou équivalent pour Next.js ; pas d'auto-hébergement au MVP. | Ajustement CI/CD et gestion des secrets. |
| A-003 | Gestionnaire de paquets : pnpm + Turborepo (non imposés par la commande, choisis en ADR-0001). | Remplacement par npm/yarn/Nx, faible coût avant Phase 2. |
| A-004 | Fournisseur IA par défaut : Anthropic (AnthropicProvider), OpenAI en second ; MockAIProvider en CI et développement. | Simple changement de provider par configuration. |
| A-005 | Référentiel de niveaux : système français (CP → Terminale) par défaut, stocké comme code texte extensible par organisation (écoles hors système français possibles, notamment Israël — cf. support hébreu). | Ajout de référentiels de niveaux par pays. |
| A-006 | Tâches longues (extraction, générations, exports) exécutées dans le serveur Next.js avec état en base ; pas de file d'attente externe au MVP (abstraction `JobRunner` prévue). | Introduction d'une file (ex. pg-boss/Trigger.dev) derrière l'abstraction. |
| A-007 | Échelle de notation par défaut : /20, configurable par organisation (`grading_scale`). | Configuration supplémentaire, pas de refonte. |
| A-008 | Cadre réglementaire visé : RGPD (France/UE) en priorité ; conformité locale israélienne (Privacy Protection Law) à instruire avant tout déploiement en Israël. | Revue juridique complémentaire, champs de consentement additionnels. |
| A-009 | Les invitations partent par email via Supabase Auth (SMTP configuré par l'hébergeur) ; pas de fournisseur email dédié au MVP. | Ajout d'un provider transactionnel (Resend…) derrière une interface. |
| A-010 | Le programme officiel n'est pas embarqué dans le produit : chaque organisation importe ses documents de programme dans la bibliothèque (`curriculum_units` pointe vers un `source_document`). | Constitution d'un référentiel programme partagé, travail éditorial dédié. |
| A-011 | Élèves sans compte au MVP (entités `students` sans `profile_id`) ; l'accès élève aux contenus publiés arrive quand les comptes élèves seront activés. | Provisioning de comptes élèves + politiques RLS élèves activées plus tôt. |
| A-012 | L'extraction de texte des PDF/DOCX se fait côté serveur Node (pdf non scanné : parsing direct ; images/PDF scannés : différé avec le module OCR). | Recours anticipé au service image/OCR. |

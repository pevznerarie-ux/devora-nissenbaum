# ADR-0015 — Hébergement V1 : Railway (conteneurs) + Supabase Cloud (base unique)

Statut : acceptée · Date : 2026-07-23 · Précise ADR-0002 et A-002. **Clôt D-2.**

## Contexte

Il faut un hébergement pour le développement, la bêta et les premiers
déploiements (1-2 écoles), portable et sans verrou fournisseur. Contrainte
forte : **une seule base de données principale** — ne pas cumuler Railway
PostgreSQL et Supabase PostgreSQL.

## Décision

- **Compute : Railway.** Les services sont des **conteneurs Docker** (app
  Next.js ; futur service image FastAPI, ADR-0007), en **région européenne**,
  avec environnements séparés **development / staging / production**.
  Configuration **uniquement par variables d'environnement**. Aucun stockage
  métier persistant dans le filesystem local des conteneurs (éphémères).
- **Base unique : Supabase Cloud.** Tout le socle du produit est déjà
  Supabase (Auth, RLS, Storage) : on garde **Supabase comme base principale
  unique** — PostgreSQL standard + Auth + RLS + Storage compatible S3 (buckets
  privés, URL signées). **Railway PostgreSQL n'est pas utilisé** (pas de double
  base). Région EU côté Supabase également.
- **Portabilité.** Rien de spécifique à Railway dans le métier : conteneurs
  Docker standard, Postgres standard, API S3 pour les fichiers, secrets par
  variables d'environnement. Migration ultérieure vers AWS/GCP/Azure possible
  sans réécriture importante (changer le plan de compute + pointer une autre
  instance Postgres/S3).
- **PDF/Chromium** : le conteneur Railway exécute Playwright/Chromium sans
  contorsion (résout la contrainte export PDF d'ADR-0006).

## Conséquences

- À faire au moment du déploiement (pas maintenant) : `Dockerfile` de
  `apps/web`, fichier de config Railway par environnement, `.env` par
  environnement, provisioning Supabase EU (dev/staging/prod).
- `.env.example` reste la source de vérité des variables ; aucune valeur dans
  le dépôt. Storage = Supabase (S3-compatible) ; pas de bucket S3 tiers au MVP.
- A-002 est mise à jour ; D-2 close.

# ADR-0002 — Supabase comme backend (Postgres, Auth, Storage, RLS)

Statut : acceptée (imposée par la commande) · Date : 2026-07-23

## Contexte

La stack impose Supabase PostgreSQL, Supabase Auth, Supabase Storage et la RLS.

## Décision

- PostgreSQL Supabase comme unique base de données ; migrations SQL versionnées
  dans `supabase/migrations`, appliquées par la CLI Supabase ; stack locale
  (`supabase start`) pour le développement et les tests RLS.
- Supabase Auth pour l'identité (email/mot de passe + magic link) ; sessions
  gérées côté serveur Next.js via `@supabase/ssr` (cookies httpOnly).
- Storage en buckets **privés** uniquement, accès par URL signée.
- Types TypeScript générés depuis le schéma (`pnpm db:types`) dans
  `packages/database` — jamais écrits à la main.
- Deux clients : client « utilisateur » (anon key + session, RLS active) pour
  tout le métier ; client `service_role` réservé aux opérations système côté
  serveur (invitations, jobs).

## Conséquences

- La RLS devient le socle de sécurité : chaque table exige des politiques
  explicites et testées (voir ADR-0003 et `docs/data-model.md` §9).
- Dépendance à un fournisseur ; atténuée par du SQL standard et des migrations
  portables.

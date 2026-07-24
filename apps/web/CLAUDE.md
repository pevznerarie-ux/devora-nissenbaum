# apps/web — conventions locales

- **Lecture** : React Server Components + client Supabase utilisateur
  (`@/lib/supabase/server`), RLS active. **Écriture** : server actions dans
  `src/features/<domaine>/actions.ts`, contrat : Zod → autorisation → DB →
  audit → `ActionResult<T>` (jamais d'exception brute vers le client).
- Un dossier `src/features/<domaine>` par domaine métier
  (`components`, `actions.ts`, `queries.ts`, `schemas.ts`). `src/app` ne
  contient que le routage et la composition.
- Toute chaîne visible passe par next-intl (`@pedagoos/shared/i18n/*`) ;
  jamais de texte en dur, jamais le nom du produit en dur (`PRODUCT_NAME`).
- RTL : propriétés logiques uniquement (`ps-*`, `pe-*`, `text-start`,
  `border-e`…) ; jamais `pl-*`/`ml-*`/`left-*` directionnels.
- Composants UI génériques dans `@pedagoos/ui` ; ici uniquement des composants
  métier.
- Le client `service_role` n'est jamais importé dans ce package ailleurs que
  dans du code serveur explicitement système (invitations, jobs).

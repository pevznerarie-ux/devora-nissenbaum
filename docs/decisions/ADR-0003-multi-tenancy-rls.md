# ADR-0003 — Multi-tenancy à schéma partagé, isolation par organization_id + RLS

Statut : acceptée · Date : 2026-07-23

## Contexte

Plusieurs organisations (chacune avec plusieurs établissements) partagent la
plateforme. Exigence absolue : aucune donnée ne traverse la frontière d'une
organisation. Un professeur peut appartenir à plusieurs établissements.

## Décision

- **Schéma partagé** : toutes les organisations dans les mêmes tables, chaque
  entité métier portant `organization_id` (dénormalisé quand la table n'a pas
  de FK directe vers `organizations`, ex. `source_chunks`, `material_versions`,
  pour des politiques RLS simples et indexables).
- Appartenances via `memberships` (org × rôle) et `school_memberships`
  (établissement), permettant le multi-établissements.
- RLS activée sur toutes les tables, politiques construites sur des fonctions
  SQL `security definer stable` (`is_member_of`, `has_role`, `teaches_class`,
  `is_school_member`) pour lisibilité, performance (initPlan) et testabilité.
- Défense en profondeur : les server actions vérifient aussi l'autorisation
  applicative ; la RLS est le dernier rempart, pas le seul.
- `audit_logs` append-only (aucune politique UPDATE/DELETE).

## Conséquences

- Opérations et migrations simples (une base) ; coût maîtrisé.
- Tests RLS obligatoires en CI : accès légitime, refus inter-organisations,
  refus inter-établissements, restrictions élève.

## Alternatives rejetées

- Schéma-par-tenant ou base-par-tenant : isolation plus forte mais opérations,
  migrations et agrégats plateforme beaucoup plus lourds ; injustifié au MVP.

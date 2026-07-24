# ADR-0001 — Monorepo pnpm + Turborepo, monolithe modulaire Next.js

Statut : acceptée · Date : 2026-07-23

## Contexte

Le produit couvre de nombreux domaines (organisations, classes, bibliothèque,
séquences, IA, exports, scan). La commande impose un monolithe modulaire
Next.js et interdit les microservices inutiles, tout en exigeant des packages
séparés (`ui`, `database`, `ai`, `pedagogy`, `document-generation`, `shared`).

## Décision

- Monorepo **pnpm workspaces + Turborepo** (cache de build, pipelines lint/
  typecheck/test par package).
- Une seule application déployée : `apps/web` (Next.js App Router). Les
  frontières de domaine vivent dans les packages et dans `src/features/*`, pas
  dans des services réseau.
- Unique exception : `services/image-processing` (FastAPI + OpenCV), différé —
  voir ADR-0007.
- Règles de dépendance strictes (voir `docs/architecture.md` §2), vérifiées par
  ESLint (`import/no-restricted-paths` ou équivalent).

## Conséquences

- Déploiement et opérations simples ; refactorings inter-domaines faciles.
- La discipline de frontières repose sur le lint et la revue, pas sur le réseau.
- Extraction ultérieure d'un service possible car les packages sont découplés.

## Alternatives rejetées

- Nx : plus lourd sans bénéfice au MVP. Multi-repos : friction inutile.
- Microservices par domaine : interdits par la commande, injustifiés à ce stade.

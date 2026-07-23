# CLAUDE.md — PedagoOS

> Nom de travail : **PedagoOS** (provisoire). Tout nom visible doit passer par la
> constante centralisée `packages/shared/src/branding.ts` (`PRODUCT_NAME`). Ne jamais
> écrire le nom du produit en dur dans l'UI, les prompts, les exports ou les emails.

## 1. Vision produit

PedagoOS est un système d'exploitation pédagogique SaaS pour écoles primaires et
secondaires, multi-organisations et multi-établissements. Il relie tout le cycle
pédagogique en données structurées et continues :

```
programme & sources → objectifs d'apprentissage → séquence → cours
→ support professeur → support élève → présentation écran → exercices
→ contrôle → copie corrigée → résultats par compétence → recommandations
→ prochaine séquence adaptée
```

Ce n'est **pas** un générateur de texte ni de documents : chaque production est
un objet structuré (blocs pédagogiques JSON validés par Zod), relié aux
objectifs, compétences, sources et résultats des élèves, et versionné dans le
temps. PedagoOS accompagne le professeur dans une **boucle itérative** :
Concevoir → Prévisualiser → Modifier → Valider → Générer → Améliorer. La
génération est toujours **preview-first** (aperçu validé avant tout dossier
complet — ADR-0010), **incrémentale** (régénération partielle par graphe de
dépendances — ADR-0011), orchestrée par des **moteurs IA spécialisés**
(ADR-0012), et **illustrée à bon escient** (le bon visuel au bon endroit —
ADR-0013).

Documents de référence : `docs/product-requirements.md`, `docs/architecture.md`,
`docs/data-model.md`, `docs/privacy-and-security.md`, `docs/roadmap.md`,
`docs/assumptions.md`, `docs/decisions/` (ADR).

## 2. Architecture

Monolithe modulaire Next.js (App Router) dans un monorepo pnpm. Pas de
microservices, à une exception : un service Python FastAPI (`services/image-processing`)
uniquement pour le prétraitement d'image des scans de copies (OpenCV), différé
après le MVP (interfaces et mocks d'abord — voir ADR-0007).

```
apps/web                    Next.js App Router (UI + server actions + routes API)
services/image-processing   FastAPI + OpenCV (post-MVP, mocké au départ)
packages/ui                 Design system (shadcn/ui + Tailwind), composants purs
packages/database           Types DB, client Supabase, migrations, seeds, tests RLS
packages/ai                 Abstraction fournisseurs IA, prompts versionnés, schémas de sortie
packages/pedagogy           Modèle pédagogique (types + schémas Zod + logique métier pure)
packages/document-generation PDF (Playwright/Chromium), PPTX (PptxGenJS), DOCX
packages/shared             Constantes (branding, rôles), i18n, utilitaires, erreurs
docs                        Spécifications, ADR, hypothèses
skills                      Skills Claude Code du projet
supabase                    Config Supabase locale, migrations SQL
```

Règles de dépendance : `apps/web` dépend des packages ; les packages ne dépendent
jamais de `apps/web` ; `pedagogy` et `shared` sont purs (aucune dépendance à
Supabase, Next.js ou un fournisseur IA) ; `ai` ne connaît pas la base de données.

## 3. Stack imposée

Next.js App Router · TypeScript strict · React · Tailwind CSS · shadcn/ui ·
Supabase (PostgreSQL, Auth, Storage, RLS) · Zod · React Hook Form · Vitest ·
Playwright (E2E **et** rendu PDF) · PptxGenJS · Sentry · PostHog (derrière feature
flag) · FastAPI + OpenCV (scan uniquement) · Google Cloud Vision / Document AI
derrière une interface OCR abstraite.

## 4. Commandes

Gestionnaire : **pnpm** + Turborepo. Depuis la racine :

```
pnpm install              # installation
pnpm dev                  # apps/web en développement
pnpm build                # build complet
pnpm lint                 # ESLint sur tout le monorepo
pnpm typecheck            # tsc --noEmit sur tout le monorepo
pnpm test                 # Vitest (unitaires + intégration)
pnpm test:rls             # tests RLS contre Supabase local
pnpm test:e2e             # Playwright
pnpm db:start             # supabase start (stack locale)
pnpm db:migrate           # applique les migrations
pnpm db:reset             # reset + migrations + seed
pnpm db:types             # régénère les types TypeScript depuis le schéma
```

Après chaque étape significative : `pnpm lint && pnpm typecheck && pnpm test`.

## 5. Règles de sécurité (non négociables)

1. Aucune clé secrète côté client. `SUPABASE_SERVICE_ROLE_KEY`, clés IA, DSN privés :
   serveur uniquement. Seules les variables `NEXT_PUBLIC_*` explicitement listées
   dans `docs/architecture.md` sont exposées.
2. Toute table exposée via PostgREST a des politiques RLS **explicites** (pas de
   table sans RLS activée). Les politiques sont testées (`pnpm test:rls`).
3. Jamais de données inter-organisations : toute requête métier est bornée par
   `organization_id` ; la RLS est la garantie de dernier ressort, pas la seule.
4. Toute entrée (formulaires, routes API, server actions, webhooks, sorties IA)
   est validée par un schéma Zod avant usage.
5. Les fichiers (sources, copies, exports) sont dans des buckets **privés** ;
   accès uniquement par URL signée à durée courte, jamais d'URL publique.
6. Les opérations sensibles (pédagogiques et administratives) écrivent dans
   `audit_logs` : qui, quoi, quand, sur quel objet, dans quelle organisation.
7. Données de mineurs : minimisation stricte — voir `docs/privacy-and-security.md`.
   Jamais d'usage des données élèves pour entraîner un modèle sans accord explicite.
8. Les journaux applicatifs ne contiennent ni nom d'élève, ni contenu de copie,
   ni token — identifiants opaques uniquement.

## 6. Règles de qualité

1. Lire les fichiers existants avant toute modification.
2. Présenter un plan avant toute modification importante.
3. Petites étapes vérifiables ; lint + typecheck + tests après chaque étape.
4. Interdits absolus : `any` (sauf justification commentée impossible autrement),
   `@ts-ignore`/`@ts-expect-error` sans ticket, `catch` vide, assertions `as` pour
   contourner une erreur de type, tests désactivés pour « faire passer la CI ».
5. Toute génération IA produit une sortie **structurée** validée par un schéma Zod ;
   une sortie invalide est une erreur enregistrée, jamais silencieusement corrigée.
6. Toute correction ou proposition IA est revue et modifiable par un humain avant
   de faire foi (statut `proposed` → validation professeur).
7. Ne jamais présenter une hypothèse IA comme un fait : les sorties distinguent
   fait / interprétation / proposition pédagogique, avec citations de sources.
8. i18n dès le départ : français par défaut, anglais et hébreu prévus, RTL
   supporté (aucune valeur de `direction`/`margin-left` codée en dur — utiliser
   les propriétés logiques CSS et les utilitaires Tailwind logiques).
9. Accessibilité : navigation clavier, labels, contrastes AA, états de chargement,
   messages d'erreur utiles, impression A4 correcte.

## 7. Décisions techniques

Les décisions sont consignées en ADR dans `docs/decisions/`. Résumé :

- ADR-0001 : monorepo pnpm + Turborepo, monolithe modulaire Next.js.
- ADR-0002 : Supabase comme backend (Postgres, Auth, Storage, RLS).
- ADR-0003 : multi-tenancy à schéma partagé, isolation par `organization_id` + RLS.
- ADR-0004 : couche `AIProvider` abstraite, sorties structurées Zod, prompts versionnés.
- ADR-0005 : éditeur par blocs pédagogiques structurés (pas d'éditeur riche générique).
- ADR-0006 : PDF via Playwright/Chromium, PPTX via PptxGenJS, DOCX best-effort.
- ADR-0007 : service image FastAPI différé ; interfaces, tables et mocks OCR d'abord.
- ADR-0008 : i18n fr/en/he, RTL, centralisation du branding.
- ADR-0009 : versionnement des supports (autosave, versions, statuts).
- ADR-0010 : génération en deux temps (preview-first) + édition par intentions.
- ADR-0011 : objets versionnés, graphe de dépendances, régénération partielle.
- ADR-0012 : moteurs IA spécialisés au-dessus de `AIProvider`.
- ADR-0013 : sous-système d'illustrations (décision visuelle, spec JSON, `ImageProvider`).
- ADR-0014 : runtime IA — couche fournisseur, API par capacité, routage par niveau
  de modèle (Sonnet/Haiku/Opus), caching, batch, monitoring (clôt D-4).
- ADR-0015 : hébergement V1 — Railway (conteneurs Docker, EU) + Supabase Cloud
  comme base unique (Postgres/Auth/RLS/Storage S3) ; portable (clôt D-2).
- ADR-0016 : Visual Intelligence Engine — direction de la production visuelle
  (Director, Search, Illustration, Diagram, Quality, Media Library, Layout),
  règles déterministes, providers abstraits, exécution synchrone + jobs, affine
  ADR-0013.

Toute nouvelle décision structurante = nouvel ADR. Toute hypothèse = entrée dans
`docs/assumptions.md`.

## 8. Interdictions

- Ne pas créer de microservices hors `services/image-processing`.
- Ne pas lier la logique métier à un fournisseur IA précis (toujours via `packages/ai`).
- Ne pas construire d'éditeur WYSIWYG générique ; uniquement des blocs structurés.
- Ne pas exposer une interface « chat avec l'IA » générique ; formulaires
  structurés et choix pédagogiques explicites.
- Ne pas stocker de secrets dans le dépôt, ni dans le bundle client.
- Ne pas contourner la RLS avec la clé service_role pour des lectures métier
  côté requêtes utilisateur.
- Ne pas inventer de références ou de citations dans les prompts/sorties IA.
- Ne pas écrire le nom du produit en dur (passer par `PRODUCT_NAME`).

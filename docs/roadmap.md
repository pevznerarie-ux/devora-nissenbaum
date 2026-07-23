# PedagoOS — Feuille de route

Statut : version 1. Dix phases, regroupées en sprints. Chaque phase se termine
par : fichiers créés/modifiés, décisions prises, commandes exécutées, résultats
des tests, risques restants, prochaine étape recommandée.

## Vue d'ensemble des phases

| Phase | Contenu                                                                                                                                               | Sortie vérifiable                                            |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1     | Cadrage : PRD, architecture, modèle de données, sécurité, CLAUDE.md, ADR                                                                              | Docs relus et validés (**cette PR**)                         |
| 2     | Monorepo pnpm+Turborepo, TS strict, ESLint/Prettier, Vitest, Playwright, design system (packages/ui), Supabase Auth (login/logout/invitation)         | `pnpm lint && pnpm typecheck && pnpm test` verts ; login E2E |
| 3     | Migrations complètes, fonctions RLS, politiques RLS, tests de sécurité                                                                                | `pnpm test:rls` vert, refus inter-org prouvés                |
| 4     | Organisations, écoles, utilisateurs, classes, élèves (+ import CSV), années scolaires                                                                 | CRUD complets testés, audit_logs actifs                      |
| 5     | Bibliothèque de sources : upload, extraction texte, états, recherche                                                                                  | Import PDF/DOCX/TXT/image → texte recherché                  |
| 6     | Modèle pédagogique (packages/pedagogy) + assistant de séquence (6 étapes)                                                                             | Assistant complet avec MockAIProvider                        |
| 7     | Couche IA réelle : AnthropicProvider, OpenAIProvider, prompts versionnés, journal ai_generations                                                      | Génération structurée validée Zod + journalisée              |
| 8     | Supports générés + éditeur par blocs (autosave, versions, statuts, restauration)                                                                      | Les 5 types de supports éditables                            |
| 9     | Exports PDF/PPTX (+DOCX best-effort), variantes prof/élève/corrigé                                                                                    | Exports conformes A4/RTL                                     |
| 10    | E2E complet du parcours obligatoire, données de démonstration, préparation scan (interfaces, tables, mock OCR, écran démo, docs/scan-architecture.md) | Parcours E2E 13 étapes vert en CI                            |

## Sprint 1 (premier sprint de développement — Phases 2 et 3)

Objectif : une base saine sur laquelle tout le reste s'appuie. Périmètre :

1. **Initialisation** : monorepo pnpm + Turborepo ; `apps/web` (Next.js App
   Router, TS strict) ; packages `shared`, `ui`, `database`, `pedagogy` (squelettes) ;
   `.env.example` ; CI (lint + typecheck + tests) ; `PRODUCT_NAME` centralisé.
2. **Qualité** : ESLint (+ règles de dépendances inter-packages), Prettier,
   Vitest configuré par package, Playwright configuré (Chromium pré-installé).
3. **Design system** : tokens Tailwind, thème clair calme et lisible, shadcn/ui
   initialisé dans `packages/ui`, gabarits de page (navigation à 8 entrées),
   support RTL par propriétés logiques.
4. **Base de données** : Supabase local, migrations des tables §1-2 du modèle
   de données (identité + structure scolaire), fonctions RLS, politiques RLS de
   ces tables, `pnpm db:*`.
5. **Authentification** : login/logout, middleware de session, création de
   profil à l'inscription, invitation par email avec rôle (org_admin invite un
   professeur), page d'acceptation.
6. **Tests** : unitaires (schémas Zod, rôles), RLS (membres/refus inter-org),
   E2E minimal (login → dashboard vide).

Critère de fin de sprint : un org_admin peut se connecter, créer son
organisation et un établissement, inviter un professeur qui se connecte et voit
un tableau de bord vide — le tout couvert par lint, typecheck, tests unitaires,
tests RLS et un E2E.

Hors sprint 1 : toute fonctionnalité pédagogique, toute IA, tout export.

## Parcours E2E obligatoire (Phase 10, construit progressivement dès la Phase 4)

1. créer une organisation ; 2. créer un établissement ; 3. inviter un
   professeur ; 4. créer une classe ; 5. ajouter des élèves ; 6. importer une
   source ; 7. créer une séquence ; 8. générer une proposition (MockAIProvider en
   CI) ; 9. modifier et valider ; 10. générer les supports ; 11. exporter la fiche
   professeur ; 12. exporter le support élève ; 13. exporter la présentation.

## Skills Claude Code

Les 12 skills (`product-architect`, `education-domain-expert`,
`curriculum-architect`, `lesson-material-designer`, `assessment-designer`,
`learning-analytics`, `data-privacy-reviewer`, `security-auditor`,
`qa-engineer`, `ui-ux-education`, `document-renderer`, `ocr-grading-engineer`)
sont créées dans `/skills` au début du Sprint 1 (Phase 2), chacune précisant :
objectif, champ d'intervention, fichiers à lire, processus, critères
d'acceptation, format de sortie, interdictions.

## Risques principaux et parades

| Risque                                  | Parade                                                                                               |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| RLS incomplète → fuite inter-org        | Politiques écrites avec les tables (Phase 3), testées en CI, checklist §9 de privacy-and-security.md |
| Sorties IA non conformes au schéma      | `generateStructured` + relance bornée + échec explicite journalisé ; MockAIProvider en CI            |
| Éditeur trop ambitieux                  | Blocs structurés uniquement (ADR-0005), pas de WYSIWYG                                               |
| Extraction PDF/DOCX de qualité variable | État `failed` visible + ressaisie possible ; qualité améliorée itérativement                         |
| Fidélité DOCX                           | Best-effort assumé (ADR-0006), PDF fait référence                                                    |

## Re-séquencement suite aux extensions obligatoires (2026-07-23)

Les exigences preview-first, régénération intelligente, historique de versions,
moteurs IA spécialisés et illustrations (ADR-0010 à 0013) s'intègrent ainsi :

| Phase                  | Ajouts                                                                                                                                                                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6 (modèle + assistant) | Étend l'assistant : Blueprint → **aperçu interactif** (~5 écrans) → validation → génération → **contrôle qualité** → export. Statuts `preview_ready`.                                                                               |
| 7 (couche IA)          | Introduit la **couche moteurs** (Curriculum, Lesson, Assessment, Translation, Citation, Review, Quality) au-dessus de `AIProvider` ; routage de modèle par moteur (D-4).                                                            |
| 7bis (nouveau)         | **Régénération intelligente** : objets `version/status/locked/dependencies`, graphe `pedagogical_dependencies`, planificateur de régénération partielle ; **historique** par objet (compare/restore/merge).                         |
| 8 (supports + éditeur) | **Édition par intentions** (actions rapides + instruction ciblée → `EditIntent`), pas de chat générique.                                                                                                                            |
| 8bis (nouveau)         | **Sous-système d'illustrations** : moteur de décision visuelle, spécifications JSON, `ImageProvider` + `MockImageProvider`, trois types (photo licenciée / IA / schéma) ; écran de rendu. Fournisseurs réels différés (D-10, D-11). |
| 9 (exports)            | Export intègre les illustrations et respecte le contrôle qualité préalable.                                                                                                                                                         |

Principe directeur (rappel) : **PedagoOS n'est pas un générateur de documents,
c'est un système d'exploitation pédagogique** — boucle Concevoir → Prévisualiser
→ Modifier → Valider → Générer → Améliorer.

### Arbitrages de construction (2026-07-23)

- **Ordre** : suivre la roadmap re-séquencée (6 → 7 → 7bis → 8 → 8bis → 9),
  sans priorisation hors-phase.
- **Illustrations** : au sein de la Phase 8bis, **schémas vectoriels (Type 3)
  en premier** (coût minimal, aucun problème de droits), puis photographies
  sous licence (Type 1), puis illustrations IA (Type 2).

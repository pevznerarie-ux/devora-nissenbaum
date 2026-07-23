# PedagoOS — Architecture

Statut : version 1 — proposée en Phase 1, à valider avant initialisation.

## 1. Vue d'ensemble

Monolithe modulaire **Next.js (App Router)** dans un monorepo **pnpm + Turborepo**.
Un seul service séparé, différé : `services/image-processing` (Python FastAPI +
OpenCV) pour le prétraitement des scans de copies, car ce traitement d'image ne
peut pas vivre raisonnablement dans Node (ADR-0007).

```
┌─────────────────────────────────────────────────────────────┐
│ apps/web (Next.js App Router)                               │
│  UI (RSC + client components) · Server Actions · Route      │
│  Handlers · middleware auth · i18n                          │
└──────┬───────────────┬──────────────┬───────────────────────┘
       │               │              │
┌──────▼─────┐  ┌──────▼──────┐  ┌────▼──────────────────┐
│ packages/  │  │ packages/ai │  │ packages/document-    │
│ pedagogy   │  │ (providers, │  │ generation (PDF/PPTX/ │
│ (types+Zod)│  │  prompts)   │  │ DOCX)                 │
└──────┬─────┘  └──────┬──────┘  └────┬──────────────────┘
       │               │              │
┌──────▼───────────────▼──────────────▼───────────────────────┐
│ packages/database (client Supabase, types générés, seeds)   │
└──────┬──────────────────────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────────────────┐
│ Supabase : PostgreSQL + RLS · Auth · Storage (privé)        │
└─────────────────────────────────────────────────────────────┘

  (post-MVP) services/image-processing : FastAPI + OpenCV,
  appelé serveur→serveur uniquement, jamais depuis le client.
```

## 2. Arborescence proposée

```
/
├── CLAUDE.md
├── package.json / pnpm-workspace.yaml / turbo.json
├── .env.example
├── apps/
│   └── web/
│       ├── CLAUDE.md                # conventions App Router locales
│       ├── src/app/
│       │   ├── (auth)/              # login, invitation, reset
│       │   ├── (dashboard)/         # accueil, classes, sequences,
│       │   │                        # bibliotheque, evaluations, eleves,
│       │   │                        # analyses, administration
│       │   └── api/                 # route handlers (webhooks, exports)
│       ├── src/features/            # modules métier (un dossier par domaine)
│       │   ├── auth/  organizations/  classes/  students/
│       │   ├── library/  sequences/  materials/  assessments/
│       │   ├── exports/  scan/ (démo mockée)  admin/
│       │   └── */ {components,actions,queries,schemas,hooks}
│       ├── src/lib/                 # supabase server/client, i18n, sentry
│       └── e2e/                     # tests Playwright
├── services/
│   └── image-processing/            # FastAPI + OpenCV (post-MVP, stub + doc)
│       └── CLAUDE.md
├── packages/
│   ├── ui/                          # design system shadcn/ui + tokens
│   ├── database/
│   │   ├── src/types.gen.ts         # types générés depuis le schéma
│   │   ├── src/client/              # createServerClient / createBrowserClient
│   │   └── tests/rls/               # tests des politiques RLS
│   ├── ai/
│   │   ├── CLAUDE.md
│   │   ├── src/provider.ts          # interface AIProvider
│   │   ├── src/providers/{anthropic,openai,mock}.ts
│   │   ├── src/prompts/<nom>/vN.ts  # prompts versionnés
│   │   └── src/schemas/             # schémas Zod des sorties
│   ├── pedagogy/                    # modèle pédagogique pur (types + Zod)
│   ├── document-generation/         # pdf.ts (Playwright), pptx.ts, docx.ts
│   └── shared/                      # branding.ts, roles.ts, i18n, erreurs
├── supabase/
│   ├── config.toml
│   ├── migrations/                  # SQL numéroté
│   └── seed.sql
├── docs/
│   ├── product-requirements.md  architecture.md  data-model.md
│   ├── privacy-and-security.md  roadmap.md  assumptions.md
│   ├── scan-architecture.md         # (à écrire avec le module scan)
│   └── decisions/ADR-*.md
└── skills/                          # 12 skills Claude Code du projet
```

Règles de dépendance (vérifiées par lint) :

- `apps/web` → tous les packages ; jamais l'inverse.
- `pedagogy` et `shared` : purs, zéro dépendance runtime externe (hors Zod).
- `ai` : ne connaît ni la DB ni Next.js ; reçoit et rend des objets validés.
- `document-generation` : reçoit des blocs pédagogiques, rend des fichiers ;
  ne connaît pas la DB.
- `database` : seul point d'accès à Supabase.

## 3. Couches applicatives

**Lecture** : React Server Components → requêtes via `packages/database` avec le
client Supabase _au nom de l'utilisateur_ (RLS active).

**Écriture** : Server Actions uniquement, chacune suit le même contrat :

1. validation Zod de l'entrée ; 2. vérification d'autorisation applicative
   (rôle + appartenance) ; 3. opération DB (RLS en dernier rempart) ;
2. écriture `audit_logs` si sensible ; 5. retour typé `{ ok } | { error }`.

**Tâches longues** (extraction de texte, générations IA, exports) : exécutées
côté serveur avec suivi d'état en base (`pending/processing/ready/failed`) et
polling/revalidation côté client. Pas de file d'attente externe au MVP
(hypothèse A-006) ; l'abstraction `JobRunner` permet d'en brancher une plus tard.

**Clé service_role** : uniquement côté serveur, uniquement pour les opérations
système (invitations, jobs, migrations de données), jamais pour servir des
lectures métier d'une requête utilisateur.

## 4. Authentification et autorisation

- Supabase Auth (email/mot de passe + magic link). Invitation par email avec rôle
  pré-assigné (table `invitations` gérée côté serveur).
- Identité : `auth.users` → `profiles` (1-1). Appartenances : `memberships`
  (utilisateur × organisation × rôle) et `school_memberships` (rattachement
  établissement). Rôles définis dans `packages/shared/src/roles.ts` :
  `platform_admin`, `org_admin`, `school_director`, `pedagogical_lead`,
  `teacher`, `grader`, `student`, `parent`.
- Autorisation à deux niveaux : vérification applicative explicite dans chaque
  server action **et** RLS en base. Les politiques RLS s'appuient sur des
  fonctions SQL `security definer` (`is_member_of(org_id)`, `has_role(org_id,
role)`, `teaches_class(class_id)`) pour rester lisibles et testables.

## 5. Couche IA (`packages/ai`)

```ts
interface AIProvider {
  generateStructured<T>(
    req: StructuredGenerationRequest<T>,
  ): Promise<StructuredGenerationResult<T>>;
  analyzeDocument(req: DocumentAnalysisRequest): Promise<DocumentAnalysisResult>;
  analyzeImage(req: ImageAnalysisRequest): Promise<ImageAnalysisResult>;
}
```

- Implémentations : `AnthropicProvider` (défaut, hypothèse A-004),
  `OpenAIProvider`, `MockAIProvider` (tests et développement hors ligne).
- `generateStructured` prend un schéma Zod cible ; la sortie est parsée et
  validée ; en cas d'échec, une relance bornée avec message d'erreur de schéma,
  puis échec explicite journalisé.
- Prompts versionnés dans `src/prompts/<nom>/v1.ts`, `v2.ts`… — jamais modifiés
  en place ; chaque génération enregistre `prompt_name` + `prompt_version`.
- Chaque appel écrit une ligne `ai_generations` : fournisseur, modèle, version du
  prompt, paramètres, date, utilisateur, objet concerné, résultat brut (stockage
  sécurisé), résultat validé, erreurs, durée, estimation de coût.
- Exigences des prompts (contrat commun) : utiliser et citer les sources
  sélectionnées, respecter le niveau, distinguer fait / interprétation /
  proposition, ne pas inventer de références, signaler l'incertain, respecter
  les objectifs validés, construire une progression, éviter la répétition,
  garantir l'alignement cours ↔ évaluation.

## 6. Génération de documents (`packages/document-generation`)

- **PDF** : rendu HTML print (templates React dédiés, CSS `@page` A4) →
  Chromium via Playwright (déjà pré-installé dans l'environnement).
- **PPTX** : PptxGenJS à partir des blocs `presentation` (une idée par écran).
- **DOCX** : best-effort via la bibliothèque `docx` (ADR-0006) ; si la fidélité
  est insuffisante, le PDF reste la référence.
- Variantes : professeur / élève / avec corrigé / sans corrigé — obtenues par
  filtrage des blocs (les blocs portent une `audience` et un flag `answerKey`),
  jamais par duplication de contenu.

## 7. i18n et RTL

- `fr` par défaut ; `en` et `he` prévus. Bibliothèque : `next-intl` (messages
  par locale dans `packages/shared/src/i18n/`).
- RTL : attribut `dir` piloté par la locale du contenu (un support en hébreu se
  rend RTL même dans une UI française) ; propriétés CSS logiques uniquement
  (`ps-*`, `pe-*`, `text-start`…).
- Le **contenu pédagogique** a sa propre langue (`language` sur les entités),
  indépendante de la langue de l'UI.

## 8. Observabilité

- Sentry : erreurs client + serveur, sans données personnelles (identifiants
  opaques, pas de contenu élève).
- PostHog : derrière le feature flag `analytics` (désactivé par défaut),
  événements produit anonymisés, jamais de contenu pédagogique.
- `audit_logs` : journal métier interne (distinct de l'observabilité technique).

## 9. Variables d'environnement

Exposées au client (seules autorisées) : `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SENTRY_DSN`,
`NEXT_PUBLIC_POSTHOG_KEY` (si flag actif).

Serveur uniquement : `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`,
`OPENAI_API_KEY`, `GOOGLE_CLOUD_*` (OCR, post-MVP), `SENTRY_AUTH_TOKEN`.

## 10. Module scan (préparation seulement)

Au MVP : interfaces TypeScript (`ScanJob`, `ScannedPage`, `AnswerSegment`,
`TranscriptionResult`, `ProposedGrade`, `OCRProvider`), tables (`scan_batches`,
`scanned_copies`, `copy_pages`, `answer_segments`, `proposed_grades`), un
`MockOCRProvider`, un écran de démonstration alimenté par le mock, et
`docs/scan-architecture.md`. Le service FastAPI n'est créé qu'au moment du
module réel. L'OCR réel (Google Cloud Vision / Document AI) restera derrière
l'interface `OCRProvider`.

## 11. Couche moteurs IA et sous-système d'illustrations (ADR-0010 à 0013)

### 11.1 Moteurs spécialisés (`packages/ai/src/engines/`)

Au-dessus de `AIProvider`, une couche « moteurs » orchestre les tâches :
Curriculum, Lesson, Assessment, Illustration, Photo Selection, Diagram,
Translation, Citation, Review, Quality. Chaque moteur : prompt(s) versionné(s),
schéma de sortie Zod, politique de modèle (routage D-4), journalisation
`ai_generations`. Les moteurs ne connaissent pas la base ; ils passent par les
abstractions fournisseurs. Ajouter un moteur n'impacte pas les autres.

### 11.2 Flux preview-first et régénération incrémentale

- **Blueprint** (structure validée) → **Aperçu interactif** (échantillons
  réalistes bon marché) → validation → **génération complète** → **contrôle
  qualité** (Review + Quality) → export.
- Chaque objet pédagogique porte `id/version/status/locked/dependencies`. Un
  **planificateur de régénération** calcule la fermeture transitive des
  dépendants non verrouillés et ne régénère qu'eux (graphe explicite persisté).
- Édition par **EditIntent** `{ targetObjectId, instruction, quickAction? }`,
  validé Zod, borné à un objet — jamais une interface chat générique.

### 11.3 Abstraction `ImageProvider` (`packages/ai` ou package dédié)

Parallèle à `AIProvider`/`OCRProvider` : `selectPhoto(spec)`,
`generateIllustration(spec)`, `renderDiagram(spec)`. Le moteur de décision
visuelle produit une **spécification JSON** (validée Zod), puis un
`ImageProvider` la rend. Trois types : photo sous licence, illustration IA sous
charte, schéma vectoriel (SVG). Au MVP : interfaces + specs + `MockImageProvider`.
Les fournisseurs réels (banque photo, générateur IA, moteur SVG) et leurs
licences sont branchés plus tard (D-10, D-11). Aucun secret de fournisseur
d'images côté client ; production serveur uniquement.

## 12. Runtime IA — capacités, routeur, niveaux de modèle (ADR-0014)

Empilement : **code métier → capacité → moteur (ADR-0012) → routeur → couche
fournisseur (`AIProvider`, ADR-0004) → Anthropic (V1)**. Le code métier demande
une **capacité** (`GenerateLesson`, `GenerateAssessment`, `Translate`,
`GenerateSlides`, `ReviewLesson`, `GenerateIllustrationSpecification`…) et ne
nomme jamais un modèle.

- **Routeur** (`packages/ai/src/router/`) : choisit le **niveau** (Standard=
  Sonnet par défaut, Économique=Haiku, Premium=Opus jamais par défaut) selon
  taille des documents, difficulté, niveau scolaire, nombre de langues/supports,
  coût estimé, temps souhaité. Modèles = configuration, jamais en dur.
- **Couche fournisseur** (`AIProvider`) : auth, appels, erreurs, retries, rate
  limiting, **prompt caching** (préfixe stable : système, règles, schémas,
  exemples, référentiels), **batch** (non-interactif), logs, métriques, coût.
- **Sorties structurées + escalade** : validation Zod obligatoire ; sur échec :
  réparation bornée → régénération → escalade de niveau → échec journalisé.
- **Monitoring** : chaque appel écrit dans `ai_generations` (fournisseur, modèle,
  capacité, moteur, tokens entrée/sortie/cache, cache hit, coût, temps,
  succès/erreur, utilisateur, `school_id`, organisation).
- **Multi-fournisseurs** : OpenAI/Gemini/Mistral/DeepSeek/local ajoutables par
  configuration derrière la même interface, sans toucher au métier.

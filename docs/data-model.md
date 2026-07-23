# PedagoOS — Modèle de données

Statut : version 1 — schéma initial proposé (Phase 1). Les migrations SQL seront
écrites en Phase 3 à partir de ce document.

## 0. Conventions

- Clés primaires : `id uuid primary key default gen_random_uuid()`.
- Timestamps : `created_at timestamptz not null default now()`,
  `updated_at timestamptz not null default now()` (trigger de mise à jour),
  suppression douce par `archived_at timestamptz` quand l'archivage est requis.
- Toute entité métier porte `organization_id` (dénormalisé si besoin) : c'est la
  clé de l'isolation multi-tenant et des politiques RLS (ADR-0003).
- Énumérations : types `enum` Postgres (ex. `member_role`, `material_status`).
- Index systématiques sur les FK utilisées par la RLS et les listes
  (`organization_id`, `school_id`, `class_id`, `sequence_id`…).
- RLS activée sur **toutes** les tables ; aucune table sans politique explicite.

## 1. Identité, organisations, structure scolaire

### organizations

| colonne                               | type                        | notes                           |
| ------------------------------------- | --------------------------- | ------------------------------- |
| id                                    | uuid PK                     |                                 |
| name                                  | text NOT NULL               |                                 |
| slug                                  | text UNIQUE NOT NULL        |                                 |
| default_locale                        | text NOT NULL DEFAULT 'fr'  | fr / en / he                    |
| settings                              | jsonb NOT NULL DEFAULT '{}' | rétention, échelle de notation… |
| created_at / updated_at / archived_at |                             |                                 |

### schools

`id`, `organization_id → organizations`, `name`, `address jsonb`,
`settings jsonb`, timestamps, `archived_at`. Index `(organization_id)`.

### profiles (1-1 avec auth.users)

`id uuid PK REFERENCES auth.users(id)`, `full_name`, `preferred_locale`,
`avatar_url` (nullable), timestamps. Pas de données superflues (minimisation).

### memberships (utilisateur × organisation × rôle)

`id`, `profile_id → profiles`, `organization_id → organizations`,
`role member_role NOT NULL` — enum : `platform_admin`, `org_admin`,
`school_director`, `pedagogical_lead`, `teacher`, `grader`, `student`, `parent`.
`status` (`invited/active/suspended`), timestamps.
UNIQUE `(profile_id, organization_id, role)`.

### school_memberships (rattachement établissement)

`id`, `membership_id → memberships`, `school_id → schools`, timestamps.
UNIQUE `(membership_id, school_id)`. Permet à un professeur d'être rattaché à
plusieurs établissements.

### invitations

`id`, `organization_id`, `school_id` (nullable), `email`, `role member_role`,
`token_hash` (jamais le token en clair), `invited_by → profiles`, `expires_at`,
`accepted_at` (nullable), timestamps. Gérée uniquement côté serveur.

### academic_years

`id`, `organization_id`, `label` (ex. « 2026-2027 »), `hebrew_label`
(ex. « תשפ״ז », libellé hébreu traditionnel calculé via Intl/ICU, modifiable —
voir A-013), `starts_on date`, `ends_on date`, `is_current boolean`, timestamps.
Double calendrier : les **dates** restent civiles (grégoriennes) ; seul le
libellé hébreu double l'affichage — aucune date n'est stockée en calendrier
hébreu.
CHECK `starts_on < ends_on` ; UNIQUE `(organization_id, label)`.

## 2. Classes, élèves, matières

### subjects

`id`, `organization_id`, `name`, `code` (nullable), `color` (nullable),
timestamps. UNIQUE `(organization_id, name)`. Semées par défaut (français,
maths…), personnalisables par organisation.

### classes

`id`, `organization_id`, `school_id → schools`, `academic_year_id →
academic_years`, `name`, `grade_level text NOT NULL` (référentiel dans
`packages/shared`, ex. `cp`…`terminale`, extensible — hypothèse A-005),
`subject_id → subjects` (nullable : classe multi-matières possible),
timestamps, `archived_at`.

### class_teachers

`id`, `class_id → classes`, `profile_id → profiles`, `role`
(`main_teacher/co_teacher`), timestamps. UNIQUE `(class_id, profile_id)`.

### students

`id`, `organization_id`, `school_id`, `first_name`, `last_name`,
`birth_date date` (nullable — minimisation : uniquement si l'école le fournit),
`profile_id → profiles` (nullable : un élève peut exister sans compte),
`external_ref` (nullable, identifiant école), timestamps, `archived_at`.
**Aucune autre donnée personnelle** (voir privacy-and-security.md).

### class_students

`id`, `class_id`, `student_id`, `joined_on date`, `left_on date` (nullable),
timestamps. UNIQUE `(class_id, student_id)`.

## 3. Bibliothèque de sources

### source_documents

`id`, `organization_id`, `school_id` (nullable : null = partagé org),
`uploaded_by → profiles`, `title`, `subject_id` (nullable), `grade_level`
(nullable), `language text NOT NULL DEFAULT 'fr'`, `tags text[]`,
`file_path` (bucket privé `sources`), `mime_type`, `file_size`,
`processing_status` enum (`pending/processing/ready/failed`),
`processing_error` (nullable), `extracted_text` (nullable),
`text_search tsvector` (généré, index GIN), timestamps, `archived_at`.

### source_chunks

`id`, `source_document_id → source_documents ON DELETE CASCADE`,
`organization_id` (dénormalisé pour la RLS), `chunk_index int`, `content text`,
`page_number` (nullable), `metadata jsonb`, timestamps.
UNIQUE `(source_document_id, chunk_index)`. Prépare la recherche fine et les
citations précises ; embeddings hors MVP (colonne ajoutée plus tard).

## 4. Référentiel pédagogique

### curriculum_units (programme officiel ou interne)

`id`, `organization_id`, `subject_id`, `grade_level`, `title`, `description`,
`source_document_id` (nullable — le texte du programme importé), `order_index`,
timestamps.

### competencies

`id`, `organization_id`, `subject_id` (nullable), `code` (nullable),
`label`, `description`, `parent_id → competencies` (hiérarchie), timestamps.
UNIQUE `(organization_id, code)` si code non nul.

### learning_objectives

`id`, `organization_id`, `sequence_id → lesson_sequences` (nullable tant que
non rattaché), `curriculum_unit_id` (nullable), `title`, `description`,
`bloom_level` enum (`remember/understand/apply/analyze/evaluate/create`),
`order_index`, timestamps.

### objective_competencies (N-N objectif ↔ compétence)

`objective_id`, `competency_id`, PK composite.

Traçabilité d'un objectif (exigence produit) : vers les séances via
`lesson_objectives`, vers les exercices via `exercise_objectives`, vers les
questions d'évaluation via `assessment_questions.objective_id`, vers les
résultats élèves via `student_results.objective_id` (post-MVP scan).

## 5. Séquences, séances, supports

### lesson_sequences

`id`, `organization_id`, `class_id → classes`, `subject_id`, `title`, `theme`,
`created_by → profiles`, `language`, `session_count int`,
`session_duration_minutes int`, `difficulty` enum (`easier/standard/harder`),
`status` enum (`draft/structure_proposed/structure_validated/materials_generated/published/archived`),
`wizard_state jsonb` (réponses des étapes 1-3 de l'assistant),
`structure jsonb` (proposition validée, conforme au schéma Zod `LessonSequence`),
timestamps, `archived_at`.

### lessons

`id`, `sequence_id → lesson_sequences ON DELETE CASCADE`, `organization_id`,
`order_index`, `title`, `summary`, `duration_minutes`, timestamps.
UNIQUE `(sequence_id, order_index)`.

### lesson_objectives (N-N séance ↔ objectif)

`lesson_id`, `objective_id`, PK composite.

### materials (tout support produit : fiche prof, support élève, présentation…)

| colonne            | type                     | notes                                                                |
| ------------------ | ------------------------ | -------------------------------------------------------------------- |
| id                 | uuid PK                  |                                                                      |
| organization_id    | uuid                     |                                                                      |
| sequence_id        | uuid → lesson_sequences  |                                                                      |
| lesson_id          | uuid nullable            | support de séance ou de séquence                                     |
| kind               | enum                     | `teacher_guide/student_handout/presentation/exercise_set/assessment` |
| title              | text                     |                                                                      |
| status             | enum                     | `draft/validated/published/archived`                                 |
| current_version_id | uuid → material_versions | version de travail                                                   |
| language           | text                     | langue du contenu (RTL si `he`)                                      |
| created_by         | uuid → profiles          |                                                                      |
| timestamps         |                          |                                                                      |

### material_versions (versions immuables — ADR-0009)

`id`, `material_id → materials ON DELETE CASCADE`, `organization_id`,
`version_number int`, `blocks jsonb NOT NULL` (blocs pédagogiques validés Zod),
`created_by`, `created_at`, `label` (nullable : « avant validation »…),
`ai_generation_id` (nullable — provenance IA).
UNIQUE `(material_id, version_number)`. L'autosave écrit la version de travail ;
un instantané est créé à chaque validation/restauration/génération.

### lesson_blocks

Blocs de la fiche de séance affichée/éditée hors `materials` si nécessaire —
**décision D-3 à confirmer** : au schéma proposé, les blocs vivent dans
`material_versions.blocks` (jsonb) et `lesson_blocks` n'est créé que si l'éditeur
exige une granularité par bloc en base (collaboration temps réel, post-MVP).

### activities

`id`, `organization_id`, `lesson_id`, `title`, `kind`
(`individual/pair/group/whole_class`), `duration_minutes`, `content jsonb`
(conforme `Activity`), `order_index`, timestamps.

### exercises

`id`, `organization_id`, `sequence_id`, `lesson_id` (nullable), `title`,
`category` enum (`memorization/comprehension/application/analysis/extension/remediation`),
`difficulty int` (1-5), `content jsonb` (conforme `Exercise` : énoncé, réponses,
corrigé), `order_index`, timestamps.

### exercise_objectives (N-N)

`exercise_id`, `objective_id`, PK composite.

## 6. Évaluations

### assessments

`id`, `organization_id`, `sequence_id`, `class_id`, `title`,
`status` (`draft/validated/published/archived`), `total_points numeric`,
`grading_scale jsonb` (défaut /20 — hypothèse A-007), `instructions text`,
timestamps.

### assessment_questions

`id`, `assessment_id ON DELETE CASCADE`, `organization_id`, `order_index`,
`statement jsonb` (énoncé en blocs), `objective_id → learning_objectives`,
`difficulty int`, `points numeric`, `expected_answer jsonb`,
`grading_criteria jsonb`, timestamps.

### question_competencies (N-N question ↔ compétence)

`question_id`, `competency_id`, PK composite.

### rubrics

`id`, `organization_id`, `assessment_id` (nullable — réutilisable),
`title`, `criteria jsonb` (conforme `Rubric` : critères × niveaux × points),
timestamps.

## 7. IA, exports, audit

### ai_generations

`id`, `organization_id`, `requested_by → profiles`, `provider`, `model`,
`prompt_name`, `prompt_version`, `parameters jsonb`, `target_type`
(`sequence_structure/teacher_guide/student_handout/presentation/exercises/assessment/document_analysis`),
`target_id uuid` (nullable), `source_document_ids uuid[]`,
`raw_output_path` (fichier bucket privé `ai-raw` — pas en table pour ne pas
gonfler la base), `validated_output jsonb` (nullable), `status`
(`pending/succeeded/schema_failed/provider_failed`), `error text`,
`duration_ms int`, `cost_estimate numeric` (nullable), `created_at`.

### exports

`id`, `organization_id`, `material_id`, `requested_by`, `format`
(`pdf/docx/pptx/print`), `variant` (`teacher/student/with_answers/without_answers`),
`file_path` (bucket privé `exports`), `status`, `error`, `created_at`.

### audit_logs (append-only, pas d'UPDATE/DELETE par RLS)

`id`, `organization_id`, `actor_id → profiles` (nullable pour le système),
`action text` (ex. `class.archive`, `student.delete`, `material.publish`),
`entity_type`, `entity_id`, `metadata jsonb` (sans données personnelles
inutiles), `created_at`. Index `(organization_id, created_at)`.

## 8. Scan de copies (tables préparées, non exploitées au MVP)

### scan_batches

`id`, `organization_id`, `assessment_id`, `class_id`, `uploaded_by`,
`status` (`uploaded/preprocessing/ocr/segmented/proposed/reviewed/completed/failed`),
`page_count int`, timestamps.

### scanned_copies

`id`, `batch_id → scan_batches`, `organization_id`, `student_id` (nullable tant
que non identifiée), `identification_confidence numeric`, `status`, timestamps.

### copy_pages

`id`, `copy_id → scanned_copies`, `organization_id`, `page_index`,
`original_file_path`, `processed_file_path` (nullable), `ocr_text` (nullable),
`ocr_confidence numeric`, timestamps.

### answer_segments

`id`, `copy_id`, `organization_id`, `question_id → assessment_questions`,
`page_id → copy_pages`, `bounding_box jsonb`, `transcription text`,
`transcription_confidence numeric`, timestamps.

### proposed_grades

`id`, `answer_segment_id`, `organization_id`, `ai_generation_id`,
`proposed_points numeric`, `confidence numeric`, `rationale jsonb`,
`status` (`proposed/accepted/adjusted/rejected`), `final_points numeric`
(nullable), `reviewed_by → profiles` (nullable), `reviewed_at`, timestamps.
**Invariant produit : aucune note n'est officielle sans `reviewed_by`.**

### student_results (résultats par compétence — alimenté par le scan ou saisie)

`id`, `organization_id`, `student_id`, `assessment_id`, `question_id`
(nullable), `objective_id` (nullable), `competency_id` (nullable),
`points numeric`, `max_points numeric`, `source` (`scan/manual`), timestamps.

## 9. Politiques RLS (principes)

Fonctions d'appui (`security definer`, `stable`) :
`current_profile_id()`, `is_member_of(org_id)`, `has_role(org_id, role)`,
`is_school_member(school_id)`, `teaches_class(class_id)`.

| Table(s)                                                                                                                   | SELECT                                                                             | INSERT/UPDATE/DELETE                                   |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------ |
| organizations                                                                                                              | membres de l'org                                                                   | org_admin (platform_admin via service)                 |
| schools                                                                                                                    | membres de l'org rattachés ; org_admin : toutes                                    | org_admin, school_director (la sienne, update)         |
| profiles                                                                                                                   | soi-même + profils visibles via une org commune                                    | soi-même                                               |
| memberships / school_memberships                                                                                           | soi-même ; org_admin/directeur : leur périmètre                                    | org_admin (serveur pour invitations)                   |
| classes, class_teachers, class_students                                                                                    | professeurs de la classe, directeur de l'école, resp. pédagogique, org_admin       | professeurs de la classe (update), directeur/org_admin |
| students                                                                                                                   | professeurs ayant l'élève en classe, directeur de l'école, org_admin               | idem, création par professeur/directeur                |
| source_documents / source_chunks                                                                                           | membres du périmètre (école ou org)                                                | auteur + org_admin                                     |
| lesson_sequences, lessons, materials, material_versions, activities, exercises, assessments, assessment_questions, rubrics | professeurs de la classe, resp. pédagogique/directeur du périmètre                 | professeurs de la classe ; suppression restreinte      |
| élève (rôle student)                                                                                                       | uniquement `materials.status = 'published'` de ses classes + ses `student_results` | aucune écriture                                        |
| ai_generations, exports                                                                                                    | auteur + org_admin                                                                 | insert serveur uniquement                              |
| audit_logs                                                                                                                 | org_admin (lecture)                                                                | insert serveur uniquement ; **jamais** update/delete   |
| tables scan                                                                                                                | professeurs de la classe + correcteur assigné                                      | professeur/correcteur sur leur périmètre               |

Chaque politique aura des tests dédiés (`packages/database/tests/rls`) couvrant :
accès légitime, refus inter-organisations, refus inter-établissements, refus
élève→données non publiées, immutabilité d'`audit_logs`.

## 10. Storage (buckets privés uniquement)

| bucket    | contenu                    | accès                                   |
| --------- | -------------------------- | --------------------------------------- |
| `sources` | documents importés         | URL signée courte, membres du périmètre |
| `exports` | PDF/PPTX/DOCX générés      | URL signée courte, auteur + périmètre   |
| `ai-raw`  | sorties brutes IA          | serveur uniquement                      |
| `scans`   | pages de copies (post-MVP) | serveur + professeurs concernés         |

Aucun bucket public. Les chemins incluent `organization_id` en préfixe et les
politiques Storage répliquent l'isolation par organisation.

## 11. Objets pédagogiques versionnés, dépendances, aperçu, illustrations (ADR-0010 à 0013)

> Extension du modèle pour la génération preview-first, la régénération partielle
> et le sous-système d'illustrations. Toutes ces tables portent `organization_id`
> et sont soumises à la RLS via `can_access_sequence` / périmètre du support.

### Champs ajoutés aux objets pédagogiques

Sur les tables d'objets régénérables (`lessons`, `activities`, `exercises`,
`assessment_questions`, blocs de `material_versions`, slides, illustrations) :
`version int`, `status` (`proposed/draft/validated/published/archived`),
`locked boolean not null default false`. Un objet `locked` n'est jamais
régénéré automatiquement.

### pedagogical_dependencies (graphe explicite)

`id`, `organization_id`, `sequence_id`, `source_object_type`, `source_object_id`,
`dependent_object_type`, `dependent_object_id`, `created_at`.
Arête « la modification de la source impose de recalculer le dépendant ».
Index `(source_object_type, source_object_id)`.

### object_versions (historique par objet, append-only)

`id`, `organization_id`, `object_type`, `object_id`, `version_number`,
`snapshot jsonb` (état complet de l'objet), `created_by`, `created_at`,
`ai_generation_id` (nullable, provenance). UNIQUE `(object_type, object_id,
version_number)`. Support de compare / restore / merge (résolution par objet).

### sequence_previews (aperçu interactif — étape 8.2)

`id`, `organization_id`, `sequence_id`, `screens jsonb` (les ~5 écrans
d'échantillons réalistes validés Zod), `status` (`generating/ready/validated`),
`ai_generation_id`, `created_at`, `updated_at`. La séquence passe en statut
`preview_ready` puis `materials_generated` après validation.

### edit_intents (modifications par intentions — étape 8.3)

`id`, `organization_id`, `sequence_id`, `target_object_type`,
`target_object_id`, `quick_action` (nullable), `instruction text` (nullable),
`requested_by`, `status` (`pending/applied/failed`), `ai_generation_id`,
`created_at`. Journalise chaque intention et sa régénération partielle.

### illustration_specs (spécification JSON avant image — ADR-0013)

`id`, `organization_id`, `objective_id → learning_objectives`, `owner_object_type`,
`owner_object_id`, `image_type` (`photo/ai_illustration/diagram/icon/none`),
`spec jsonb` (purpose, style, target_age, language, must_show[]…),
`decision_rationale text` (pourquoi ce visuel / ce type), timestamps.

### illustration_assets (image produite)

`id`, `organization_id`, `illustration_spec_id`, `provider`, `source`
(`licensed_photo/ai/svg`), `file_path` (bucket privé `illustrations`),
`license` (nullable — droits de la photo), `alt_text`, `checksum`, timestamps.
Bucket `illustrations` privé ; accès par URL signée courte. La version canonique
partagée (A-016) référence la `spec`, pas un actif photo sous licence non
transférable.

### Statuts de séquence (mis à jour — ADR-0010)

`draft → structure_proposed → structure_validated → preview_ready
→ materials_generated → published → archived`. Le contrôle qualité (Review +
Quality engines) s'exécute entre `materials_generated` et `published`.

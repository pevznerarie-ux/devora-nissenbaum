# PedagoOS — Exigences produit (PRD)

Statut : version 1 — cadrage du MVP. Nom de travail : PedagoOS (centralisé, modifiable).

## 1. Problème et vision

Les professeurs assemblent aujourd'hui leur travail dans des outils déconnectés
(traitement de texte, diaporamas, photocopies, tableurs de notes). Rien ne relie
le programme, les objectifs, les supports, les évaluations et les résultats des
élèves. PedagoOS maintient cette chaîne comme **données structurées** :

```
programme & sources → objectifs → séquence → cours → support professeur
→ support élève → présentation → exercices → contrôle → copie corrigée
→ résultats par compétence → recommandations → prochaine séquence adaptée
```

Principes produit :

- L'IA propose, le professeur décide : toute génération est une proposition
  éditable, jamais un fait accompli.
- Continuité : chaque objectif est traçable jusqu'aux résultats d'élèves.
- Sobriété : interface professionnelle, calme, lisible ; pas de chatbot générique.
- Confiance : sources citées, incertitudes signalées, données isolées par
  organisation, données de mineurs minimisées.

## 2. Utilisateurs et rôles

| Rôle                            | Portée                                                        | MVP                                    |
| ------------------------------- | ------------------------------------------------------------- | -------------------------------------- |
| Super administrateur plateforme | Toute la plateforme (support, provisioning)                   | Oui (minimal)                          |
| Administrateur d'organisation   | Son organisation et ses établissements                        | Oui                                    |
| Directeur d'établissement       | Son établissement                                             | Oui                                    |
| Responsable pédagogique         | Établissement(s) assigné(s), lecture + validation pédagogique | Oui                                    |
| Professeur                      | Ses classes, ses ressources, ressources partagées             | Oui (cœur du produit)                  |
| Correcteur autorisé             | Copies qui lui sont assignées                                 | Modèle prévu, UI post-MVP              |
| Élève                           | Ses propres contenus publiés et résultats                     | Modèle prévu, UI minimale              |
| Parent                          | Enfants rattachés                                             | Modèle prévu, **non développé** au MVP |

Contraintes de structure : un utilisateur appartient à une organisation (via
`memberships`) ; une organisation possède plusieurs établissements ; un professeur
peut intervenir dans plusieurs établissements et plusieurs classes.

## 3. Périmètre du MVP

### A. Authentification et organisations

Connexion / déconnexion (Supabase Auth, email + mot de passe, magic link),
invitation d'utilisateur par email avec rôle, organisations, établissements,
rôles, profils, années scolaires, permissions sécurisées par RLS testée.

### B. Classes et élèves

Création de classe (niveau, année scolaire, matière associée), ajout d'élèves
manuel et import CSV (avec rapport d'erreurs ligne par ligne), association de
professeurs (plusieurs professeurs par classe, plusieurs classes par professeur),
archivage de classe (lecture seule, exclue des listes actives).

### C. Bibliothèque de sources

Import PDF, DOCX, TXT, images ; métadonnées (titre, matière, niveau/classe,
langue, tags) ; rattachement organisation ou établissement ; extraction de texte
asynchrone avec état de traitement visible (`pending → processing → ready → failed`) ;
recherche plein texte ; conservation des références utilisées dans chaque
génération (`source_citations` dans les blocs générés).

### D. Assistant de création de séquence (expérience centrale)

Assistant en 6 étapes, formulaires structurés :

1. Cadre : classe, matière, thème, nombre de séances, durée de séance, niveau,
   difficulté, langue.
2. Intentions : objectifs souhaités, prérequis, contraintes, type d'apprentissage,
   différenciation.
3. Sources : programme, documents obligatoires, documents exclus.
4. Génération d'une **proposition de structure uniquement** (objectifs, plan de
   séances, progression) — pas de contenu complet.
5. Édition et validation humaine de la structure (réordonner, modifier, supprimer,
   ajouter ; validation explicite requise).
6. Génération des supports complets à partir de la structure validée.

### E. Supports générés (par séquence validée)

1. **Fiche professeur** : objectifs, prérequis, vocabulaire, matériel, déroulé
   minute par minute, explications, exemples, questions à poser, réponses
   attendues, erreurs fréquentes, différenciation, synthèse, devoir éventuel.
2. **Support élève** : titre, objectifs formulés simplement, documents, notions
   essentielles, espaces de réponse, synthèse, exercices.
3. **Présentation écran** : une idée par écran, peu de texte, questions
   interactives, documents/illustrations, synthèses intermédiaires, écran final
   de récapitulatif.
4. **Exercices** : mémorisation, compréhension, application, analyse,
   approfondissement, remédiation — reliés aux objectifs.
5. **Évaluation** : questions avec compétences, difficulté, points, réponse
   attendue, barème, critères, corrigé professeur ; alignement garanti avec les
   objectifs de la séquence.

### F. Éditeur par blocs

Tous les supports sont éditables via un modèle de **blocs pédagogiques
structurés** (pas d'éditeur riche générique) : sauvegarde automatique, versions,
duplication, historique, restauration d'une version, statuts
`draft → validated → published → archived`.

### G. Export

Impression, export PDF (Playwright/Chromium), PPTX (PptxGenJS), DOCX
(best-effort) ; variantes : version professeur / version élève / avec corrigé /
sans corrigé. Les exports sont journalisés (`exports`).

## 4. Hors périmètre du MVP (préparé, non développé)

- **Scan et correction de copies** : interfaces TypeScript, tables, document
  d'architecture, service OCR mocké et écran de démonstration uniquement.
  Pipeline cible : upload → séparation des pages → amélioration image →
  identification de la copie → OCR → segmentation par question → transcription →
  correction proposée → score de confiance → validation professeur → résultats
  par compétence.
- Portail parent, portail élève complet, analyses avancées, recommandations
  automatiques de séquence suivante (les données sont structurées pour le
  permettre dès le MVP).

## 5. Modèle pédagogique (contrat commun)

Toutes les générations et l'éditeur utilisent un modèle JSON commun défini dans
`packages/pedagogy` (types + schémas Zod) : `LearningObjective`, `Competency`,
`Prerequisite`, `Misconception`, `LessonSequence`, `Lesson`, `LessonPhase`,
`TeacherInstruction`, `StudentInstruction`, `DiscussionQuestion`,
`ExpectedAnswer`, `Activity`, `Exercise`, `Assessment`, `AssessmentQuestion`,
`Rubric`, `DifferentiationStrategy`, `RemediationPlan`, `SourceCitation`.

Traçabilité obligatoire : un `LearningObjective` peut être lié à N séances,
N exercices, N questions d'évaluation et N résultats d'élèves.

## 6. Interface

Navigation principale : Accueil · Mes classes · Séquences · Bibliothèque ·
Évaluations · Élèves · Analyses · Administration.

Tableau de bord professeur : classes, séquences récentes, brouillons, documents
à finaliser, évaluations récentes, actions prioritaires.

Exigences transverses : accessibilité (clavier, contrastes, labels, états de
chargement, erreurs utiles), responsive, compatibilité RTL, impression A4
correcte, localisation française par défaut (en/he prévus).

## 7. Critères de succès du MVP

1. Le parcours E2E complet passe en CI : créer organisation → établissement →
   inviter professeur → créer classe → ajouter élèves → importer source → créer
   séquence → générer proposition → modifier/valider → générer supports →
   exporter fiche professeur, support élève et présentation.
2. Aucune fuite inter-organisations (tests RLS exhaustifs verts).
3. Toute génération IA est journalisée, validée par schéma, éditable, avec
   citations de sources.
4. Un professeur peut produire une séquence complète exportable en moins de
   30 minutes sans quitter l'application.

## 8. Extensions obligatoires (intégrées le 2026-07-23)

Ces exigences sont **obligatoires** et priment sur une génération « en un coup ».
Détail des décisions : ADR-0010 à ADR-0013.

### 8.1 Génération en deux temps (preview-first)

PedagoOS ne génère **jamais** directement un dossier complet. Flux imposé :

```
Demande → Analyse des sources → Blueprint pédagogique → Aperçu interactif
→ Validation/modifications → Génération complète → Contrôle qualité → Export
```

Le professeur valide toujours la direction pédagogique avant que l'IA ne
produise des dizaines de pages (ADR-0010).

### 8.2 Aperçu interactif (~5 écrans)

Échantillons **réalistes** générés à faible coût avant la génération complète :

1. **Vue d'ensemble** : titre, niveau, durée, compétences, objectifs, prérequis,
   résultats attendus.
2. **Plan de séquence** : par séance — objectif, activité principale, durée,
   matériel, production attendue.
3. **Extrait de fiche professeur** : introduction, déroulé, questions à poser,
   difficultés possibles, conseils pédagogiques.
4. **Extrait de support élève** : une vraie page exemple.
5. **Aperçus** : plusieurs slides représentatifs ; exercices de niveaux
   différents ; quelques questions de contrôle avec le type de barème.

### 8.3 Modification avant génération (par intentions, pas par chat)

Le professeur peut tout modifier (simplifier, approfondir, plus/moins de texte,
plus d'exercices, slides plus visuelles, plus de manipulation/collaboration,
changer le nombre de séances, modifier les objectifs, remplacer une activité,
changer le style pédagogique). Deux mécanismes bornés à un objet :
**actions rapides** contextuelles et **instruction ciblée** (« la séance 3 est
trop théorique », « les exercices sont trop faciles ») → produit un `EditIntent`
structuré. Jamais de zone de chat générique (ADR-0010).

### 8.4 Régénération intelligente

Chaque objet pédagogique porte `id`, `version`, `status`, `locked`,
`dependencies`. Une modification ne recalcule que les dépendants non verrouillés
(fiche prof concernée, slides liées, exercices liés, contrôle si nécessaire) ;
tout le reste est conservé (ADR-0011).

### 8.5 Historique des versions

Chaque modification crée une version. Le professeur peut comparer deux versions,
restaurer une version antérieure, conserver certains éléments, fusionner
plusieurs versions. Aucune information n'est perdue (append-only, ADR-0011).

### 8.6 Illustrations (le bon visuel au bon endroit)

Chaque illustration sert un objectif pédagogique précis. Un **moteur de décision
visuelle** choisit, par point du cours : photographie sous licence (Type 1),
illustration IA sous charte graphique (Type 2), schéma vectoriel (Type 3),
icône, ou **aucune image**. PedagoOS produit d'abord une **spécification JSON**
du visuel, puis un `ImageProvider` interchangeable la transforme en image
(ADR-0013). Au MVP : interfaces + specs + mock.

### 8.7 Moteurs IA spécialisés

Curriculum, Lesson, Assessment, Illustration, Photo Selection, Diagram,
Translation, Citation, Review, Quality Engines — chacun avec un rôle précis,
au-dessus de `AIProvider`. Le système choisit le moteur selon la tâche, et
route vers le meilleur modèle par moteur (ADR-0012, D-4). Un **contrôle
qualité** (Review + Quality) précède l'export.

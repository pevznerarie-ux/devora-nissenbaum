# ADR-0012 — Architecture à moteurs IA spécialisés au-dessus de AIProvider

Statut : acceptée · Date : 2026-07-23

## Contexte

Les tâches de PedagoOS sont hétérogènes (construire un programme, rédiger une
séance, concevoir une évaluation, choisir un visuel, traduire, citer, contrôler
la qualité…). Chacune a son prompt, son schéma de sortie, son niveau d'exigence
et son modèle optimal (coût/qualité — cf. D-4). Il faut une couche
d'orchestration spécialisée sans lier la logique métier à un fournisseur.

## Décision

Une couche **« moteurs »** (`packages/ai/src/engines/`) **au-dessus** de
l'interface `AIProvider` (ADR-0004, inchangée). Chaque moteur a un rôle précis,
un ou plusieurs prompts versionnés, un schéma de sortie Zod, et une **politique
de modèle** (quel modèle/effort par défaut, cf. routage D-4). Le système
sélectionne automatiquement le moteur selon la tâche.

Moteurs prévus :

| Moteur                     | Rôle                                                                  |
| -------------------------- | --------------------------------------------------------------------- |
| **Curriculum Engine**      | Objectifs, compétences, structure de séquence (Blueprint)             |
| **Lesson Engine**          | Fiche professeur, support élève, déroulé, activités                   |
| **Assessment Engine**      | Exercices, évaluations, barèmes, corrigés (alignement)                |
| **Illustration Engine**    | Décision + spécification JSON des illustrations IA (ADR-0013)         |
| **Photo Selection Engine** | Recherche/sélection de photographies sous licence (ADR-0013)          |
| **Diagram Engine**         | Schémas vectoriels (diagrammes, frises, cartes mentales…)             |
| **Translation Engine**     | Traduction fr/en/he des contenus (RTL préservé)                       |
| **Citation Engine**        | Citations exactes des sources fournies, jamais inventées              |
| **Review Engine**          | Revue pédagogique (fait/interprétation/proposition, cohérence)        |
| **Quality Engine**         | Contrôle qualité final avant export (schémas, alignement, complétude) |

Principes :

- Les moteurs orchestrent ; ils **ne connaissent pas la base de données** et
  passent par `AIProvider` / `ImageProvider` / `OCRProvider`.
- Chaque exécution est journalisée dans `ai_generations` (fournisseur, modèle,
  moteur, prompt+version, coût). Le champ `target_type` identifie le moteur.
- Routage de modèle **par moteur** : p. ex. Curriculum/Assessment sur un modèle
  haut de gamme, Translation/Citation sur un modèle économique (D-4).
- Sorties toujours **structurées** et validées par schéma Zod ; une sortie
  invalide est une erreur enregistrée, jamais réparée silencieusement.

## Conséquences

- `packages/ai` gagne un dossier `engines/` ; `AIProvider` reste l'unique point
  de contact fournisseur. Ajouter un moteur n'impacte pas les autres.
- Le contrôle qualité (Review + Quality) devient une étape first-class du flux
  preview-first (ADR-0010).
- Le routage par moteur rend D-4 opérationnel sans coupler le métier au modèle.

# ADR-0014 — Runtime IA : couche fournisseur, routage par capacité et par niveau de modèle

Statut : acceptée · Date : 2026-07-23 · Raffine ADR-0004 (abstraction `AIProvider`)
et ADR-0012 (moteurs spécialisés). **Clôt la décision D-4.**

## Contexte

L'IA est le moteur interne de PedagoOS, mais l'application ne doit **jamais**
dépendre d'un modèle précis. Le code métier ne doit jamais nommer un modèle ni
appeler Anthropic directement. Un meilleur modèle futur doit être adoptable par
**simple configuration**, sans refonte.

## Décision

### 1. Empilement en quatre couches

```
Code métier
   │  demande une CAPACITÉ (jamais un modèle)
   ▼
Capabilities  ── GenerateLesson / GenerateAssessment / GenerateTeacherGuide /
                 Translate / GenerateSlides / ReviewLesson /
                 GenerateIllustrationSpecification / …
   ▼
Engines (ADR-0012)  ── prompts versionnés + schéma Zod par tâche
   ▼
AI Router  ── choisit le NIVEAU de modèle et les options d'exécution
   ▼
AI Provider Layer (ADR-0004)  ── auth, appels API, erreurs, retries, rate
                 limiting, prompt caching, batch, logs, métriques, coût
   ▼
Fournisseur (Anthropic en V1 ; OpenAI/Gemini/Mistral/DeepSeek/local plus tard)
```

Le développeur appelle une **capacité** ; le routeur choisit le modèle. Aucun
identifiant de modèle dans le code métier.

### 2. Fournisseur principal V1 : Anthropic — trois niveaux (config-driven)

Les modèles par défaut sont des **valeurs de configuration**, jamais codées en
dur dans le métier :

| Niveau                | Défaut V1 (config) | Usage                                                                                                                                                                                                                                            |
| --------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Standard** (défaut) | Claude Sonnet      | Moteur principal : séquences, objectifs, progression, fiches prof, supports élèves, présentations, exercices, évaluations, corrigés, différenciation, adaptation niveau, JSON conforme, traduction fr/en/he, analyse multi-documents, blueprints |
| **Économique**        | Claude Haiku       | Tâches rapides/légères : extraction, résumé, classification, transformation JSON, traduction simple, validation, variantes, renommage                                                                                                            |
| **Premium**           | Claude Opus        | Tâches exceptionnelles : curriculum annuel, nouvelles méthodes, analyse complexe, revue qualité avancée, audit pédagogique, résolution quand le standard échoue                                                                                  |

Opus n'est **jamais** le défaut (maîtrise des coûts).

### 3. Sélection automatique (AI Router)

Le routeur choisit le niveau selon : taille des documents, difficulté de la
tâche, niveau scolaire, nombre de langues, nombre de supports, coût estimé,
temps de réponse souhaité. Le résultat (niveau + modèle + options) est
journalisé.

### 4. Sorties structurées + échelle d'escalade

Aucun JSON libre. Toute réponse est validée par schéma Zod avant usage. En cas
d'échec :

1. **réparation automatique** bornée (renvoi de l'erreur de schéma) ;
2. **nouvelle génération** ;
3. **escalade vers un niveau supérieur** (ex. Standard → Premium) ;
4. échec explicite journalisé si tout échoue (jamais de correction silencieuse).

### 5. Prompt caching automatique

La couche fournisseur active le prompt caching quand c'est possible. Sont mis en
cache (préfixe stable) : prompt système, règles pédagogiques, schémas JSON,
exemples, référentiels, guides de rédaction. Seules les **données variables**
changent après le dernier point de cache.

### 6. Batch pour le non-interactif

Toute génération non interactive peut s'exécuter en **Batch** (coût réduit) :
traductions, variantes, exercices supplémentaires, corrections, enrichissements.

### 7. Monitoring (chaque appel)

`ai_generations` enregistre : fournisseur, modèle, capacité, moteur, tokens
(entrée/sortie/cache), cache hit, coût estimé, temps de réponse, succès/erreur,
utilisateur, établissement (`school_id`), organisation. Base du pilotage
plateforme (coûts par école, par capacité, taux de cache, taux d'escalade).

## Conséquences

- `packages/ai` : ajoute `capabilities/` (surface publique) et `router/` ;
  `AIProvider` reste l'unique contact fournisseur ; multi-fournisseurs par
  configuration.
- `ai_generations` gagne : `capability`, `engine`, `token_input`,
  `token_output`, `token_cache_read`, `token_cache_creation`, `cache_hit`,
  `response_time_ms`, `school_id`.
- D-4 est **décidée** : Anthropic V1, routage Sonnet/Haiku/Opus par capacité.
  Le budget cible par séquence et les seuils d'escalade restent des paramètres
  de configuration ajustables (à caler avec les données réelles de monitoring).

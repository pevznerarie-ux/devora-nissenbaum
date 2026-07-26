# Déployer sur Railway (à partir de zéro)

Guide pas à pas pour un déploiement propre de `apps/web` sur Railway, avec
Supabase Cloud comme base unique (ADR-0015). La config de build est décrite
dans `railway.json` à la racine : Railway la lit automatiquement et construit
l'image via `apps/web/Dockerfile`.

## 1. Prérequis Supabase

Un projet Supabase Cloud avec les migrations appliquées (voir
`docs/deploy/supabase-full-schema.sql`). Récupérer, dans **Project Settings →
API** :

- **Project URL** — `https://<projet>.supabase.co`
- **anon / public key**
- **service_role key** (secrète, serveur uniquement)

## 2. Créer le service Railway

1. **New Project → Deploy from GitHub repo** → sélectionner ce dépôt,
   branche `main`.
2. Railway détecte `railway.json` et construit avec `apps/web/Dockerfile`
   (builder `DOCKERFILE`). **Root Directory** doit rester la racine du dépôt
   (le Dockerfile copie tout le monorepo) — ne pas le régler sur `apps/web`.
3. **Settings → Networking → Generate Domain** pour obtenir une URL publique.

## 3. Variables (onglet Variables du service)

Les **noms doivent être exacts**. Le code ne lit que ceux-ci :

| Variable                        | Portée              | Source                           |
| ------------------------------- | ------------------- | -------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | build + runtime     | Project URL Supabase             |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | build + runtime     | clé `anon public` Supabase       |
| `SUPABASE_SERVICE_ROLE_KEY`     | runtime             | clé `service_role` Supabase      |
| `ANTHROPIC_API_KEY`             | runtime (optionnel) | clé Anthropic (sinon IA en mock) |

> ⚠️ Les deux `NEXT_PUBLIC_*` sont **inlinées au build** (déclarées en `ARG`
> dans le Dockerfile). Toute modification de leur valeur exige un
> **redéploiement** pour être prise en compte. Une variable au mauvais nom
> (ex. `SUPABASE_TEST_URL`, réservée aux tests) n'est **pas** lue par l'app :
> `NEXT_PUBLIC_SUPABASE_URL` retombe alors sur le défaut local
> `http://127.0.0.1:54321` et l'app ne peut joindre ni la base ni l'auth.

## 4. Déployer puis vérifier

Après avoir renseigné les variables, lancer un **Deploy** (les `NEXT_PUBLIC_*`
doivent exister au build). Puis ouvrir `https://<domaine>/signup` : la page
« Créer un compte » doit fonctionner. Parcours ensuite :

`/signup` → `/administration` (créer l'organisation, l'établissement, l'année)
→ `/classes` (créer une classe) → ouvrir la classe (ajouter des élèves).

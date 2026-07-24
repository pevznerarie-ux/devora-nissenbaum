# Lancer PedagoOS

Deux chemins : **développement local** (voir l'app tourner sur votre machine) et
**déploiement conteneur** (Railway + Supabase Cloud — ADR-0015).

> Sans `ANTHROPIC_API_KEY`, toute l'IA tourne sur le **MockAIProvider**
> déterministe (aucun réseau, aucun coût) — idéal pour une démonstration.

## 1. Prérequis

- **Node 22** et **pnpm** (`corepack enable`).
- **Docker** (pour la stack Supabase locale : Postgres + Auth + Storage).
- Supabase CLI (`supabase`) — installée via `pnpm dlx supabase` ou globalement.

## 2. Développement local

```bash
pnpm install                      # dépendances du monorepo
supabase start                    # démarre Postgres/Auth/Storage en local
                                  # → note l'API URL, l'anon key et la service_role key affichées
```

Créer `apps/web/.env.local` avec les valeurs imprimées par `supabase start` :

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key locale>
SUPABASE_SERVICE_ROLE_KEY=<service_role key locale>
# Optionnel — sinon l'IA reste en mock déterministe :
# ANTHROPIC_API_KEY=...
```

Puis :

```bash
pnpm db:reset                     # applique les 10 migrations + le seed
pnpm dev                          # http://localhost:3000
```

**Premier parcours** (l'onboarding crée les données — pas de seed d'utilisateurs) :

1. Ouvrir `http://localhost:3000` → **Créer un compte** (page `/login`).
2. **Créer une organisation** → vous devenez `org_admin`.
3. Créer un établissement, une matière, une classe.
4. **Séquences → Nouvelle séquence** → l'assistant génère une structure (mock),
   validez-la, générez un support, ouvrez l'éditeur.
5. Sur chaque bloc, **« Analyser le visuel »** déclenche le Visual Director.

### Feature flags visuels

Lecture serveur (voir `packages/shared/src/feature-flags.ts`). Par défaut au MVP :
`visual_director`, `diagrams`, `timelines`, `charts`, `maps`,
`visual_quality_review` **actifs** ; recherche stock, génération IA d'images,
Wikimedia et recherche sémantique **désactivés**. Surcharge par variable
d'environnement, ex. `FEATURE_WIKIMEDIA_SOURCES=1`.

## 3. Vérifications

```bash
pnpm lint && pnpm typecheck && pnpm test   # qualité + tests unitaires
pnpm test:rls                              # RLS (nécessite supabase start)
pnpm test:e2e                              # Playwright
pnpm --filter web build                    # build de production (sortie standalone)
```

## 4. Déploiement conteneur (Railway + Supabase Cloud)

Base unique **Supabase Cloud** (Postgres/Auth/RLS/Storage). Appliquer les
migrations sur le projet Cloud (`supabase db push` ou `supabase migration up`
avec le projet lié), créer les buckets privés (les migrations `0005`/`0010` s'en
chargent), puis déployer l'image.

Construire l'image **depuis la racine du monorepo** :

```bash
docker build -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://<projet>.supabase.co" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon key>" \
  -t pedagoos-web .

docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL="https://<projet>.supabase.co" \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon key>" \
  -e SUPABASE_SERVICE_ROLE_KEY="<service_role key>" \
  -e ANTHROPIC_API_KEY="<clé optionnelle>" \
  pedagoos-web
```

Sur **Railway** : région EU, service Docker pointant sur `apps/web/Dockerfile`,
variables d'environnement ci-dessus dans les _Variables_ du service. Les
`NEXT_PUBLIC_*` doivent être présentes **au build** (inlinées) et au runtime.

### Secrets — rappel de sécurité (CLAUDE.md §5)

- `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, DSN privés : **serveur
  uniquement**, jamais préfixés `NEXT_PUBLIC_`.
- Seules `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont
  exposées au navigateur.
- Aucune valeur réelle n'est committée : voir `.env.example`.

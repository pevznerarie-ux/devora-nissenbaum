# PedagoOS — image de production de apps/web (ADR-0015 : Railway/Docker, EU).
# Multi-étapes : dépendances → build Next.js (sortie standalone) → runtime mince.
# À construire depuis la RACINE du monorepo :
#   docker build -f apps/web/Dockerfile -t pedagoos-web .

# ---------- base ----------
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

# ---------- dépendances ----------
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/ai/package.json packages/ai/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/pedagogy/package.json packages/pedagogy/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/ui/package.json packages/ui/package.json
# Pas de cache mount BuildKit ici : certains builders (dont Railway) rejettent
# le format d'`id`. L'installation reste rapide et le build portable.
RUN pnpm install --frozen-lockfile

# ---------- build ----------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/ai/node_modules ./packages/ai/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/packages/pedagogy/node_modules ./packages/pedagogy/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY . .
# Les variables NEXT_PUBLIC_* sont inlinées au build ; valeurs réelles fournies
# à la construction de l'image (défauts locaux sinon — voir apps/web/src/lib/env.ts).
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter web build

# ---------- runtime ----------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Utilisateur non-root.
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs
# Sortie standalone : serveur + node_modules tracés + assets statiques.
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Le serveur standalone se trouve sous apps/web (structure du monorepo tracée).
CMD ["node", "apps/web/server.js"]

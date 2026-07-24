import { join } from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  typescript: {
    // Le typecheck est exécuté séparément (pnpm typecheck) ; jamais ignoré.
    ignoreBuildErrors: false,
  },
  // Sortie autonome pour un conteneur léger (ADR-0015 : Railway/Docker). Trace
  // les dépendances de l'espace de travail depuis la racine du monorepo
  // (deux niveaux au-dessus de apps/web).
  output: "standalone",
  outputFileTracingRoot: join(__dirname, "..", ".."),
};

export default withNextIntl(nextConfig);

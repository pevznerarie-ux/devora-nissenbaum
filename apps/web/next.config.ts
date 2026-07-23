import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  typescript: {
    // Le typecheck est exécuté séparément (pnpm typecheck) ; jamais ignoré.
    ignoreBuildErrors: false,
  },
};

export default withNextIntl(nextConfig);

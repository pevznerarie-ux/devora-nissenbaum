import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

// Environnements gérés : Chromium pré-provisionné hors cache Playwright.
const managedChromium = "/opt/pw-browsers/chromium";
const executablePath = existsSync(managedChromium) ? managedChromium : undefined;

/**
 * E2E de base : parcours sans données (rendu login, redirection des routes
 * protégées). Les parcours authentifiés seront ajoutés avec la stack Supabase
 * locale (roadmap Phase 10).
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:3100",
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  webServer: {
    command: "pnpm dev --port 3100",
    url: "http://127.0.0.1:3100/login",
    reuseExistingServer: !process.env["CI"],
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL:
        process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ?? "local-dev-anon-key",
    },
  },
});

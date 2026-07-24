import { z } from "zod";

/**
 * Variables d'environnement validées (CLAUDE.md §5.4). Les valeurs par défaut
 * correspondent à la stack Supabase locale ; en production elles sont requises.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url().default("http://127.0.0.1:54321"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default("local-dev-anon-key"),
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env["NEXT_PUBLIC_SUPABASE_URL"],
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
});

/** Accès serveur uniquement — lève si appelé depuis le navigateur. */
export function serverEnv() {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() ne doit jamais être appelé côté client.");
  }
  return z
    .object({ SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional() })
    .parse({ SUPABASE_SERVICE_ROLE_KEY: process.env["SUPABASE_SERVICE_ROLE_KEY"] });
}

import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";

/**
 * Client Supabase côté serveur, au nom de l'utilisateur (RLS active).
 * L'adaptateur de cookies est fourni par apps/web (next/headers) : ce package
 * ne dépend pas de Next.js.
 */
export function createSupabaseServerClient(
  url: string,
  anonKey: string,
  cookies: CookieMethodsServer,
) {
  return createServerClient(url, anonKey, { cookies });
}

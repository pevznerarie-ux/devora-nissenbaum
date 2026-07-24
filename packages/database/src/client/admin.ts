import { createClient } from "@supabase/supabase-js";

/**
 * Client service_role — serveur uniquement, opérations système uniquement
 * (invitations, jobs). JAMAIS pour des lectures métier d'une requête
 * utilisateur (CLAUDE.md §8). Lève si importé dans un bundle navigateur.
 */
export function createSupabaseAdminClient(url: string, serviceRoleKey: string) {
  if ("window" in globalThis) {
    throw new Error("Le client service_role ne doit jamais atteindre le navigateur.");
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

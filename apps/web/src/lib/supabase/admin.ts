import "server-only";
import { createSupabaseAdminClient } from "@pedagoos/database";
import { AppError } from "@pedagoos/shared";
import { publicEnv, serverEnv } from "@/lib/env";

/**
 * Client service_role — réservé aux opérations système énumérées
 * (provisioning d'organisation, invitations, audit). Jamais pour des
 * lectures métier d'une requête utilisateur (CLAUDE.md §8).
 */
export function createAdminClient() {
  const { SUPABASE_SERVICE_ROLE_KEY } = serverEnv();
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new AppError("internal", "SUPABASE_SERVICE_ROLE_KEY manquante côté serveur.");
  }
  return createSupabaseAdminClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
  );
}

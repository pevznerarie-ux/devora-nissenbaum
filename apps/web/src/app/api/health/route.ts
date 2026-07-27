import { NextResponse } from "next/server";
import { publicEnv, serverEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Endpoint de diagnostic (temporaire) : vérifie la configuration de
 * déploiement sans jamais exposer de secret — uniquement des booléens, l'hôte
 * public et des messages d'erreur nettoyés (tout jeton JWT est masqué).
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_URL = "http://127.0.0.1:54321";
const DEFAULT_ANON = "local-dev-anon-key";

function sanitize(message: string): string {
  return message.replace(/eyJ[A-Za-z0-9._-]{10,}/g, "[masqué]").slice(0, 300);
}

function toMessage(error: unknown): string {
  return sanitize(error instanceof Error ? error.message : String(error));
}

export async function GET() {
  const result: Record<string, unknown> = {};

  const url = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
  result.supabaseUrlConfigured = url !== DEFAULT_URL;
  result.anonKeyConfigured = publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY !== DEFAULT_ANON;
  try {
    result.supabaseHost = new URL(url).host;
  } catch {
    result.supabaseHost = "URL invalide";
  }

  try {
    result.serviceRoleConfigured = Boolean(serverEnv().SUPABASE_SERVICE_ROLE_KEY);
  } catch {
    result.serviceRoleConfigured = false;
  }

  // Base de données + schéma (client utilisateur, RLS active : 0 ligne = OK).
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("organizations").select("id").limit(1);
    result.databaseReachable = !error;
    if (error) result.databaseError = sanitize(error.message);
  } catch (error) {
    result.databaseReachable = false;
    result.databaseError = toMessage(error);
  }

  // Clé service_role — capacité exacte utilisée par l'inscription.
  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
    result.serviceRoleWorks = !error;
    if (error) result.serviceRoleError = sanitize(error.message);
  } catch (error) {
    result.serviceRoleWorks = false;
    result.serviceRoleError = toMessage(error);
  }

  return NextResponse.json(result);
}

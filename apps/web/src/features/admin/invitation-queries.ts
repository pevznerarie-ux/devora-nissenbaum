import "server-only";
import type { MemberRole } from "@pedagoos/shared";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashInvitationToken } from "./token";

export interface InvitationPreview {
  organizationName: string;
  email: string;
  role: MemberRole;
}

/**
 * Aperçu d'une invitation pour la page publique d'acceptation. Lecture par
 * empreinte de jeton via le client admin (la table n'est pas lisible par un
 * visiteur anonyme) ; ne retourne que le strict nécessaire à l'affichage.
 */
export async function getInvitationPreview(
  token: string,
): Promise<InvitationPreview | null> {
  if (token.length < 20) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("invitations")
    .select("email, role, organizations(name)")
    .eq("token_hash", hashInvitationToken(token))
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (!data) return null;
  const organization = data.organizations as unknown as { name: string } | null;
  return {
    organizationName: organization?.name ?? "",
    email: data.email as string,
    role: data.role as MemberRole,
  };
}

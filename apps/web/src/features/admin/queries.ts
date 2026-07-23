import "server-only";
import type { MemberRole } from "@pedagoos/shared";
import { createClient } from "@/lib/supabase/server";

export interface AdminOrganization {
  id: string;
  name: string;
  slug: string;
}

export interface AdminSchool {
  id: string;
  name: string;
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: MemberRole;
  expires_at: string;
}

export type AdminContext =
  | { kind: "unauthenticated" }
  | { kind: "no_org" }
  | { kind: "not_admin" }
  | {
      kind: "admin";
      organization: AdminOrganization;
      schools: AdminSchool[];
      pendingInvitations: PendingInvitation[];
    };

/**
 * Contexte de la page Administration, lu avec le client utilisateur
 * (RLS active) : les memberships visibles sont ceux de l'utilisateur.
 */
export async function getAdminContext(): Promise<AdminContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { kind: "unauthenticated" };

  const { data: memberships } = await supabase
    .from("memberships")
    .select("role, status, organizations(id, name, slug)")
    .eq("profile_id", user.id)
    .eq("status", "active");

  if (!memberships || memberships.length === 0) return { kind: "no_org" };

  const adminRow = memberships.find((m) => m.role === "org_admin");
  if (!adminRow || !adminRow.organizations) return { kind: "not_admin" };
  const organization = adminRow.organizations as unknown as AdminOrganization;

  const [{ data: schools }, { data: invitations }] = await Promise.all([
    supabase
      .from("schools")
      .select("id, name")
      .eq("organization_id", organization.id)
      .is("archived_at", null)
      .order("name"),
    supabase
      .from("invitations")
      .select("id, email, role, expires_at")
      .eq("organization_id", organization.id)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
  ]);

  return {
    kind: "admin",
    organization,
    schools: schools ?? [],
    pendingInvitations: (invitations ?? []) as PendingInvitation[],
  };
}

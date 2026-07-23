"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AppError,
  DEFAULT_SUBJECTS,
  hebrewAcademicYearLabel,
  toActionError,
  type ActionResult,
} from "@pedagoos/shared";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import {
  acceptExistingSchema,
  acceptNewAccountSchema,
  createAcademicYearSchema,
  createInvitationSchema,
  createOrganizationSchema,
  createSchoolSchema,
  createSubjectSchema,
} from "./schemas";
import {
  INVITATION_TTL_DAYS,
  generateInvitationToken,
  hashInvitationToken,
} from "./token";

function slugify(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(16).slice(2, 8);
  return base.length > 0 ? `${base}-${suffix}` : `org-${suffix}`;
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AppError("unauthorized", "Session requise.");
  return { supabase, user };
}

async function requireOrgAdmin(organizationId: string) {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("memberships")
    .select("id")
    .eq("profile_id", user.id)
    .eq("organization_id", organizationId)
    .eq("role", "org_admin")
    .eq("status", "active")
    .maybeSingle();
  if (!data) throw new AppError("forbidden", "Réservé aux administrateurs.");
  return { supabase, user };
}

/**
 * Provisioning simplifié du MVP : un utilisateur connecté sans organisation
 * crée la sienne et en devient org_admin. Opération système → client admin
 * (l'INSERT sur organizations/memberships est réservé au service_role).
 */
export async function createOrganizationAction(
  formData: FormData,
): Promise<ActionResult<{ organizationId: string }>> {
  try {
    const { user } = await requireUser();
    const parsed = createOrganizationSchema.safeParse({ name: formData.get("name") });
    if (!parsed.success) throw new AppError("validation_failed", "Nom invalide.");

    const admin = createAdminClient();
    const { data: org, error } = await admin
      .from("organizations")
      .insert({ name: parsed.data.name, slug: slugify(parsed.data.name) })
      .select("id")
      .single();
    if (error || !org) throw new AppError("internal", "Création impossible.");

    const { error: mError } = await admin.from("memberships").insert({
      profile_id: user.id,
      organization_id: org.id,
      role: "org_admin",
      status: "active",
    });
    if (mError) throw new AppError("internal", "Attribution du rôle impossible.");

    // Matières par défaut (A-005) — personnalisables ensuite dans Administration.
    await admin
      .from("subjects")
      .insert(DEFAULT_SUBJECTS.map((name) => ({ organization_id: org.id, name })));

    await writeAuditLog({
      organizationId: org.id,
      actorId: user.id,
      action: "organization.create",
      entityType: "organization",
      entityId: org.id,
    });
    revalidatePath("/administration");
    return { ok: true, data: { organizationId: org.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createSchoolAction(
  formData: FormData,
): Promise<ActionResult<{ schoolId: string }>> {
  try {
    const parsed = createSchoolSchema.safeParse({
      organizationId: formData.get("organizationId"),
      name: formData.get("name"),
    });
    if (!parsed.success) throw new AppError("validation_failed", "Entrée invalide.");
    const { supabase, user } = await requireOrgAdmin(parsed.data.organizationId);

    // Client utilisateur : la politique RLS schools_insert (org_admin) s'applique.
    const { data: school, error } = await supabase
      .from("schools")
      .insert({ organization_id: parsed.data.organizationId, name: parsed.data.name })
      .select("id")
      .single();
    if (error || !school) throw new AppError("internal", "Création impossible.");

    await writeAuditLog({
      organizationId: parsed.data.organizationId,
      actorId: user.id,
      action: "school.create",
      entityType: "school",
      entityId: school.id,
    });
    revalidatePath("/administration");
    return { ok: true, data: { schoolId: school.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createInvitationAction(
  formData: FormData,
): Promise<ActionResult<{ path: string }>> {
  try {
    const parsed = createInvitationSchema.safeParse({
      organizationId: formData.get("organizationId"),
      email: formData.get("email"),
      role: formData.get("role"),
      schoolId: formData.get("schoolId") ?? "",
    });
    if (!parsed.success) throw new AppError("validation_failed", "Entrée invalide.");
    const { user } = await requireOrgAdmin(parsed.data.organizationId);

    const token = generateInvitationToken();
    const expiresAt = new Date(
      Date.now() + INVITATION_TTL_DAYS * 24 * 3600 * 1000,
    ).toISOString();

    // Le jeton en clair ne quitte jamais cette action autrement que dans le
    // lien retourné à l'administrateur ; seule l'empreinte est stockée.
    const admin = createAdminClient();
    const { error } = await admin.from("invitations").insert({
      organization_id: parsed.data.organizationId,
      school_id: parsed.data.schoolId ?? null,
      email: parsed.data.email,
      role: parsed.data.role,
      token_hash: hashInvitationToken(token),
      invited_by: user.id,
      expires_at: expiresAt,
    });
    if (error) throw new AppError("internal", "Création de l'invitation impossible.");

    await writeAuditLog({
      organizationId: parsed.data.organizationId,
      actorId: user.id,
      action: "invitation.create",
      entityType: "invitation",
      metadata: { role: parsed.data.role },
    });
    revalidatePath("/administration");
    return { ok: true, data: { path: `/invitation/${token}` } };
  } catch (error) {
    return toActionError(error);
  }
}

interface ValidInvitation {
  id: string;
  organization_id: string;
  school_id: string | null;
  email: string;
  role: string;
}

async function findValidInvitation(token: string): Promise<ValidInvitation | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("invitations")
    .select("id, organization_id, school_id, email, role")
    .eq("token_hash", hashInvitationToken(token))
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  return (data as ValidInvitation | null) ?? null;
}

async function attachMembership(invitation: ValidInvitation, profileId: string) {
  const admin = createAdminClient();
  const { error } = await admin.from("memberships").upsert(
    {
      profile_id: profileId,
      organization_id: invitation.organization_id,
      role: invitation.role,
      status: "active",
    },
    { onConflict: "profile_id,organization_id,role" },
  );
  if (error) throw new AppError("internal", "Rattachement impossible.");

  if (invitation.school_id) {
    const { data: membership } = await admin
      .from("memberships")
      .select("id")
      .eq("profile_id", profileId)
      .eq("organization_id", invitation.organization_id)
      .eq("role", invitation.role)
      .single();
    if (membership) {
      await admin
        .from("school_memberships")
        .upsert(
          { membership_id: membership.id, school_id: invitation.school_id },
          { onConflict: "membership_id,school_id" },
        );
    }
  }

  const { error: updateError } = await admin
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);
  if (updateError) throw new AppError("internal", "Finalisation impossible.");

  await writeAuditLog({
    organizationId: invitation.organization_id,
    actorId: profileId,
    action: "invitation.accept",
    entityType: "invitation",
    entityId: invitation.id,
  });
}

export interface AcceptInvitationState {
  error: "invalid" | "accountExists" | "wrongAccount" | "internal" | null;
}

/** Acceptation par création de compte (la personne invitée n'a pas de compte). */
export async function acceptInvitationNewAccountAction(
  _prev: AcceptInvitationState,
  formData: FormData,
): Promise<AcceptInvitationState> {
  const parsed = acceptNewAccountSchema.safeParse({
    token: formData.get("token"),
    fullName: formData.get("fullName"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "invalid" };

  const invitation = await findValidInvitation(parsed.data.token);
  if (!invitation) return { error: "invalid" };

  const admin = createAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email: invitation.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.fullName },
  });
  if (error || !created.user) {
    // Email déjà enregistré : la personne doit passer par son compte existant.
    return { error: "accountExists" };
  }

  try {
    await attachMembership(invitation, created.user.id);
  } catch {
    return { error: "internal" };
  }

  const supabase = await createClient();
  await supabase.auth.signInWithPassword({
    email: invitation.email,
    password: parsed.data.password,
  });
  redirect("/");
}

/** Acceptation avec le compte connecté (professeur multi-organisations). */
export async function acceptInvitationExistingAction(
  _prev: AcceptInvitationState,
  formData: FormData,
): Promise<AcceptInvitationState> {
  const parsed = acceptExistingSchema.safeParse({ token: formData.get("token") });
  if (!parsed.success) return { error: "invalid" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "invalid" };

  const invitation = await findValidInvitation(parsed.data.token);
  if (!invitation) return { error: "invalid" };
  if ((user.email ?? "").toLowerCase() !== invitation.email.toLowerCase()) {
    return { error: "wrongAccount" };
  }

  try {
    await attachMembership(invitation, user.id);
  } catch {
    return { error: "internal" };
  }
  redirect("/");
}

export async function createAcademicYearAction(
  formData: FormData,
): Promise<ActionResult<{ yearId: string }>> {
  try {
    const parsed = createAcademicYearSchema.safeParse({
      organizationId: formData.get("organizationId"),
      label: formData.get("label"),
      hebrewLabel: formData.get("hebrewLabel") ?? "",
      startsOn: formData.get("startsOn"),
      endsOn: formData.get("endsOn"),
      isCurrent: formData.get("isCurrent") === "on",
    });
    if (!parsed.success) throw new AppError("validation_failed", "Entrée invalide.");
    const { supabase, user } = await requireOrgAdmin(parsed.data.organizationId);

    // Double calendrier : libellé hébreu fourni, sinon calculé depuis les
    // dates civiles (ex. תשפ״ו–תשפ״ז pour une rentrée avant Roch Hachana).
    const hebrewLabel =
      parsed.data.hebrewLabel ??
      hebrewAcademicYearLabel(parsed.data.startsOn, parsed.data.endsOn);

    if (parsed.data.isCurrent) {
      await supabase
        .from("academic_years")
        .update({ is_current: false })
        .eq("organization_id", parsed.data.organizationId)
        .eq("is_current", true);
    }

    // Client utilisateur : RLS academic_years_write (org_admin).
    const { data: year, error } = await supabase
      .from("academic_years")
      .insert({
        organization_id: parsed.data.organizationId,
        label: parsed.data.label,
        hebrew_label: hebrewLabel,
        starts_on: parsed.data.startsOn,
        ends_on: parsed.data.endsOn,
        is_current: parsed.data.isCurrent,
      })
      .select("id")
      .single();
    if (error || !year) throw new AppError("internal", "Création impossible.");

    await writeAuditLog({
      organizationId: parsed.data.organizationId,
      actorId: user.id,
      action: "academic_year.create",
      entityType: "academic_year",
      entityId: year.id,
    });
    revalidatePath("/administration");
    return { ok: true, data: { yearId: year.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createSubjectAction(
  formData: FormData,
): Promise<ActionResult<{ subjectId: string }>> {
  try {
    const parsed = createSubjectSchema.safeParse({
      organizationId: formData.get("organizationId"),
      name: formData.get("name"),
    });
    if (!parsed.success) throw new AppError("validation_failed", "Entrée invalide.");
    const { supabase, user } = await requireOrgAdmin(parsed.data.organizationId);

    const { data: subject, error } = await supabase
      .from("subjects")
      .insert({ organization_id: parsed.data.organizationId, name: parsed.data.name })
      .select("id")
      .single();
    if (error || !subject) throw new AppError("conflict", "Matière déjà existante.");

    await writeAuditLog({
      organizationId: parsed.data.organizationId,
      actorId: user.id,
      action: "subject.create",
      entityType: "subject",
      entityId: subject.id,
    });
    revalidatePath("/administration");
    return { ok: true, data: { subjectId: subject.id } };
  } catch (error) {
    return toActionError(error);
  }
}

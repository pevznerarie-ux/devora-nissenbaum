import "server-only";
import { DEFAULT_SUBJECTS, hebrewAcademicYearLabel } from "@pedagoos/shared";
import { createAdminClient } from "@/lib/supabase/admin";

function currentSchoolYear(today = new Date()) {
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth() + 1;
  const startYear = month >= 7 ? year : year - 1;
  const startsOn = `${startYear}-09-01`;
  const endsOn = `${startYear + 1}-08-31`;

  return {
    label: `${startYear}-${startYear + 1}`,
    hebrew_label: hebrewAcademicYearLabel(startsOn, endsOn),
    starts_on: startsOn,
    ends_on: endsOn,
    is_current: true,
  };
}

function sanitizeForLog(message: string): string {
  return message.replace(/eyJ[A-Za-z0-9._-]{10,}/g, "[masqué]").slice(0, 300);
}

export async function ensureOrganizationDefaults(organizationId: string) {
  const admin = createAdminClient();

  const { data: schools, error: schoolsReadError } = await admin
    .from("schools")
    .select("id")
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .limit(1);
  if (schoolsReadError) {
    console.error(
      "[onboarding.defaults] lecture établissements impossible:",
      sanitizeForLog(schoolsReadError.message),
    );
  }
  if (!schoolsReadError && (schools ?? []).length === 0) {
    const { error } = await admin.from("schools").insert({
      organization_id: organizationId,
      name: "Établissement principal",
    });
    if (error) {
      console.error(
        "[onboarding.defaults] création établissement impossible:",
        sanitizeForLog(error.message),
      );
    }
  }

  const { data: years, error: yearsReadError } = await admin
    .from("academic_years")
    .select("id")
    .eq("organization_id", organizationId)
    .limit(1);
  if (yearsReadError) {
    console.error(
      "[onboarding.defaults] lecture années impossible:",
      sanitizeForLog(yearsReadError.message),
    );
  }
  if (!yearsReadError && (years ?? []).length === 0) {
    const year = currentSchoolYear();
    const { error } = await admin.from("academic_years").insert({
      organization_id: organizationId,
      ...year,
    });
    if (error) {
      console.error(
        "[onboarding.defaults] création année impossible:",
        sanitizeForLog(error.message),
      );
    }
  }

  const { data: subjects, error: subjectsReadError } = await admin
    .from("subjects")
    .select("id")
    .eq("organization_id", organizationId)
    .limit(1);
  if (subjectsReadError) {
    console.error(
      "[onboarding.defaults] lecture matières impossible:",
      sanitizeForLog(subjectsReadError.message),
    );
  }
  if (!subjectsReadError && (subjects ?? []).length === 0) {
    const { error } = await admin
      .from("subjects")
      .insert(
        DEFAULT_SUBJECTS.map((name) => ({ organization_id: organizationId, name })),
      );
    if (error) {
      console.error(
        "[onboarding.defaults] création matières impossible:",
        sanitizeForLog(error.message),
      );
    }
  }
}

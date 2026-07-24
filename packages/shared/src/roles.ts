/**
 * Rôles de la plateforme (docs/product-requirements.md §2).
 * Doit rester aligné avec l'enum Postgres `member_role`
 * (supabase/migrations/0001_initial_schema.sql).
 */
export const MEMBER_ROLES = [
  "platform_admin",
  "org_admin",
  "school_director",
  "pedagogical_lead",
  "teacher",
  "grader",
  "student",
  "parent",
] as const;

export type MemberRole = (typeof MEMBER_ROLES)[number];

/** Rôles autorisés à administrer une organisation. */
export const ORG_ADMIN_ROLES: readonly MemberRole[] = ["platform_admin", "org_admin"];

/** Rôles pouvant créer et éditer du contenu pédagogique. */
export const EDUCATOR_ROLES: readonly MemberRole[] = [
  "org_admin",
  "school_director",
  "pedagogical_lead",
  "teacher",
];

/** Rôles qu'un org_admin peut inviter (le platform_admin est provisionné à part). */
export const INVITABLE_ROLES: readonly MemberRole[] = [
  "org_admin",
  "school_director",
  "pedagogical_lead",
  "teacher",
  "grader",
];

export function isMemberRole(value: string): value is MemberRole {
  return (MEMBER_ROLES as readonly string[]).includes(value);
}

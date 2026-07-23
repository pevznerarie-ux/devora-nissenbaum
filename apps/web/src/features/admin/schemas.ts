import { z } from "zod";
import { INVITABLE_ROLES, type MemberRole } from "@pedagoos/shared";

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(120),
});

export const createSchoolSchema = z.object({
  organizationId: z.uuid(),
  name: z.string().trim().min(2).max(120),
});

export const createInvitationSchema = z.object({
  organizationId: z.uuid(),
  email: z.email().transform((v) => v.toLowerCase()),
  role: z.enum(INVITABLE_ROLES as readonly [MemberRole, ...MemberRole[]]),
  schoolId: z
    .uuid()
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const acceptNewAccountSchema = z.object({
  token: z.string().min(20),
  fullName: z.string().trim().min(2).max(120),
  password: z.string().min(8).max(200),
});

export const acceptExistingSchema = z.object({
  token: z.string().min(20),
});

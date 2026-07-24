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

export const createAcademicYearSchema = z
  .object({
    organizationId: z.uuid(),
    label: z.string().trim().min(4).max(40),
    hebrewLabel: z
      .string()
      .trim()
      .max(40)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    isCurrent: z.boolean(),
  })
  .refine((v) => v.startsOn < v.endsOn, { message: "startsOn doit précéder endsOn" });

export const createSubjectSchema = z.object({
  organizationId: z.uuid(),
  name: z.string().trim().min(1).max(80),
});

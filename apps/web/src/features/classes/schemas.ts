import { z } from "zod";
import { GRADE_LEVELS, type GradeLevel } from "@pedagoos/shared";

export const createClassSchema = z.object({
  organizationId: z.uuid(),
  schoolId: z.uuid(),
  academicYearId: z.uuid(),
  name: z.string().trim().min(1).max(120),
  gradeLevel: z.enum(GRADE_LEVELS as readonly [GradeLevel, ...GradeLevel[]]),
  subjectId: z
    .uuid()
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const classIdSchema = z.object({ classId: z.uuid() });

export const addTeacherSchema = z.object({
  classId: z.uuid(),
  profileId: z.uuid(),
});

export const addStudentSchema = z.object({
  classId: z.uuid(),
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().min(1).max(120),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

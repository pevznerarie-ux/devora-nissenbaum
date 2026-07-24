import { z } from "zod";
import { GRADE_LEVELS, LOCALES, type GradeLevel, type Locale } from "@pedagoos/shared";

export const MAX_SOURCE_FILE_SIZE = 20 * 1024 * 1024; // 20 Mo

export const uploadSourceSchema = z.object({
  organizationId: z.uuid(),
  title: z.string().trim().min(1).max(200),
  language: z.enum(LOCALES as readonly [Locale, ...Locale[]]),
  gradeLevel: z
    .enum(GRADE_LEVELS as readonly [GradeLevel, ...GradeLevel[]])
    .optional()
    .or(z.literal("").transform(() => undefined)),
  subjectId: z
    .uuid()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  schoolId: z
    .uuid()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  tags: z
    .string()
    .max(500)
    .transform((value) =>
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
        .slice(0, 20),
    ),
});

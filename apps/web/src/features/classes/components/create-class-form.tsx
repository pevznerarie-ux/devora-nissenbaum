"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { GRADE_LEVELS, type ActionResult } from "@pedagoos/shared";
import { Button, Input, Label } from "@pedagoos/ui";
import { createClassAction } from "../actions";
import type { ClassFormData } from "../queries";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function CreateClassForm({ formData }: { formData: ClassFormData }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(
    async (_prev: ActionResult<{ classId: string }> | null, fd: FormData) =>
      createClassAction(fd),
    null,
  );

  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      <input type="hidden" name="organizationId" value={formData.organizationId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="class-name">{t("classes.name")}</Label>
        <Input id="class-name" name="name" required maxLength={120} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="class-school">{t("classes.school")}</Label>
        <select id="class-school" name="schoolId" required className={selectClassName}>
          {formData.schools.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="class-year">{t("classes.year")}</Label>
        <select
          id="class-year"
          name="academicYearId"
          required
          className={selectClassName}
        >
          {formData.years.map((year) => (
            <option key={year.id} value={year.id}>
              {year.hebrew_label ? `${year.label} · ${year.hebrew_label}` : year.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="class-grade">{t("classes.grade")}</Label>
        <select id="class-grade" name="gradeLevel" required className={selectClassName}>
          {GRADE_LEVELS.map((grade) => (
            <option key={grade} value={grade}>
              {t(`grades.${grade}`)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="class-subject">{t("classes.subject")}</Label>
        <select id="class-subject" name="subjectId" className={selectClassName}>
          <option value="">{t("classes.subjectNone")}</option>
          {formData.subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>
      {state !== null && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {state.message || t("common.error")}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {t("classes.create")}
      </Button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { GRADE_LEVELS, LOCALES, type ActionResult } from "@pedagoos/shared";
import { Button, Input, Label } from "@pedagoos/ui";
import { uploadSourceAction } from "../actions";
import type { LibraryFormData } from "../queries";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function UploadSourceForm({ formData }: { formData: LibraryFormData }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(
    async (_prev: ActionResult<{ documentId: string }> | null, fd: FormData) =>
      uploadSourceAction(fd),
    null,
  );

  return (
    <form action={action} className="flex max-w-xl flex-col gap-4">
      <input type="hidden" name="organizationId" value={formData.organizationId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="src-file">{t("library.file")}</Label>
        <Input
          id="src-file"
          name="file"
          type="file"
          required
          accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/png,image/jpeg,image/webp"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="src-title">{t("library.docTitle")}</Label>
        <Input id="src-title" name="title" required maxLength={200} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="src-language">{t("library.language")}</Label>
          <select id="src-language" name="language" required className={selectClassName}>
            {LOCALES.map((locale) => (
              <option key={locale} value={locale}>
                {t(`languages.${locale}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="src-grade">{t("library.grade")}</Label>
          <select id="src-grade" name="gradeLevel" className={selectClassName}>
            <option value="">{t("library.gradeNone")}</option>
            {GRADE_LEVELS.map((grade) => (
              <option key={grade} value={grade}>
                {t(`grades.${grade}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="src-subject">{t("library.subject")}</Label>
          <select id="src-subject" name="subjectId" className={selectClassName}>
            <option value="">{t("library.subjectNone")}</option>
            {formData.subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="src-school">{t("library.school")}</Label>
          <select id="src-school" name="schoolId" className={selectClassName}>
            <option value="">{t("library.schoolNone")}</option>
            {formData.schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="src-tags">{t("library.tags")}</Label>
        <Input id="src-tags" name="tags" maxLength={500} />
      </div>
      {state !== null && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {state.code === "validation_failed" ? state.message : t("common.error")}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? t("common.loading") : t("library.upload")}
      </Button>
    </form>
  );
}

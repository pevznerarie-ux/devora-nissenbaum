"use client";

import { useTranslations } from "next-intl";
import { LOCALES } from "@pedagoos/shared";
import { Button, Input, Label } from "@pedagoos/ui";
import { createSequenceAction } from "../actions";
import type { NewSequenceFormData } from "../queries";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function NewSequenceForm({ formData }: { formData: NewSequenceFormData }) {
  const t = useTranslations();

  return (
    <form action={createSequenceAction} className="flex max-w-md flex-col gap-4">
      <input type="hidden" name="organizationId" value={formData.organizationId} />
      {/* Le niveau suit la classe choisie ; on l'envoie via un champ dérivé. */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="seq-class">{t("sequences.class")}</Label>
        <select
          id="seq-class"
          name="classId"
          required
          className={selectClassName}
          onChange={(event) => {
            const option = event.target.selectedOptions[0];
            const grade = option?.dataset["grade"] ?? "";
            const hidden = event.currentTarget.form?.elements.namedItem("gradeLevel");
            if (hidden instanceof HTMLInputElement) hidden.value = grade;
          }}
        >
          {formData.classes.map((cls) => (
            <option key={cls.id} value={cls.id} data-grade={cls.grade_level}>
              {cls.name}
            </option>
          ))}
        </select>
        <input
          type="hidden"
          name="gradeLevel"
          defaultValue={formData.classes[0]?.grade_level ?? ""}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="seq-subject">{t("sequences.subject")}</Label>
        <select id="seq-subject" name="subjectId" className={selectClassName}>
          <option value="">{t("sequences.subjectNone")}</option>
          {formData.subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="seq-theme">{t("sequences.theme")}</Label>
        <Input id="seq-theme" name="theme" required maxLength={200} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="seq-language">{t("sequences.language")}</Label>
        <select id="seq-language" name="language" required className={selectClassName}>
          {LOCALES.map((locale) => (
            <option key={locale} value={locale}>
              {t(`languages.${locale}`)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-4">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="seq-count">{t("sequences.sessionCount")}</Label>
          <Input
            id="seq-count"
            name="sessionCount"
            type="number"
            min={1}
            max={20}
            defaultValue={4}
            required
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="seq-duration">{t("sequences.sessionDuration")}</Label>
          <Input
            id="seq-duration"
            name="sessionDurationMinutes"
            type="number"
            min={15}
            max={240}
            step={5}
            defaultValue={55}
            required
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="seq-difficulty">{t("sequences.difficulty")}</Label>
        <select
          id="seq-difficulty"
          name="difficulty"
          required
          className={selectClassName}
        >
          <option value="easier">{t("sequences.difficultyEasier")}</option>
          <option value="standard">{t("sequences.difficultyStandard")}</option>
          <option value="harder">{t("sequences.difficultyHarder")}</option>
        </select>
      </div>
      <Button type="submit">{t("sequences.create")}</Button>
    </form>
  );
}

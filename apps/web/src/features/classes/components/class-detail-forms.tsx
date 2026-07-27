"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { ActionResult } from "@pedagoos/shared";
import { Button, Input, Label, Textarea } from "@pedagoos/ui";
import {
  addStudentAction,
  addStudentsTextAction,
  addTeacherAction,
  archiveClassAction,
  importStudentsCsvAction,
  saveStudentNoteAction,
  type ImportReport,
} from "../actions";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function AddTeacherForm({
  classId,
  teachers,
}: {
  classId: string;
  teachers: { profile_id: string; full_name: string }[];
}) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(
    async (_prev: ActionResult<{ added: true }> | null, fd: FormData) =>
      addTeacherAction(fd),
    null,
  );
  if (teachers.length === 0) return null;

  return (
    <form action={action} className="flex max-w-md items-end gap-2">
      <input type="hidden" name="classId" value={classId} />
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor="teacher-select">{t("classes.selectTeacher")}</Label>
        <select id="teacher-select" name="profileId" required className={selectClassName}>
          {teachers.map((teacher) => (
            <option key={teacher.profile_id} value={teacher.profile_id}>
              {teacher.full_name}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {t("classes.addTeacher")}
      </Button>
      {state !== null && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {t("common.error")}
        </p>
      )}
    </form>
  );
}

export function AddStudentForm({ classId }: { classId: string }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(
    async (_prev: ActionResult<{ created: number }> | null, fd: FormData) =>
      addStudentAction(fd),
    null,
  );

  return (
    <form action={action} className="flex max-w-2xl flex-wrap items-end gap-2">
      <input type="hidden" name="classId" value={classId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="student-first">{t("students.firstName")}</Label>
        <Input id="student-first" name="firstName" required maxLength={120} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="student-last">{t("students.lastName")}</Label>
        <Input id="student-last" name="lastName" required maxLength={120} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="student-birth">{t("students.birthDate")}</Label>
        <Input id="student-birth" name="birthDate" type="date" />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {t("students.add")}
      </Button>
      {state !== null && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {t("common.error")}
        </p>
      )}
    </form>
  );
}

export function ImportCsvForm({ classId }: { classId: string }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(
    async (_prev: ActionResult<ImportReport> | null, fd: FormData) =>
      importStudentsCsvAction(fd),
    null,
  );

  const errorLabel = (code: string) =>
    code === "invalid_date" ? t("students.errInvalidDate") : t("students.errMissingName");

  return (
    <div className="flex max-w-2xl flex-col gap-2">
      <form action={action} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="classId" value={classId} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="csv-file">{t("students.importFile")}</Label>
          <Input id="csv-file" name="file" type="file" accept=".csv,text/csv" required />
        </div>
        <Button type="submit" variant="outline" disabled={pending}>
          {t("students.import")}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">{t("students.importHelp")}</p>
      {state !== null && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {t("common.error")}
        </p>
      )}
      {state !== null && state.ok && (
        <div className="flex flex-col gap-1 text-sm" role="status">
          <p>
            {t("students.importResult", {
              created: state.data.created,
              errors: state.data.errors.length,
            })}
          </p>
          {state.data.errors.map((error) => (
            <p key={`${error.line}-${error.code}`} className="text-destructive">
              {t("students.errorLine", {
                line: error.line,
                message: errorLabel(error.code),
              })}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function AddStudentsTextForm({ classId }: { classId: string }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(
    async (_prev: ActionResult<ImportReport> | null, fd: FormData) =>
      addStudentsTextAction(fd),
    null,
  );

  return (
    <div className="flex max-w-2xl flex-col gap-2">
      <form action={action} className="flex flex-col gap-2">
        <input type="hidden" name="classId" value={classId} />
        <Label htmlFor="students-text">{t("students.quickAdd")}</Label>
        <Textarea
          id="students-text"
          name="studentsText"
          rows={6}
          placeholder={t("students.quickAddPlaceholder")}
        />
        <div className="flex items-center gap-3">
          <Button type="submit" variant="secondary" disabled={pending}>
            {t("students.addMany")}
          </Button>
          <p className="text-xs text-muted-foreground">{t("students.quickAddHelp")}</p>
        </div>
      </form>
      {state !== null && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {t("common.error")}
        </p>
      )}
      {state !== null && state.ok && (
        <p className="text-sm text-muted-foreground" role="status">
          {t("students.importResult", {
            created: state.data.created,
            errors: state.data.errors.length,
          })}
        </p>
      )}
    </div>
  );
}

export function StudentNoteForm({
  classId,
  studentId,
  note,
}: {
  classId: string;
  studentId: string;
  note: string;
}) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(
    async (_prev: ActionResult<{ saved: true }> | null, fd: FormData) =>
      saveStudentNoteAction(fd),
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="studentId" value={studentId} />
      <Textarea
        name="note"
        defaultValue={note}
        rows={3}
        maxLength={4000}
        placeholder={t("students.notePlaceholder")}
        className="min-h-20"
      />
      <div className="flex items-center justify-between gap-2">
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          {t("students.saveNote")}
        </Button>
        {state !== null && (
          <span
            role={state.ok ? "status" : "alert"}
            className={`text-xs ${state.ok ? "text-muted-foreground" : "text-destructive"}`}
          >
            {state.ok ? t("students.noteSaved") : t("common.error")}
          </span>
        )}
      </div>
    </form>
  );
}

export function ArchiveClassButton({ classId }: { classId: string }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(
    async (_prev: ActionResult<{ archived: true }> | null, fd: FormData) =>
      archiveClassAction(fd),
    null,
  );

  return (
    <form action={action}>
      <input type="hidden" name="classId" value={classId} />
      <Button type="submit" variant="destructive" size="sm" disabled={pending}>
        {t("classes.archive")}
      </Button>
      {state !== null && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {t("common.error")}
        </p>
      )}
    </form>
  );
}

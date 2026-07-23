"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { ActionResult } from "@pedagoos/shared";
import { Button, Input, Label } from "@pedagoos/ui";
import { createSubjectAction } from "../actions";

export function CreateSubjectForm({ organizationId }: { organizationId: string }) {
  const t = useTranslations();
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult<{ subjectId: string }> | null, fd: FormData) =>
      createSubjectAction(fd),
    null,
  );

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <input type="hidden" name="organizationId" value={organizationId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="subject-name">{t("adminSubjects.name")}</Label>
        <Input id="subject-name" name="name" required minLength={1} maxLength={80} />
      </div>
      {state !== null && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {t("common.error")}
        </p>
      )}
      <Button type="submit" variant="secondary" disabled={pending}>
        {t("adminSubjects.create")}
      </Button>
    </form>
  );
}

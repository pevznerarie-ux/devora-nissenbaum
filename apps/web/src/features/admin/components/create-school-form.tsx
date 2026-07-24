"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { ActionResult } from "@pedagoos/shared";
import { Button, Input, Label } from "@pedagoos/ui";
import { createSchoolAction } from "../actions";

export function CreateSchoolForm({ organizationId }: { organizationId: string }) {
  const t = useTranslations();
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult<{ schoolId: string }> | null, fd: FormData) =>
      createSchoolAction(fd),
    null,
  );

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <input type="hidden" name="organizationId" value={organizationId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="school-name">{t("admin.schoolName")}</Label>
        <Input id="school-name" name="name" required minLength={2} maxLength={120} />
      </div>
      {state !== null && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {t("common.error")}
        </p>
      )}
      <Button type="submit" variant="secondary" disabled={pending}>
        {t("admin.createSchool")}
      </Button>
    </form>
  );
}

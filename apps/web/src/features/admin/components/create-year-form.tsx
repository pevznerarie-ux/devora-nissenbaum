"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { ActionResult } from "@pedagoos/shared";
import { Button, Input, Label } from "@pedagoos/ui";
import { createAcademicYearAction } from "../actions";

export function CreateYearForm({ organizationId }: { organizationId: string }) {
  const t = useTranslations();
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult<{ yearId: string }> | null, fd: FormData) =>
      createAcademicYearAction(fd),
    null,
  );

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <input type="hidden" name="organizationId" value={organizationId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="year-label">{t("adminYears.label")}</Label>
        <Input id="year-label" name="label" required minLength={4} maxLength={40} />
      </div>
      <div className="flex gap-4">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="year-start">{t("adminYears.startsOn")}</Label>
          <Input id="year-start" name="startsOn" type="date" required />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="year-end">{t("adminYears.endsOn")}</Label>
          <Input id="year-end" name="endsOn" type="date" required />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input id="year-current" name="isCurrent" type="checkbox" className="size-4" />
        <Label htmlFor="year-current">{t("adminYears.isCurrent")}</Label>
      </div>
      {state !== null && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {t("common.error")}
        </p>
      )}
      <Button type="submit" variant="secondary" disabled={pending}>
        {t("adminYears.create")}
      </Button>
    </form>
  );
}

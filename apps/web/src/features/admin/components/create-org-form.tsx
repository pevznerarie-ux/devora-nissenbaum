"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { ActionResult } from "@pedagoos/shared";
import { Button, Input, Label } from "@pedagoos/ui";
import { createOrganizationAction } from "../actions";

export function CreateOrgForm() {
  const t = useTranslations();
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult<{ organizationId: string }> | null, fd: FormData) =>
      createOrganizationAction(fd),
    null,
  );

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="org-name">{t("admin.orgName")}</Label>
        <Input id="org-name" name="name" required minLength={2} maxLength={120} />
      </div>
      {state !== null && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {t("common.error")}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {t("admin.createOrg")}
      </Button>
    </form>
  );
}

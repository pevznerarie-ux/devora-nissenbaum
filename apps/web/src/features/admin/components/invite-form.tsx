"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { INVITABLE_ROLES, type ActionResult } from "@pedagoos/shared";
import { Button, Input, Label, cn } from "@pedagoos/ui";
import { createInvitationAction } from "../actions";
import type { AdminSchool } from "../queries";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function InviteForm({
  organizationId,
  schools,
}: {
  organizationId: string;
  schools: AdminSchool[];
}) {
  const t = useTranslations();
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult<{ path: string }> | null, fd: FormData) =>
      createInvitationAction(fd),
    null,
  );

  const invitationUrl =
    state !== null && state.ok
      ? `${typeof window === "undefined" ? "" : window.location.origin}${state.data.path}`
      : null;

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex max-w-md flex-col gap-4">
        <input type="hidden" name="organizationId" value={organizationId} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-email">{t("admin.inviteEmail")}</Label>
          <Input id="invite-email" name="email" type="email" required dir="ltr" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-role">{t("admin.inviteRole")}</Label>
          <select id="invite-role" name="role" required className={selectClassName}>
            {INVITABLE_ROLES.map((role) => (
              <option key={role} value={role}>
                {t(`roles.${role}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-school">{t("admin.inviteSchool")}</Label>
          <select id="invite-school" name="schoolId" className={selectClassName}>
            <option value="">{t("admin.inviteNone")}</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>
        {state !== null && !state.ok && (
          <p role="alert" className="text-sm text-destructive">
            {t("common.error")}
          </p>
        )}
        <Button type="submit" disabled={pending}>
          {t("admin.sendInvite")}
        </Button>
      </form>

      {invitationUrl !== null && (
        <div className="flex max-w-xl flex-col gap-2 rounded-md border bg-muted p-4">
          <Label htmlFor="invite-link">{t("admin.inviteLinkLabel")}</Label>
          <div className="flex gap-2">
            <Input
              id="invite-link"
              readOnly
              value={invitationUrl}
              dir="ltr"
              className={cn("font-mono text-xs")}
              onFocus={(event) => event.currentTarget.select()}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void navigator.clipboard.writeText(invitationUrl);
              }}
            >
              {t("common.copy")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t("admin.inviteLinkHelp")}</p>
        </div>
      )}
    </div>
  );
}

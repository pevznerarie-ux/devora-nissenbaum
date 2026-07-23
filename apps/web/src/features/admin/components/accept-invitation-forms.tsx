"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button, Input, Label } from "@pedagoos/ui";
import {
  acceptInvitationExistingAction,
  acceptInvitationNewAccountAction,
  type AcceptInvitationState,
} from "../actions";

const initialState: AcceptInvitationState = { error: null };

function ErrorMessage({ error }: { error: AcceptInvitationState["error"] }) {
  const t = useTranslations();
  if (error === null) return null;
  const key =
    error === "accountExists"
      ? "invitation.accountExists"
      : error === "wrongAccount"
        ? "invitation.wrongAccount"
        : error === "invalid"
          ? "invitation.invalid"
          : "common.error";
  return (
    <p role="alert" className="text-sm text-destructive">
      {t(key)}
    </p>
  );
}

/** La personne invitée n'a pas encore de compte : création + rattachement. */
export function AcceptNewAccountForm({ token }: { token: string }) {
  const t = useTranslations("invitation");
  const [state, formAction, pending] = useActionState(
    acceptInvitationNewAccountAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">{t("fullName")}</Label>
        <Input id="fullName" name="fullName" required minLength={2} maxLength={120} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          dir="ltr"
        />
      </div>
      <ErrorMessage error={state.error} />
      <Button type="submit" disabled={pending}>
        {t("submitNew")}
      </Button>
    </form>
  );
}

/** Compte déjà connecté (ex. professeur invité dans une seconde organisation). */
export function AcceptExistingForm({ token }: { token: string }) {
  const t = useTranslations("invitation");
  const [state, formAction, pending] = useActionState(
    acceptInvitationExistingAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <ErrorMessage error={state.error} />
      <Button type="submit" disabled={pending}>
        {t("submitExisting")}
      </Button>
    </form>
  );
}

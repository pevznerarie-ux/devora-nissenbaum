"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button, Input, Label } from "@pedagoos/ui";
import { signInAction, type SignInState } from "./actions";

const initialState: SignInState = { error: null };

export function LoginForm() {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          dir="ltr"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          dir="ltr"
        />
      </div>
      {state.error !== null && (
        <p role="alert" className="text-sm text-destructive">
          {t("invalidCredentials")}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {t("signIn")}
      </Button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button, Input, Label } from "@pedagoos/ui";
import { signUpAction, type SignUpState } from "./actions";

const initialState: SignUpState = { error: null };

export function SignUpForm() {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(signUpAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">{t("fullName")}</Label>
        <Input id="fullName" name="fullName" type="text" autoComplete="name" required />
      </div>
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
          autoComplete="new-password"
          minLength={8}
          required
          dir="ltr"
        />
        <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
      </div>
      {state.error !== null && (
        <p role="alert" className="text-sm text-destructive">
          {t(state.error)}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {t("signUp")}
      </Button>
      <p className="text-sm text-muted-foreground">
        {t("haveAccount")}{" "}
        <Link href="/login" className="font-medium text-foreground underline">
          {t("signInLink")}
        </Link>
      </p>
    </form>
  );
}

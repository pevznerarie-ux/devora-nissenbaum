import { getTranslations } from "next-intl/server";
import { PRODUCT_NAME } from "@pedagoos/shared";
import { Card, CardContent, CardHeader } from "@pedagoos/ui";
import { LoginForm } from "@/features/auth/login-form";

export default async function LoginPage() {
  const t = await getTranslations("auth");
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <p className="text-sm font-medium text-muted-foreground">{PRODUCT_NAME}</p>
          <h1 className="text-lg font-semibold leading-none">{t("signInTitle")}</h1>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}

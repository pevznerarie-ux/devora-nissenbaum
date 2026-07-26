import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PRODUCT_NAME } from "@pedagoos/shared";
import { Card, CardContent, CardHeader } from "@pedagoos/ui";
import { createClient } from "@/lib/supabase/server";
import { SignUpForm } from "@/features/auth/signup-form";

export default async function SignUpPage() {
  const t = await getTranslations();

  // Déjà connecté : rien à créer, on renvoie vers l'espace.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="text-sm font-medium text-muted-foreground">{PRODUCT_NAME}</p>
          <h1 className="text-lg font-semibold leading-none">{t("auth.signUpTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("auth.signUpSubtitle")}</p>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
      </Card>
    </main>
  );
}

import { getTranslations } from "next-intl/server";
import { PRODUCT_NAME } from "@pedagoos/shared";
import { Card, CardContent, CardHeader } from "@pedagoos/ui";
import { getInvitationPreview } from "@/features/admin/invitation-queries";
import {
  AcceptExistingForm,
  AcceptNewAccountForm,
} from "@/features/admin/components/accept-invitation-forms";
import { createClient } from "@/lib/supabase/server";

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const t = await getTranslations();
  const invitation = await getInvitationPreview(token);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="text-sm font-medium text-muted-foreground">{PRODUCT_NAME}</p>
          <h1 className="text-lg font-semibold leading-none">{t("invitation.title")}</h1>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {invitation === null ? (
            <p role="alert" className="text-sm text-destructive">
              {t("invitation.invalid")}
            </p>
          ) : (
            <>
              <p className="text-sm">
                {t("invitation.intro", {
                  org: invitation.organizationName,
                  role: t(`roles.${invitation.role}`),
                })}
              </p>
              {user ? (
                (user.email ?? "").toLowerCase() === invitation.email.toLowerCase() ? (
                  <AcceptExistingForm token={token} />
                ) : (
                  <p role="alert" className="text-sm text-destructive">
                    {t("invitation.wrongAccount")}
                  </p>
                )
              ) : (
                <AcceptNewAccountForm token={token} />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

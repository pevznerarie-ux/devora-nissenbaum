import { getFormatter, getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@pedagoos/ui";
import { getAdminContext } from "@/features/admin/queries";
import { CreateOrgForm } from "@/features/admin/components/create-org-form";
import { CreateSchoolForm } from "@/features/admin/components/create-school-form";
import { InviteForm } from "@/features/admin/components/invite-form";

export default async function AdministrationPage() {
  const t = await getTranslations();
  const format = await getFormatter();
  const context = await getAdminContext();

  if (context.kind === "unauthenticated") {
    return null; // Le layout du dashboard redirige déjà vers /login.
  }

  if (context.kind === "no_org") {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">{t("admin.noOrgTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.noOrgHelp")}</p>
        <CreateOrgForm />
      </div>
    );
  }

  if (context.kind === "not_admin") {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">{t("nav.administration")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.notAdmin")}</p>
      </div>
    );
  }

  const { organization, schools, pendingInvitations } = context;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("nav.administration")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.orgTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{organization.name}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.schoolsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {schools.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("admin.schoolsEmpty")}</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {schools.map((school) => (
                <li key={school.id} className="rounded-md border px-3 py-2">
                  {school.name}
                </li>
              ))}
            </ul>
          )}
          <CreateSchoolForm organizationId={organization.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.invitationsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {pendingInvitations.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("admin.invitationsEmpty")}</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {pendingInvitations.map((invitation) => (
                <li
                  key={invitation.id}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                >
                  <span dir="ltr">{invitation.email}</span>
                  <span className="text-muted-foreground">
                    {t(`roles.${invitation.role}`)} ·{" "}
                    {t("admin.pendingExpires", {
                      date: format.dateTime(new Date(invitation.expires_at), {
                        dateStyle: "medium",
                      }),
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <InviteForm organizationId={organization.id} schools={schools} />
        </CardContent>
      </Card>
    </div>
  );
}

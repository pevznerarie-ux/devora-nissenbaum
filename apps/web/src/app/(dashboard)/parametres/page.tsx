import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@pedagoos/ui";

export default async function SettingsPage() {
  const t = await getTranslations();

  const sections = [
    {
      title: t("settings.profileTitle"),
      items: [
        t("settings.profileName"),
        t("settings.profileEmail"),
        t("settings.profileLanguage"),
      ],
    },
    {
      title: t("settings.subscriptionTitle"),
      items: [
        t("settings.subscriptionPlan"),
        t("settings.subscriptionPayment"),
        t("settings.subscriptionInvoices"),
      ],
    },
    {
      title: t("settings.teachingTitle"),
      items: [
        t("settings.teachingSchools"),
        t("settings.teachingSubjects"),
        t("settings.teachingClasses"),
      ],
    },
    {
      title: t("settings.documentsTitle"),
      items: [
        t("settings.documentsLayout"),
        t("settings.documentsLogo"),
        t("settings.documentsLanguage"),
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("settings.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("settings.intro")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="text-base">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2 text-sm">
                {section.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <span>{item}</span>
                    <span className="text-xs text-muted-foreground">
                      {t("settings.soon")}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@pedagoos/ui";

export default async function HomePage() {
  const t = await getTranslations("dashboard");
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t("empty")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("placeholder")}</p>
        </CardContent>
      </Card>
    </div>
  );
}

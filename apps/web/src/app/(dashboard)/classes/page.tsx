import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@pedagoos/ui";
import { getClassFormData, listClasses } from "@/features/classes/queries";
import { CreateClassForm } from "@/features/classes/components/create-class-form";

export default async function ClassesPage() {
  const t = await getTranslations();
  const [classes, formData] = await Promise.all([listClasses(), getClassFormData()]);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">{t("nav.classes")}</h1>

      {classes.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("classes.empty")}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map((cls) => (
            <li key={cls.id}>
              <Link
                href={`/classes/${cls.id}`}
                className="block rounded-md border bg-card p-4 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <p className="font-medium">
                  {cls.name}
                  {cls.archived_at !== null && (
                    <span className="ms-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {t("classes.archived")}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(`grades.${cls.grade_level}`)} · {cls.schools?.name} ·{" "}
                  {cls.academic_years?.label}
                  {cls.subjects ? ` · ${cls.subjects.name}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {formData !== null && (
        <Card>
          <CardHeader>
            <CardTitle>{t("classes.createTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {formData.schools.length === 0 || formData.years.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("classes.needSchoolYear")}
              </p>
            ) : (
              <CreateClassForm formData={formData} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

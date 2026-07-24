import { getFormatter, getTranslations } from "next-intl/server";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  cn,
} from "@pedagoos/ui";
import { textDirection } from "@pedagoos/shared";
import { getLibraryFormData, listSources } from "@/features/library/queries";
import { UploadSourceForm } from "@/features/library/components/upload-form";

const STATUS_STYLES: Record<string, string> = {
  ready: "bg-secondary text-secondary-foreground",
  processing: "bg-muted text-muted-foreground",
  pending: "bg-muted text-muted-foreground",
  awaiting_ocr: "bg-accent text-accent-foreground",
  failed: "bg-destructive/10 text-destructive",
};

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const t = await getTranslations();
  const format = await getFormatter();
  const [documents, formData] = await Promise.all([
    listSources(q ?? null),
    getLibraryFormData(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("nav.library")}</h1>

      <form method="get" className="flex max-w-xl gap-2" role="search">
        <Input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder={t("library.searchPlaceholder")}
          aria-label={t("library.search")}
        />
        <Button type="submit" variant="secondary">
          {t("library.search")}
        </Button>
      </form>

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("library.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <p className="font-medium" dir={textDirection(doc.language)}>
                  {doc.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {[
                    doc.subjects?.name,
                    doc.grade_level ? t(`grades.${doc.grade_level}`) : null,
                    t(`languages.${doc.language}`),
                    doc.schools?.name ?? t("library.schoolNone"),
                    format.dateTime(new Date(doc.created_at), { dateStyle: "medium" }),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  {doc.tags.length > 0 ? ` · ${doc.tags.join(", ")}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs",
                    STATUS_STYLES[doc.processing_status] ?? "bg-muted",
                  )}
                >
                  {t(`library.status.${doc.processing_status}`)}
                </span>
                <a
                  href={`/api/sources/${doc.id}/download`}
                  className="text-sm underline underline-offset-4 hover:no-underline"
                >
                  {t("library.download")}
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}

      {formData !== null && (
        <Card>
          <CardHeader>
            <CardTitle>{t("library.uploadTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <UploadSourceForm formData={formData} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

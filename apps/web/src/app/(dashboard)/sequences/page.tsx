import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@pedagoos/ui";
import { DEMO_SEQUENCE_ID } from "@/lib/demo-data";
import { getNewSequenceFormData, listSequences } from "@/features/sequences/queries";
import { NewSequenceForm } from "@/features/sequences/components/new-sequence-form";

export default async function SequencesPage() {
  const t = await getTranslations();
  const [sequences, formData] = await Promise.all([
    listSequences(),
    getNewSequenceFormData(),
  ]);
  const isDemo = sequences.some((sequence) => sequence.id === DEMO_SEQUENCE_ID);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("nav.sequences")}</h1>

      {sequences.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("sequences.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sequences.map((seq) => (
            <li key={seq.id}>
              <Link
                href={`/sequences/${seq.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card p-4 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="font-medium">{seq.title}</span>
                <span className="text-sm text-muted-foreground">
                  {seq.classes?.name} · {t(`sequences.status.${seq.status}`)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("sequences.newTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isDemo ? (
            <p className="text-sm text-muted-foreground">
              La démo contient déjà une séquence complète. Ouvrez-la pour voir la
              structure, les objectifs et les supports pédagogiques.
            </p>
          ) : formData === null ? (
            <p className="text-sm text-muted-foreground">{t("sequences.needClass")}</p>
          ) : (
            <NewSequenceForm formData={formData} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@pedagoos/ui";
import { DEMO_ORG_ID, demoMaterials } from "@/lib/demo-data";
import { getSequenceDetail, listSelectableSources } from "@/features/sequences/queries";
import { WizardStepper } from "@/features/sequences/components/wizard-stepper";
import {
  GenerateButton,
  IntentionsForm,
  SourcesForm,
} from "@/features/sequences/components/wizard-forms";
import { StructureEditor } from "@/features/sequences/components/structure-editor";
import { listMaterials } from "@/features/materials/queries";
import { MaterialsPanel } from "@/features/materials/components/materials-panel";

function currentStep(status: string): number {
  switch (status) {
    case "draft":
      return 2; // cadre déjà saisi à la création → intentions
    case "structure_proposed":
      return 5;
    case "structure_validated":
    case "materials_generated":
    case "published":
      return 6;
    default:
      return 2;
  }
}

export default async function SequenceWizardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations();

  const parsedId = z.uuid().safeParse(id);
  const detail = parsedId.success ? await getSequenceDetail(parsedId.data) : null;
  if (!detail) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">{t("nav.sequences")}</h1>
        <p className="text-sm text-muted-foreground">{t("sequences.notFound")}</p>
      </div>
    );
  }

  const step = currentStep(detail.status);
  const difficultyLabel = t(
    `sequences.difficulty${detail.difficulty === "easier" ? "Easier" : detail.difficulty === "harder" ? "Harder" : "Standard"}`,
  );
  const isDemo = detail.organization_id === DEMO_ORG_ID;
  const sortedLessons = detail.structure
    ? [...detail.structure.lessons].sort((a, b) => a.orderIndex - b.orderIndex)
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{detail.title}</h1>
        <p className="text-sm text-muted-foreground">
          {detail.subject_name ? `${detail.subject_name} · ` : ""}
          {t("sequences.frameRecap", {
            grade: detail.grade_level_hint ? t(`grades.${detail.grade_level_hint}`) : "",
            sessions: detail.session_count,
            duration: detail.session_duration_minutes,
            difficulty: difficultyLabel,
          })}
          {" · "}
          {t(`sequences.status.${detail.status}`)}
        </p>
      </div>

      <WizardStepper current={step} />

      {isDemo && detail.structure && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t("sequences.objectivesTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 text-sm md:grid-cols-3">
                {detail.structure.objectives.map((objective) => (
                  <li key={objective.id} className="rounded-md border p-3">
                    <p className="font-medium">{objective.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t(`sequences.bloom.${objective.bloomLevel}`)}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("sequences.lessonsTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-col gap-2 text-sm">
                {sortedLessons.map((lesson) => (
                  <li key={lesson.id} className="rounded-md border p-3">
                    <p className="font-medium">{lesson.title}</p>
                    <p className="mt-1 text-muted-foreground">{lesson.summary}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("sequences.materialsTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 text-sm md:grid-cols-3">
                {demoMaterials.slice(0, 9).map((material) => (
                  <li key={material.id} className="rounded-md border p-3">
                    <p className="font-medium">{t(`materials.kind.${material.kind}`)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t(`materials.status.${material.status}`)}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}

      {!isDemo && detail.status === "draft" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t("sequences.intentionsTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <IntentionsForm sequenceId={detail.id} state={detail.wizardState} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("sequences.sourcesTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <SourcesForm
                sequenceId={detail.id}
                sources={await listSelectableSources(detail.organization_id)}
                state={detail.wizardState}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("sequences.generateTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                {t("sequences.generateHelp")}
              </p>
              <GenerateButton sequenceId={detail.id} label={t("sequences.generate")} />
            </CardContent>
          </Card>
        </>
      )}

      {!isDemo && detail.status === "structure_proposed" && detail.structure && (
        <Card>
          <CardHeader>
            <CardTitle>{t("sequences.reviewTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">{t("sequences.reviewHelp")}</p>
            <StructureEditor sequenceId={detail.id} structure={detail.structure} />
          </CardContent>
        </Card>
      )}

      {!isDemo && step === 6 && detail.structure && (
        <>
          <p className="rounded-md border bg-secondary p-3 text-sm">
            {t("sequences.validatedBanner")}
          </p>
          <Card>
            <CardHeader>
              <CardTitle>{t("sequences.objectivesTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-1 text-sm">
                {detail.structure.objectives.map((objective) => (
                  <li key={objective.id} className="rounded-md border px-3 py-2">
                    {objective.title}
                    <span className="text-muted-foreground">
                      {" "}
                      · {t(`sequences.bloom.${objective.bloomLevel}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("sequences.materialsTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">{t("materials.panelHelp")}</p>
              <MaterialsPanel
                sequenceId={detail.id}
                lessons={[...detail.structure.lessons]
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((l) => ({ id: l.id, title: l.title }))}
                materials={await listMaterials(detail.id)}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

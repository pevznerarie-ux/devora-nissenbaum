import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@pedagoos/ui";
import { DEMO_ORG_ID } from "@/lib/demo-data";
import { getMaterialDetail, listMaterialVersions } from "@/features/materials/queries";
import { BlockEditor } from "@/features/materials/components/block-editor";
import { MaterialControls } from "@/features/materials/components/material-controls";

export default async function MaterialEditorPage({
  params,
}: {
  params: Promise<{ id: string; materialId: string }>;
}) {
  const { id, materialId } = await params;
  const t = await getTranslations();

  const parsedId = z.uuid().safeParse(materialId);
  const material = parsedId.success ? await getMaterialDetail(parsedId.data) : null;
  if (!material || material.sequence_id !== id) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">{t("nav.sequences")}</h1>
        <p className="text-sm text-muted-foreground">{t("materials.notFound")}</p>
      </div>
    );
  }

  const isDemo = material.organization_id === DEMO_ORG_ID;
  const versions = isDemo ? [] : await listMaterialVersions(material.id);
  const editable = !isDemo && !material.locked;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href={`/sequences/${id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← {t("materials.backToSequence")}
        </Link>
        <h1 className="text-2xl font-semibold">
          {material.title}
          {material.locked ? " 🔒" : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t(`materials.kind.${material.kind}`)} ·{" "}
          {t(`materials.status.${material.status}`)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>{t("materials.blocksTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <BlockEditor
              materialId={material.id}
              sequenceId={material.sequence_id}
              initialBlocks={material.blocks}
              editable={editable}
            />
          </CardContent>
        </Card>

        <MaterialControls
          materialId={material.id}
          status={material.status}
          versions={versions}
        />
      </div>
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import { z } from "zod";
import {
  STUDENT_VARIANT,
  TEACHER_VARIANT,
  filterBlocksForVariant,
} from "@pedagoos/pedagogy";
import { getMaterialDetail } from "@/features/materials/queries";
import { BlockDocument } from "@/features/materials/components/block-document";
import { PrintButton } from "@/features/materials/components/print-button";

/**
 * Page d'impression / PDF propre. La variante eleve cache les corriges ;
 * la variante professeur inclut les notes et reponses attendues.
 */
export default async function MaterialPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ materialId: string }>;
  searchParams: Promise<{ variant?: string }>;
}) {
  const { materialId } = await params;
  const { variant } = await searchParams;
  const t = await getTranslations();

  const parsed = z.uuid().safeParse(materialId);
  const material = parsed.success ? await getMaterialDetail(parsed.data) : null;
  if (!material) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <p className="text-sm text-muted-foreground">{t("materials.notFound")}</p>
      </main>
    );
  }

  const isTeacher = variant === "teacher";
  const exportVariant = isTeacher ? TEACHER_VARIANT : STUDENT_VARIANT;
  const blocks = filterBlocksForVariant(material.blocks, exportVariant);
  const variantLabel = isTeacher
    ? t("materials.variantTeacher")
    : t("materials.variantStudent");
  const today = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <main className="mx-auto max-w-[820px] bg-white p-8 text-slate-950 print:max-w-none print:p-0">
      <div className="mb-8 flex items-start justify-between gap-4 border-b-2 border-slate-900 pb-5 print:mb-6">
        <div>
          <p className="mb-2 inline-flex rounded-sm bg-slate-900 px-2 py-1 text-xs font-semibold uppercase text-white">
            {variantLabel}
          </p>
          <h1 className="text-2xl font-semibold leading-tight">{material.title}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {t(`materials.kind.${material.kind}`)} · {today}
          </p>
        </div>
        <PrintButton />
      </div>

      {blocks.length === 0 ? (
        <p className="text-sm text-slate-600">{t("materials.noBlocks")}</p>
      ) : (
        <BlockDocument blocks={blocks} showAnswers={exportVariant.includeAnswerKey} />
      )}

      <footer className="mt-10 border-t pt-3 text-xs text-slate-500 print:mt-8">
        {t("materials.printFooter")}
      </footer>
    </main>
  );
}

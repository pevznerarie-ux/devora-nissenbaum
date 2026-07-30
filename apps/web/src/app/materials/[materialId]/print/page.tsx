import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { PRODUCT_NAME } from "@pedagoos/shared";
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
    <main className="mx-auto max-w-[860px] bg-brand-paper p-6 font-sans text-brand-ink print:max-w-none print:bg-white print:p-0">
      <header className="mb-8 overflow-hidden rounded-xl bg-brand-navy text-white print:mb-6 print:rounded-none">
        <div className="flex items-start justify-between gap-4 p-6">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-terra-fill" />
              {t(`materials.kind.${material.kind}`)}
            </p>
            <h1 className="font-serif text-3xl font-bold leading-tight">
              {material.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/80">
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium">
                {variantLabel}
              </span>
              <span>{today}</span>
            </div>
          </div>
          <PrintButton />
        </div>
        <div className="h-1.5 w-full bg-gradient-to-r from-brand-terra-fill via-brand-gold to-brand-navy-2" />
      </header>

      {blocks.length === 0 ? (
        <p className="text-sm text-brand-ink/60">{t("materials.noBlocks")}</p>
      ) : (
        <BlockDocument blocks={blocks} showAnswers={exportVariant.includeAnswerKey} />
      )}

      <footer className="mt-10 flex items-center justify-between gap-4 border-t border-brand-line pt-3 text-xs text-brand-ink/50 print:mt-8">
        <span className="font-serif text-sm font-bold text-brand-navy">
          {PRODUCT_NAME}
        </span>
        <span>{t("materials.printFooter")}</span>
      </footer>
    </main>
  );
}

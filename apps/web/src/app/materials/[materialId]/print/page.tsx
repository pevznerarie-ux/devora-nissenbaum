import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import {
  STUDENT_VARIANT,
  TEACHER_VARIANT,
  filterBlocksForVariant,
} from "@pedagoos/pedagogy";
import { createClient } from "@/lib/supabase/server";
import { getMaterialDetail } from "@/features/materials/queries";
import { BlockDocument } from "@/features/materials/components/block-document";
import { PrintButton } from "@/features/materials/components/print-button";

/**
 * Page d'impression / export PDF d'un support (ADR-0006), hors chrome du
 * dashboard pour une sortie propre. `variant=student` (sans corrigé) ou
 * `variant=teacher` (avec corrigé et notes). Le prof imprime → PDF.
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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

  return (
    <main className="mx-auto max-w-3xl p-8 print:p-0">
      <div className="mb-6 flex items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-xl font-semibold">{material.title}</h1>
          <p className="text-sm text-muted-foreground">
            {t(`materials.kind.${material.kind}`)} · {variantLabel}
          </p>
        </div>
        <PrintButton />
      </div>

      {blocks.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("materials.noBlocks")}</p>
      ) : (
        <BlockDocument blocks={blocks} showAnswers={exportVariant.includeAnswerKey} />
      )}
    </main>
  );
}

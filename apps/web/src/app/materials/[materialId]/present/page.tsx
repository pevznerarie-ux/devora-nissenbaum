import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { STUDENT_VARIANT, filterBlocksForVariant, type Block } from "@pedagoos/pedagogy";
import { getMaterialDetail } from "@/features/materials/queries";
import {
  PresentDeck,
  type PresentSlide,
} from "@/features/materials/components/present-deck";

type T = Awaited<ReturnType<typeof getTranslations>>;

/**
 * Construit les écrans de projection à partir des blocs (variante élève : aucun
 * corrigé ni note professeur n'est projeté). Un bloc « slide » explicite prime ;
 * sinon on dérive un écran par bloc porteur de sens.
 */
function slidesFromBlocks(blocks: Block[], t: T): PresentSlide[] {
  const explicit = blocks.filter((b) => b.type === "slide");
  const source = explicit.length > 0 ? explicit : blocks;
  const slides: PresentSlide[] = [];

  source.forEach((block, index) => {
    switch (block.type) {
      case "slide":
        slides.push({ id: block.id, title: block.title, bullets: block.bullets });
        break;
      case "objectives":
        slides.push({
          id: block.id,
          title: t("materials.blockType.objectives"),
          bullets: block.items.map((i) => i.label),
        });
        break;
      case "summary":
        slides.push({
          id: block.id,
          title: t("materials.blockType.summary"),
          bullets: block.points,
        });
        break;
      case "vocabulary":
        slides.push({
          id: block.id,
          title: t("materials.blockType.vocabulary"),
          bullets: block.terms.map((term) => `${term.term} — ${term.definition}`),
        });
        break;
      case "explanation":
        slides.push({
          id: block.id,
          title: block.title ?? `${t("materials.blockType.explanation")} ${index + 1}`,
          bullets: [block.body],
        });
        break;
      case "example":
        slides.push({
          id: block.id,
          title: t("materials.blockType.example"),
          bullets: [block.prompt, block.worked],
        });
        break;
      case "discussion_question":
        slides.push({ id: block.id, title: block.question, bullets: [] });
        break;
      case "exercise":
        slides.push({ id: block.id, title: block.title, bullets: [block.statement] });
        break;
      case "assessment_question":
        slides.push({
          id: block.id,
          title: `${index + 1}. ${block.statement}`,
          bullets: [],
        });
        break;
      case "timeline_step":
        slides.push({
          id: block.id,
          title: block.title,
          bullets: block.studentNote ? [block.studentNote] : [],
        });
        break;
      default:
        break; // answer_space, expected_answer, etc. : sans intérêt en projection
    }
  });

  return slides.filter((s) => s.title.length > 0 || s.bullets.length > 0);
}

export default async function MaterialPresentPage({
  params,
}: {
  params: Promise<{ materialId: string }>;
}) {
  const { materialId } = await params;
  const t = await getTranslations();
  const parsed = z.uuid().safeParse(materialId);
  const material = parsed.success ? await getMaterialDetail(parsed.data) : null;

  if (!material) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-brand-navy p-8 text-white">
        <p>{t("materials.notFound")}</p>
      </main>
    );
  }

  const blocks = filterBlocksForVariant(material.blocks, STUDENT_VARIANT);
  const slides = slidesFromBlocks(blocks, t);

  return (
    <PresentDeck
      title={material.title}
      kindLabel={t(`materials.kind.${material.kind}`)}
      slides={slides}
    />
  );
}

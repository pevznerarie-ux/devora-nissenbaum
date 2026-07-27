import { getTranslations } from "next-intl/server";
import { z } from "zod";
import type { Block } from "@pedagoos/pedagogy";
import { getMaterialDetail } from "@/features/materials/queries";
import { PresentButton } from "@/features/materials/components/present-button";

function slidesFromBlocks(blocks: Block[]) {
  const slideBlocks = blocks.filter((block) => block.type === "slide");
  if (slideBlocks.length > 0) {
    return slideBlocks.map((block) => ({
      id: block.id,
      title: block.title,
      bullets: block.bullets,
      notes: block.speakerNotes,
    }));
  }

  return blocks.map((block, index) => {
    switch (block.type) {
      case "objectives":
        return {
          id: block.id,
          title: "Objectifs",
          bullets: block.items.map((item) => item.label),
          notes: undefined,
        };
      case "summary":
        return {
          id: block.id,
          title: "Synthèse",
          bullets: block.points,
          notes: undefined,
        };
      case "exercise":
        return {
          id: block.id,
          title: block.title,
          bullets: [block.statement],
          notes: block.expectedAnswer,
        };
      case "explanation":
        return {
          id: block.id,
          title: block.title ?? `Point ${index + 1}`,
          bullets: [block.body],
          notes: undefined,
        };
      default:
        return {
          id: block.id,
          title: `Diapositive ${index + 1}`,
          bullets: [],
          notes: undefined,
        };
    }
  });
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
      <main className="min-h-dvh bg-slate-950 p-8 text-white">
        <p>{t("materials.notFound")}</p>
      </main>
    );
  }

  const slides = slidesFromBlocks(material.blocks).filter(
    (slide) => slide.title || slide.bullets.length > 0,
  );

  return (
    <main className="min-h-dvh bg-slate-950 text-white">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/15 bg-slate-950/95 px-6 py-3">
        <div>
          <p className="text-xs uppercase text-white/60">{t("materials.classMode")}</p>
          <h1 className="text-base font-semibold">{material.title}</h1>
        </div>
        <PresentButton />
      </header>

      <div className="h-[calc(100dvh-73px)] snap-y snap-mandatory overflow-y-auto">
        {slides.map((slide, index) => (
          <section
            key={slide.id}
            className="flex min-h-[calc(100dvh-73px)] snap-start flex-col justify-center px-8 py-10 md:px-16"
          >
            <p className="mb-5 text-sm text-white/50">
              {index + 1} / {slides.length}
            </p>
            <h2 className="max-w-5xl text-4xl font-semibold leading-tight md:text-6xl">
              {slide.title}
            </h2>
            {slide.bullets.length > 0 && (
              <ul className="mt-10 flex max-w-5xl flex-col gap-5 text-2xl leading-snug text-white/90 md:text-4xl">
                {slide.bullets.map((bullet, bulletIndex) => (
                  <li key={bulletIndex} className="flex gap-4">
                    <span className="mt-3 h-3 w-3 shrink-0 rounded-full bg-cyan-300 md:mt-5" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
            {slide.notes && (
              <p className="mt-10 max-w-4xl border-t border-white/15 pt-4 text-sm text-white/45">
                {slide.notes}
              </p>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}

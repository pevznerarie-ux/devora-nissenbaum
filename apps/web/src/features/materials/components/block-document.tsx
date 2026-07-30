import type { Block, BlockIllustration } from "@pedagoos/pedagogy";
import { getTranslations } from "next-intl/server";

/**
 * Rendu « document » (lecture seule) des blocs pour l'impression / l'export PDF
 * (ADR-0006). `showAnswers` révèle les corrigés et notes professeur (variante
 * fiche professeur) ; à false pour le support élève. Le filtrage des blocs par
 * public/answerKey est déjà fait en amont (filterBlocksForVariant).
 */
export async function BlockDocument({
  blocks,
  showAnswers,
}: {
  blocks: Block[];
  showAnswers: boolean;
}) {
  const t = await getTranslations();

  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block) => (
        <section
          key={block.id}
          className="break-inside-avoid rounded-md border border-slate-200 bg-white p-4 print:rounded-none print:border-slate-300 print:p-3"
        >
          {renderBlock(block, showAnswers, t)}
          {block.illustration && renderIllustration(block.illustration, t)}
        </section>
      ))}
    </div>
  );
}

type T = Awaited<ReturnType<typeof getTranslations>>;

/** Illustration attachée à un bloc, avec crédit (licence/auteur) à l'impression. */
function renderIllustration(illustration: BlockIllustration, t: T) {
  const license = illustration.isPublicDomain
    ? t("visuals.publicDomain")
    : illustration.licenseName;
  const credit = [illustration.author, license, illustration.sourceName]
    .filter((part): part is string => Boolean(part))
    .join(" · ");
  return (
    <figure className="mt-3">
      {illustration.fileUrl.startsWith("http") ? (
        <img
          src={illustration.fileUrl}
          alt={illustration.alt ?? ""}
          className="max-h-72 w-full rounded-md object-contain"
        />
      ) : null}
      {credit.length > 0 && (
        <figcaption className="mt-1 text-[0.7rem] text-slate-500">{credit}</figcaption>
      )}
    </figure>
  );
}

function heading(text: string) {
  return (
    <h3 className="mb-2 text-[0.78rem] font-semibold uppercase text-slate-700">{text}</h3>
  );
}

function answerLine(label: string, value: string) {
  return (
    <p className="mt-2 rounded-sm border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-sm text-emerald-950">
      <span className="font-medium">{label} : </span>
      {value}
    </p>
  );
}

function renderBlock(block: Block, showAnswers: boolean, t: T) {
  switch (block.type) {
    case "objectives":
      return (
        <>
          {heading(t("materials.blockType.objectives"))}
          <ul className="list-disc space-y-1 ps-5 text-sm leading-relaxed">
            {block.items.map((i) => (
              <li key={i.objectiveId}>{i.label}</li>
            ))}
          </ul>
        </>
      );
    case "vocabulary":
      return (
        <>
          {heading(t("materials.blockType.vocabulary"))}
          <dl className="space-y-2 text-sm leading-relaxed">
            {block.terms.map((term, i) => (
              <div key={i}>
                <dt className="font-medium">{term.term}</dt>
                <dd className="ps-4 text-slate-700">{term.definition}</dd>
              </div>
            ))}
          </dl>
        </>
      );
    case "timeline_step":
      return (
        <>
          <h3 className="text-base font-semibold">
            {block.title}{" "}
            <span className="font-normal text-slate-500">
              ({block.durationMinutes} min)
            </span>
          </h3>
          {block.studentNote && <p className="mt-1 text-sm">{block.studentNote}</p>}
          {showAnswers && block.teacherNote && (
            <p className="mt-2 rounded-sm bg-slate-100 px-2 py-1.5 text-sm text-slate-700">
              {block.teacherNote}
            </p>
          )}
        </>
      );
    case "explanation":
      return (
        <>
          {block.title && <h3 className="text-base font-semibold">{block.title}</h3>}
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-800">
            {block.body}
          </p>
        </>
      );
    case "example":
      return (
        <>
          {heading(t("materials.blockType.example"))}
          <p className="text-sm">{block.prompt}</p>
          <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
            {block.worked}
          </p>
        </>
      );
    case "discussion_question":
      return (
        <>
          <p className="text-sm font-medium">{block.question}</p>
          {showAnswers &&
            block.expectedAnswer &&
            answerLine(t("materials.answerKey"), block.expectedAnswer)}
        </>
      );
    case "expected_answer":
      return answerLine(t("materials.answerKey"), block.answer);
    case "misconception":
      return (
        <>
          {heading(t("materials.blockType.misconception"))}
          <p className="text-sm leading-relaxed">{block.description}</p>
          {showAnswers && block.remediationHint && (
            <p className="mt-1 text-sm text-slate-600">{block.remediationHint}</p>
          )}
        </>
      );
    case "differentiation":
      return (
        <>
          {heading(t("materials.blockType.differentiation"))}
          <p className="text-sm leading-relaxed">{block.description}</p>
        </>
      );
    case "summary":
      return (
        <>
          {heading(t("materials.blockType.summary"))}
          <ul className="list-disc space-y-1 ps-5 text-sm leading-relaxed">
            {block.points.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </>
      );
    case "exercise":
      return (
        <>
          <h3 className="text-sm font-semibold">{block.title}</h3>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">
            {block.statement}
          </p>
          {showAnswers &&
            block.expectedAnswer &&
            answerLine(t("materials.answerKey"), block.expectedAnswer)}
        </>
      );
    case "assessment_question":
      return (
        <>
          <h3 className="text-sm font-semibold">
            {block.orderIndex + 1}. {block.statement}{" "}
            <span className="font-normal text-slate-500">({block.points} pts)</span>
          </h3>
          {showAnswers && answerLine(t("materials.answerKey"), block.expectedAnswer)}
          {showAnswers && block.gradingCriteria.length > 0 && (
            <ul className="mt-1 list-disc ps-5 text-xs text-slate-600">
              {block.gradingCriteria.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          )}
        </>
      );
    case "document_ref":
      return (
        <p className="text-sm italic text-slate-600">
          {block.note ?? block.sourceDocumentId}
          {block.locator ? ` — ${block.locator}` : ""}
        </p>
      );
    case "answer_space":
      return (
        <div>
          {block.label && <p className="text-sm">{block.label}</p>}
          <div className="mt-2 flex flex-col gap-4">
            {Array.from({ length: block.lines }, (_, i) => (
              <div key={i} className="h-4 border-b border-dotted border-slate-400" />
            ))}
          </div>
        </div>
      );
    case "slide":
      return (
        <>
          <h3 className="text-base font-semibold">{block.title}</h3>
          <ul className="list-disc space-y-1 ps-5 text-sm leading-relaxed">
            {block.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
          {showAnswers && block.speakerNotes && (
            <p className="mt-1 text-xs text-slate-600">{block.speakerNotes}</p>
          )}
        </>
      );
  }
}

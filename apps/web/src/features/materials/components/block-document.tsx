import type { Block } from "@pedagoos/pedagogy";
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
    <div className="flex flex-col gap-5">
      {blocks.map((block) => (
        <section key={block.id} className="break-inside-avoid">
          {renderBlock(block, showAnswers, t)}
        </section>
      ))}
    </div>
  );
}

type T = Awaited<ReturnType<typeof getTranslations>>;

function heading(text: string) {
  return <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide">{text}</h3>;
}

function answerLine(label: string, value: string) {
  return (
    <p className="mt-1 rounded-sm bg-secondary/60 px-2 py-1 text-sm">
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
          <ul className="list-disc space-y-0.5 ps-5 text-sm">
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
          <dl className="space-y-1 text-sm">
            {block.terms.map((term, i) => (
              <div key={i}>
                <dt className="font-medium">{term.term}</dt>
                <dd className="ps-4">{term.definition}</dd>
              </div>
            ))}
          </dl>
        </>
      );
    case "timeline_step":
      return (
        <>
          <h3 className="text-sm font-semibold">
            {block.title}{" "}
            <span className="font-normal text-muted-foreground">
              ({block.durationMinutes} min)
            </span>
          </h3>
          {block.studentNote && <p className="text-sm">{block.studentNote}</p>}
          {showAnswers && block.teacherNote && (
            <p className="text-sm text-muted-foreground">{block.teacherNote}</p>
          )}
        </>
      );
    case "explanation":
      return (
        <>
          {block.title && <h3 className="text-base font-semibold">{block.title}</h3>}
          <p className="whitespace-pre-line text-sm leading-relaxed">{block.body}</p>
        </>
      );
    case "example":
      return (
        <>
          {heading(t("materials.blockType.example"))}
          <p className="text-sm">{block.prompt}</p>
          <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
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
          <p className="text-sm">{block.description}</p>
          {showAnswers && block.remediationHint && (
            <p className="text-sm text-muted-foreground">{block.remediationHint}</p>
          )}
        </>
      );
    case "differentiation":
      return (
        <>
          {heading(t("materials.blockType.differentiation"))}
          <p className="text-sm">{block.description}</p>
        </>
      );
    case "summary":
      return (
        <>
          {heading(t("materials.blockType.summary"))}
          <ul className="list-disc space-y-0.5 ps-5 text-sm">
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
          <p className="whitespace-pre-line text-sm">{block.statement}</p>
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
            <span className="font-normal text-muted-foreground">
              ({block.points} pts)
            </span>
          </h3>
          {showAnswers && answerLine(t("materials.answerKey"), block.expectedAnswer)}
          {showAnswers && block.gradingCriteria.length > 0 && (
            <ul className="mt-1 list-disc ps-5 text-xs text-muted-foreground">
              {block.gradingCriteria.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          )}
        </>
      );
    case "document_ref":
      return (
        <p className="text-sm italic text-muted-foreground">
          {block.note ?? block.sourceDocumentId}
          {block.locator ? ` — ${block.locator}` : ""}
        </p>
      );
    case "answer_space":
      return (
        <div>
          {block.label && <p className="text-sm">{block.label}</p>}
          <div className="mt-1 flex flex-col gap-3">
            {Array.from({ length: block.lines }, (_, i) => (
              <div key={i} className="border-b border-dotted" />
            ))}
          </div>
        </div>
      );
    case "slide":
      return (
        <>
          <h3 className="text-base font-semibold">{block.title}</h3>
          <ul className="list-disc space-y-0.5 ps-5 text-sm">
            {block.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
          {showAnswers && block.speakerNotes && (
            <p className="mt-1 text-xs text-muted-foreground">{block.speakerNotes}</p>
          )}
        </>
      );
  }
}

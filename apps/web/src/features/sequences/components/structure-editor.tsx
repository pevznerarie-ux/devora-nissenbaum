"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { LessonSequence } from "@pedagoos/pedagogy";
import type { ActionResult } from "@pedagoos/shared";
import { Button, Card, CardContent, Input, Label, Textarea } from "@pedagoos/ui";
import {
  moveLessonAction,
  updateLessonAction,
  updateObjectiveAction,
  validateStructureAction,
} from "../actions";

const BLOOM = [
  "remember",
  "understand",
  "apply",
  "analyze",
  "evaluate",
  "create",
] as const;
const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function ObjectiveEditor({
  sequenceId,
  objective,
}: {
  sequenceId: string;
  objective: LessonSequence["objectives"][number];
}) {
  const t = useTranslations();
  const [result, action, pending] = useActionState(
    async (_prev: ActionResult<{ saved: true }> | null, fd: FormData) =>
      updateObjectiveAction(fd),
    null,
  );

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-6">
        <form action={action} className="flex flex-col gap-3">
          <input type="hidden" name="sequenceId" value={sequenceId} />
          <input type="hidden" name="objectiveId" value={objective.id} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`obj-title-${objective.id}`}>
              {t("sequences.objectiveTitle")}
            </Label>
            <Input
              id={`obj-title-${objective.id}`}
              name="title"
              defaultValue={objective.title}
              required
              maxLength={300}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`obj-desc-${objective.id}`}>
              {t("sequences.objectiveDescription")}
            </Label>
            <Textarea
              id={`obj-desc-${objective.id}`}
              name="description"
              defaultValue={objective.description ?? ""}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`obj-bloom-${objective.id}`}>
              {t("sequences.bloomLevel")}
            </Label>
            <select
              id={`obj-bloom-${objective.id}`}
              name="bloomLevel"
              defaultValue={objective.bloomLevel}
              className={selectClassName}
            >
              {BLOOM.map((level) => (
                <option key={level} value={level}>
                  {t(`sequences.bloom.${level}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" variant="secondary" size="sm" disabled={pending}>
              {t("sequences.save")}
            </Button>
            {result !== null && (
              <span
                className={`text-sm ${result.ok ? "text-muted-foreground" : "text-destructive"}`}
              >
                {result.ok ? "✓" : t("common.error")}
              </span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function LessonEditor({
  sequenceId,
  lesson,
  isFirst,
  isLast,
}: {
  sequenceId: string;
  lesson: LessonSequence["lessons"][number];
  isFirst: boolean;
  isLast: boolean;
}) {
  const t = useTranslations();
  const [result, action, pending] = useActionState(
    async (_prev: ActionResult<{ saved: true }> | null, fd: FormData) =>
      updateLessonAction(fd),
    null,
  );
  const [, moveAction, movePending] = useActionState(
    async (_prev: ActionResult<{ saved: true }> | null, fd: FormData) =>
      moveLessonAction(fd),
    null,
  );

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-6">
        <div className="flex items-center justify-end gap-2">
          <form action={moveAction}>
            <input type="hidden" name="sequenceId" value={sequenceId} />
            <input type="hidden" name="lessonId" value={lesson.id} />
            <input type="hidden" name="direction" value="up" />
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              disabled={isFirst || movePending}
              aria-label={t("sequences.moveUp")}
            >
              ↑
            </Button>
          </form>
          <form action={moveAction}>
            <input type="hidden" name="sequenceId" value={sequenceId} />
            <input type="hidden" name="lessonId" value={lesson.id} />
            <input type="hidden" name="direction" value="down" />
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              disabled={isLast || movePending}
              aria-label={t("sequences.moveDown")}
            >
              ↓
            </Button>
          </form>
        </div>
        <form action={action} className="flex flex-col gap-3">
          <input type="hidden" name="sequenceId" value={sequenceId} />
          <input type="hidden" name="lessonId" value={lesson.id} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`les-title-${lesson.id}`}>{t("sequences.lessonTitle")}</Label>
            <Input
              id={`les-title-${lesson.id}`}
              name="title"
              defaultValue={lesson.title}
              required
              maxLength={300}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`les-sum-${lesson.id}`}>{t("sequences.lessonSummary")}</Label>
            <Textarea
              id={`les-sum-${lesson.id}`}
              name="summary"
              defaultValue={lesson.summary ?? ""}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" variant="secondary" size="sm" disabled={pending}>
              {t("sequences.save")}
            </Button>
            {result !== null && (
              <span
                className={`text-sm ${result.ok ? "text-muted-foreground" : "text-destructive"}`}
              >
                {result.ok ? "✓" : t("common.error")}
              </span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function StructureEditor({
  sequenceId,
  structure,
}: {
  sequenceId: string;
  structure: LessonSequence;
}) {
  const t = useTranslations();
  const [validateResult, validateAction, validating] = useActionState(
    async (_prev: ActionResult<{ validated: true }> | null, fd: FormData) =>
      validateStructureAction(fd),
    null,
  );
  const lessons = [...structure.lessons].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="flex flex-col gap-6">
      <p className="rounded-md border bg-accent/40 p-3 text-sm">
        {t("sequences.aiProposalNotice")}
      </p>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("sequences.objectivesTitle")}</h2>
        {structure.objectives.map((objective) => (
          <ObjectiveEditor
            key={objective.id}
            sequenceId={sequenceId}
            objective={objective}
          />
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("sequences.lessonsTitle")}</h2>
        {lessons.map((lesson, index) => (
          <LessonEditor
            key={lesson.id}
            sequenceId={sequenceId}
            lesson={lesson}
            isFirst={index === 0}
            isLast={index === lessons.length - 1}
          />
        ))}
      </section>

      <form action={validateAction} className="flex items-center gap-3">
        <input type="hidden" name="sequenceId" value={sequenceId} />
        <Button type="submit" disabled={validating}>
          {t("sequences.validate")}
        </Button>
        {validateResult !== null && !validateResult.ok && (
          <p role="alert" className="text-sm text-destructive">
            {t("common.error")}
          </p>
        )}
      </form>
    </div>
  );
}

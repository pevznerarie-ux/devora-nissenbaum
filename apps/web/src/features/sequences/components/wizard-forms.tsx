"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { ActionResult } from "@pedagoos/shared";
import { Button, Input, Label, Textarea } from "@pedagoos/ui";
import {
  generateStructureAction,
  saveIntentionsAction,
  saveSourcesAction,
} from "../actions";
import type { WizardState } from "../schemas";

type SaveResult = ActionResult<{ saved: true }> | null;

function SavedHint({ state }: { state: SaveResult }) {
  const t = useTranslations();
  if (state === null) return null;
  return (
    <p
      role="status"
      className={`text-sm ${state.ok ? "text-muted-foreground" : "text-destructive"}`}
    >
      {state.ok ? t("common.save") + " ✓" : t("common.error")}
    </p>
  );
}

export function IntentionsForm({
  sequenceId,
  state: wizard,
}: {
  sequenceId: string;
  state: WizardState;
}) {
  const t = useTranslations();
  const [result, action, pending] = useActionState(
    async (_prev: SaveResult, fd: FormData) => saveIntentionsAction(fd),
    null,
  );

  return (
    <form action={action} className="flex max-w-xl flex-col gap-4">
      <input type="hidden" name="sequenceId" value={sequenceId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="desiredObjectives">{t("sequences.desiredObjectives")}</Label>
        <Textarea
          id="desiredObjectives"
          name="desiredObjectives"
          defaultValue={wizard.desiredObjectives.join("\n")}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="prerequisites">{t("sequences.prerequisites")}</Label>
        <Textarea
          id="prerequisites"
          name="prerequisites"
          defaultValue={wizard.prerequisites.join("\n")}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="constraints">{t("sequences.constraints")}</Label>
        <Textarea
          id="constraints"
          name="constraints"
          defaultValue={wizard.constraints.join("\n")}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="learningType">{t("sequences.learningType")}</Label>
        <Input
          id="learningType"
          name="learningType"
          defaultValue={wizard.learningType ?? ""}
          maxLength={200}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="differentiation">{t("sequences.differentiation")}</Label>
        <Input
          id="differentiation"
          name="differentiation"
          defaultValue={wizard.differentiation ?? ""}
          maxLength={500}
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" disabled={pending}>
          {t("sequences.saveIntentions")}
        </Button>
        <SavedHint state={result} />
      </div>
    </form>
  );
}

export function SourcesForm({
  sequenceId,
  sources,
  state: wizard,
}: {
  sequenceId: string;
  sources: { id: string; title: string }[];
  state: WizardState;
}) {
  const t = useTranslations();
  const [result, action, pending] = useActionState(
    async (_prev: SaveResult, fd: FormData) => saveSourcesAction(fd),
    null,
  );
  const selected = new Set(wizard.sourceIds);

  return (
    <form action={action} className="flex max-w-xl flex-col gap-4">
      <input type="hidden" name="sequenceId" value={sequenceId} />
      <p className="text-sm text-muted-foreground">{t("sequences.sourcesHelp")}</p>
      {sources.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("sequences.sourcesEmpty")}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {sources.map((source) => (
            <li key={source.id}>
              <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  name="sourceIds"
                  value={source.id}
                  defaultChecked={selected.has(source.id)}
                  className="size-4"
                />
                {source.title}
              </label>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" disabled={pending}>
          {t("sequences.saveSources")}
        </Button>
        <SavedHint state={result} />
      </div>
    </form>
  );
}

export function GenerateButton({
  sequenceId,
  label,
}: {
  sequenceId: string;
  label: string;
}) {
  const t = useTranslations();
  const [result, action, pending] = useActionState(
    async (_prev: ActionResult<{ generated: true }> | null, fd: FormData) =>
      generateStructureAction(fd),
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="sequenceId" value={sequenceId} />
      <Button type="submit" disabled={pending}>
        {pending ? t("common.loading") : label}
      </Button>
      {result !== null && !result.ok && (
        <p role="alert" className="text-sm text-destructive">
          {t("common.error")}
        </p>
      )}
    </form>
  );
}

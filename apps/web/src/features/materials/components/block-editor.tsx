"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { reorderBlocks, type Block } from "@pedagoos/pedagogy";
import { Button, Card, CardContent } from "@pedagoos/ui";
import { applyEditIntentAction, lockBlockAction, saveBlocksAction } from "../actions";
import { blockSummary } from "./block-summary";
import { VisualRecommendation } from "@/features/visuals/components/visual-recommendation";

const QUICK_ACTIONS = [
  "simplify",
  "shorten",
  "expand",
  "rephrase",
  "add_example",
  "raise_difficulty",
  "lower_difficulty",
  "make_more_concrete",
  "add_citation",
] as const;

function audienceBadge(block: Block, t: (k: string) => string): string {
  const audience = t(`materials.audience.${block.audience}`);
  return block.answerKey ? `${audience} · ${t("materials.answerKey")}` : audience;
}

function BlockCard({
  materialId,
  block,
  onReorder,
  onDelete,
  editable,
}: {
  materialId: string;
  block: Block;
  onReorder: (dir: "up" | "down") => void;
  onDelete: () => void;
  editable: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [instruction, setInstruction] = useState("");
  const [error, setError] = useState(false);

  function runIntent(quickAction?: string) {
    setError(false);
    const fd = new FormData();
    fd.set("materialId", materialId);
    fd.set("blockId", block.id);
    if (quickAction) fd.set("quickAction", quickAction);
    if (instruction.trim()) fd.set("instruction", instruction.trim());
    startTransition(async () => {
      const result = await applyEditIntentAction(fd);
      if (result.ok) {
        setInstruction("");
        router.refresh();
      } else {
        setError(true);
      }
    });
  }

  function toggleLock() {
    const fd = new FormData();
    fd.set("materialId", materialId);
    fd.set("blockId", block.id);
    fd.set("locked", block.locked ? "false" : "true");
    startTransition(async () => {
      await lockBlockAction(fd);
      router.refresh();
    });
  }

  return (
    <Card className={block.locked ? "border-accent" : undefined}>
      <CardContent className="flex flex-col gap-3 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase text-muted-foreground">
              {t(`materials.blockType.${block.type}`)} · {audienceBadge(block, t)}
            </span>
            <p className="text-sm">{blockSummary(block)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={toggleLock}
              aria-pressed={block.locked}
              aria-label={block.locked ? t("materials.unlock") : t("materials.lock")}
            >
              {block.locked ? "🔒" : "🔓"}
            </Button>
            {editable && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => onReorder("up")}
                  aria-label={t("materials.moveUp")}
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => onReorder("down")}
                  aria-label={t("materials.moveDown")}
                >
                  ↓
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending || block.locked}
                  onClick={onDelete}
                  aria-label={t("materials.deleteBlock")}
                >
                  ✕
                </Button>
              </>
            )}
          </div>
        </div>

        {!block.locked && (
          <div className="flex flex-col gap-2 rounded-md border bg-secondary/40 p-3">
            <span className="text-xs font-medium">{t("materials.editByIntent")}</span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map((qa) => (
                <Button
                  key={qa}
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={pending}
                  onClick={() => runIntent(qa)}
                >
                  {t(`materials.quickAction.${qa}`)}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder={t("materials.instructionPlaceholder")}
                maxLength={1000}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
              <Button
                type="button"
                size="sm"
                disabled={pending || instruction.trim().length === 0}
                onClick={() => runIntent()}
              >
                {t("materials.apply")}
              </Button>
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {t("common.error")}
              </p>
            )}
          </div>
        )}

        <VisualRecommendation
          materialId={materialId}
          blockId={block.id}
          illustration={block.illustration ?? null}
        />
      </CardContent>
    </Card>
  );
}

export function BlockEditor({
  materialId,
  sequenceId,
  initialBlocks,
  editable,
}: {
  materialId: string;
  sequenceId: string;
  initialBlocks: Block[];
  editable: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [pending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);

  // Resynchronise depuis le serveur après une retouche IA (revalidation).
  useEffect(() => {
    setBlocks(initialBlocks);
    setDirty(false);
  }, [initialBlocks]);

  function persist(next: Block[]) {
    setBlocks(next);
    setDirty(true);
  }

  function move(blockId: string, dir: "up" | "down") {
    const index = blocks.findIndex((b) => b.id === blockId);
    if (index === -1) return;
    persist(reorderBlocks(blocks, blockId, dir === "up" ? index - 1 : index + 1));
  }

  function remove(blockId: string) {
    persist(blocks.filter((b) => b.id !== blockId));
  }

  function save() {
    const fd = new FormData();
    fd.set("materialId", materialId);
    fd.set("blocks", JSON.stringify(blocks));
    startTransition(async () => {
      await saveBlocksAction(fd);
      setDirty(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {editable && dirty && (
        <div className="flex items-center gap-3 rounded-md border bg-accent/40 p-3">
          <span className="text-sm">{t("materials.unsavedChanges")}</span>
          <Button type="button" size="sm" disabled={pending} onClick={save}>
            {t("materials.saveStructure")}
          </Button>
        </div>
      )}
      {blocks.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("materials.noBlocks")}</p>
      ) : (
        blocks.map((block) => (
          <BlockCard
            key={block.id}
            materialId={materialId}
            block={block}
            editable={editable}
            onReorder={(dir) => move(block.id, dir)}
            onDelete={() => remove(block.id)}
          />
        ))
      )}
      <p className="text-xs text-muted-foreground">
        {t("materials.sequenceHint")} · {sequenceId.slice(0, 8)}
      </p>
    </div>
  );
}

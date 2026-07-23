"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { VisualRequest } from "@pedagoos/pedagogy";
import { Button } from "@pedagoos/ui";
import { recommendVisualForBlockAction } from "../actions";

/**
 * Recommandation visuelle par bloc (Visual Director — ADR-0016). Affiche le type
 * recommandé et sa justification ; le professeur garde la main (aucune image
 * n'est ajoutée automatiquement). Les actions de production arrivent en V3.
 */
export function VisualRecommendation({
  materialId,
  blockId,
}: {
  materialId: string;
  blockId: string;
}) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const [request, setRequest] = useState<VisualRequest | null>(null);
  const [error, setError] = useState(false);

  function analyze() {
    setError(false);
    const fd = new FormData();
    fd.set("materialId", materialId);
    fd.set("blockId", blockId);
    startTransition(async () => {
      const result = await recommendVisualForBlockAction(fd);
      if (result.ok) setRequest(result.data);
      else setError(true);
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-dashed p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium">{t("visuals.title")}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={analyze}
        >
          {t("visuals.analyze")}
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {t("common.error")}
        </p>
      )}

      {request && (
        <div className="flex flex-col gap-1 text-sm">
          {request.visualNeeded ? (
            <>
              <p>
                <span className="font-medium">
                  {t(`visuals.type.${request.recommendedType}`)}
                </span>{" "}
                — {t(`visuals.purpose.${request.pedagogicalPurpose}`)}
              </p>
              <p className="text-muted-foreground">
                {t("visuals.source")} :{" "}
                {t(`visuals.preferredSource.${request.preferredSource}`)}
              </p>
              {request.requiresHumanReview && (
                <p className="text-amber-700 dark:text-amber-500">
                  ⚠ {t("visuals.humanReview")}
                </p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">{t("visuals.none")}</p>
          )}
        </div>
      )}
    </div>
  );
}

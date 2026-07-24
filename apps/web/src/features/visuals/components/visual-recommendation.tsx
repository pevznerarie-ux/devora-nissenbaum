"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { DiagramSpecification, VisualRequest } from "@pedagoos/pedagogy";
import { Button, DiagramView } from "@pedagoos/ui";
import { previewDiagramAction, recommendVisualForBlockAction } from "../actions";

const DIAGRAM_TYPES = new Set(["vector_diagram", "timeline", "chart", "map"]);

/**
 * Recommandation visuelle par bloc (Visual Director — ADR-0016). Affiche le type
 * recommandé et sa justification ; le professeur garde la main (aucune image
 * n'est ajoutée automatiquement). Pour un schéma, un aperçu SVG déterministe
 * (Diagram Engine) est proposé.
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
  const [diagram, setDiagram] = useState<DiagramSpecification | null>(null);
  const [error, setError] = useState(false);

  function analyze() {
    setError(false);
    setDiagram(null);
    const fd = new FormData();
    fd.set("materialId", materialId);
    fd.set("blockId", blockId);
    startTransition(async () => {
      const result = await recommendVisualForBlockAction(fd);
      if (result.ok) setRequest(result.data);
      else setError(true);
    });
  }

  function preview(recommendedType: string) {
    setError(false);
    const fd = new FormData();
    fd.set("materialId", materialId);
    fd.set("blockId", blockId);
    fd.set("recommendedType", recommendedType);
    startTransition(async () => {
      const result = await previewDiagramAction(fd);
      if (result.ok) setDiagram(result.data);
      else setError(true);
    });
  }

  const canPreview = request?.visualNeeded && DIAGRAM_TYPES.has(request.recommendedType);

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
        <div className="flex flex-col gap-2 text-sm">
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
              {canPreview && (
                <div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={pending}
                    onClick={() => preview(request.recommendedType)}
                  >
                    {t("visuals.preview")}
                  </Button>
                </div>
              )}
              {diagram && (
                <div className="mt-1 rounded-md border bg-background p-3">
                  <DiagramView spec={diagram} />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {diagram.accessibilityDescription}
                  </p>
                </div>
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

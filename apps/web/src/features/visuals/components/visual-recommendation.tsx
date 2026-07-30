"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type {
  BlockIllustration,
  DiagramSpecification,
  VisualRequest,
} from "@pedagoos/pedagogy";
import type { VisualSearchResult } from "@pedagoos/ai";
import { Button, DiagramView } from "@pedagoos/ui";
import { attachIllustrationAction } from "@/features/materials/actions";
import {
  previewDiagramAction,
  recommendVisualForBlockAction,
  searchBlockImagesAction,
} from "../actions";

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
  illustration,
}: {
  materialId: string;
  blockId: string;
  illustration?: BlockIllustration | null;
}) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const [request, setRequest] = useState<VisualRequest | null>(null);
  const [diagram, setDiagram] = useState<DiagramSpecification | null>(null);
  const [images, setImages] = useState<VisualSearchResult[] | null>(null);
  const [chosen, setChosen] = useState<VisualSearchResult | null>(null);
  const [attached, setAttached] = useState(Boolean(illustration));
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

  function searchImages() {
    setError(false);
    setImages(null);
    setChosen(null);
    const fd = new FormData();
    fd.set("materialId", materialId);
    fd.set("blockId", blockId);
    startTransition(async () => {
      const result = await searchBlockImagesAction(fd);
      if (result.ok) setImages(result.data);
      else setError(true);
    });
  }

  function choose(img: VisualSearchResult) {
    setError(false);
    const illustrationPayload = {
      kind: "search",
      previewUrl: img.previewUrl,
      fileUrl: img.fileUrl,
      width: img.width,
      height: img.height,
      author: img.author,
      sourceName: img.sourceName,
      sourceUrl: img.sourceUrl,
      licenseName: img.licenseName,
      licenseUrl: img.licenseUrl,
      isPublicDomain: img.isPublicDomain,
      attributionRequired: img.attributionRequired,
      providerId: img.providerId,
    };
    const fd = new FormData();
    fd.set("materialId", materialId);
    fd.set("blockId", blockId);
    fd.set("illustration", JSON.stringify(illustrationPayload));
    startTransition(async () => {
      const result = await attachIllustrationAction(fd);
      if (result.ok) {
        setChosen(img);
        setAttached(true);
      } else {
        setError(true);
      }
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

              <div className="mt-1 flex flex-col gap-2">
                {attached && (
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-500">
                    ✓ {t("visuals.attached")}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={pending}
                    onClick={searchImages}
                  >
                    {t("visuals.searchImages")}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {t("visuals.imagesHint")}
                  </span>
                </div>

                {images && images.length === 0 && (
                  <p className="text-xs text-muted-foreground">{t("visuals.noImages")}</p>
                )}

                {images && images.length > 0 && (
                  <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {images.map((img) => (
                      <li
                        key={img.providerId}
                        className="flex flex-col overflow-hidden rounded-md border"
                      >
                        {img.previewUrl.startsWith("http") ? (
                          // Images externes dynamiques (Commons) : next/image
                          // n'est pas adapté (domaines variables), <img> assumé.
                          <img
                            src={img.previewUrl}
                            alt=""
                            loading="lazy"
                            className="h-24 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-24 w-full items-center justify-center bg-muted px-2 text-center text-[10px] text-muted-foreground">
                            {t("visuals.mockNotice")}
                          </div>
                        )}
                        <div className="flex flex-col gap-1 p-2">
                          <span className="truncate text-[11px] text-muted-foreground">
                            {img.isPublicDomain
                              ? t("visuals.publicDomain")
                              : (img.licenseName ?? "")}
                            {img.author ? ` · ${img.author}` : ""}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={pending}
                            onClick={() => choose(img)}
                          >
                            {t("visuals.choose")}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {chosen && (
                  <div className="rounded-md border bg-background p-2 text-xs">
                    <p className="font-medium">{t("visuals.chosen")}</p>
                    <p className="text-muted-foreground">
                      {chosen.isPublicDomain
                        ? t("visuals.publicDomain")
                        : (chosen.licenseName ?? "")}
                      {chosen.author ? ` · ${chosen.author}` : ""}
                      {chosen.sourceUrl ? (
                        <>
                          {" · "}
                          <a
                            href={chosen.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            {t("visuals.source")}
                          </a>
                        </>
                      ) : null}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">{t("visuals.none")}</p>
          )}
        </div>
      )}
    </div>
  );
}

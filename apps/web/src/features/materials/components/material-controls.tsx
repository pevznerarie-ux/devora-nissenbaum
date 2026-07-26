"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@pedagoos/ui";
import { publishMaterialAction, restoreVersionAction } from "../actions";
import type { MaterialVersionItem } from "../queries";

export function MaterialControls({
  materialId,
  status,
  versions,
}: {
  materialId: string;
  status: string;
  versions: MaterialVersionItem[];
}) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function publish() {
    const fd = new FormData();
    fd.set("materialId", materialId);
    startTransition(async () => {
      await publishMaterialAction(fd);
      router.refresh();
    });
  }

  function restore(versionNumber: number) {
    const fd = new FormData();
    fd.set("materialId", materialId);
    fd.set("versionNumber", String(versionNumber));
    startTransition(async () => {
      await restoreVersionAction(fd);
      router.refresh();
    });
  }

  const linkClass =
    "inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm hover:bg-secondary";

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("materials.exportTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <a
            className={linkClass}
            href={`/materials/${materialId}/print?variant=student`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("materials.exportStudent")}
          </a>
          <a
            className={linkClass}
            href={`/materials/${materialId}/print?variant=teacher`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("materials.exportTeacher")}
          </a>
          <p className="text-xs text-muted-foreground">{t("materials.exportHint")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("materials.publishTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            {t(`materials.status.${status}`)}
          </p>
          <Button type="button" size="sm" disabled={pending} onClick={publish}>
            {t("materials.publish")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("materials.historyTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("materials.noVersions")}</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm">
              {versions.map((v) => (
                <li
                  key={v.version_number}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <span>
                    v{v.version_number}
                    {v.label ? ` · ${v.label}` : ""}
                    <span className="text-muted-foreground">
                      {" "}
                      · {t(`materials.status.${v.status}`)}
                    </span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => restore(v.version_number)}
                  >
                    {t("materials.restore")}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

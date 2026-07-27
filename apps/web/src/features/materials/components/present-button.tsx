"use client";

import { useTranslations } from "next-intl";
import { Button } from "@pedagoos/ui";

export function PresentButton() {
  const t = useTranslations();

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={() => document.documentElement.requestFullscreen?.()}
    >
      {t("materials.fullscreen")}
    </Button>
  );
}

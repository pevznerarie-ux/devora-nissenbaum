"use client";

import { useTranslations } from "next-intl";
import { Button } from "@pedagoos/ui";

/** Déclenche l'impression navigateur (→ PDF). Masqué à l'impression. */
export function PrintButton() {
  const t = useTranslations();
  return (
    <Button
      type="button"
      size="sm"
      onClick={() => window.print()}
      className="print:hidden"
    >
      {t("materials.print")}
    </Button>
  );
}

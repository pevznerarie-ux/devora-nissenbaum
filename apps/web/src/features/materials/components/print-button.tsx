"use client";

import { useTranslations } from "next-intl";
import { Button } from "@pedagoos/ui";

/** Declenche l'impression navigateur, puis le prof peut enregistrer en PDF. */
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

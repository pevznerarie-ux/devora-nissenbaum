import { getTranslations } from "next-intl/server";

/**
 * Page temporaire des sections non encore développées : chaque section est
 * remplacée par sa vraie implémentation dans les phases 4 à 9 de la roadmap.
 */
export async function PlaceholderPage({ titleKey }: { titleKey: string }) {
  const t = await getTranslations();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t(titleKey)}</h1>
      <p className="text-sm text-muted-foreground">{t("dashboard.placeholder")}</p>
    </div>
  );
}

/**
 * i18n (ADR-0008) : fr par défaut, en/he prévus. Deux notions distinctes :
 * la locale de l'UI (préférence utilisateur) et la langue d'un contenu
 * pédagogique (champ `language` des entités), qui pilote son `dir`.
 */
export const LOCALES = ["fr", "en", "he"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";

export const RTL_LOCALES: readonly Locale[] = ["he"];

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function textDirection(locale: string): "ltr" | "rtl" {
  return isLocale(locale) && RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
}

import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, type Locale } from "@pedagoos/shared";

/** Imports statiques : résolubles au build, une entrée par locale supportée. */
const MESSAGE_LOADERS: Record<
  Locale,
  () => Promise<{ default: Record<string, unknown> }>
> = {
  fr: () => import("@pedagoos/shared/i18n/fr.json"),
  en: () => import("@pedagoos/shared/i18n/en.json"),
  he: () => import("@pedagoos/shared/i18n/he.json"),
};

/**
 * Locale de l'UI : fr par défaut (ADR-0008). La préférence utilisateur
 * (profiles.preferred_locale) sera branchée avec les paramètres de profil.
 */
export default getRequestConfig(async () => {
  const locale = DEFAULT_LOCALE;
  const messages = (await MESSAGE_LOADERS[locale]()).default;
  return { locale, messages };
});

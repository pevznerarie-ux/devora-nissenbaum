import { MockVisualSearchProvider, type VisualSearchProvider } from "./search";
import { WikimediaSearchProvider, type WikimediaSearchOptions } from "./wikimedia";

export interface VisualSearchProviderOptions extends WikimediaSearchOptions {
  /**
   * `true` → recherche réelle (Wikimedia Commons) ; `false`/absent → mock
   * déterministe (CI, dev hors ligne). L'appelant décide via le feature flag
   * `visual_semantic_search` — la couche `ai` reste sans accès à l'env.
   */
  real?: boolean;
}

/** Sélectionne le fournisseur de recherche visuelle sans lier la logique métier. */
export function createVisualSearchProvider(
  options: VisualSearchProviderOptions = {},
): VisualSearchProvider {
  const { real, ...wikimedia } = options;
  return real ? new WikimediaSearchProvider(wikimedia) : new MockVisualSearchProvider();
}

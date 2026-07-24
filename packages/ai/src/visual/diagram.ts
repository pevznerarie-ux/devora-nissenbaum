import { z } from "zod";
import {
  ContentLanguageSchema,
  DiagramSpecificationSchema,
  DiagramTypeSchema,
  type DiagramSpecification,
} from "@pedagoos/pedagogy";
import type { AIProvider } from "../provider";
import { chooseTier, type RoutingSignals } from "../router";
import { generateWithEscalation, type EscalationOutcome } from "../engine";
import { CAPABILITY_BASELINE } from "../capabilities";
import * as diagramPromptV1 from "../prompts/diagram/v1";

/**
 * Entrée de conception d'un schéma (ADR-0016). L'IA produit des DONNÉES JSON
 * (DiagramSpecification) ; le rendu SVG est déterministe (packages/ui). On ne
 * demande jamais une image bitmap contenant du texte.
 */
export const DiagramDesignInputSchema = z.object({
  type: DiagramTypeSchema,
  title: z.string().min(1),
  concept: z.string().min(1),
  language: ContentLanguageSchema.default("fr"),
  /** Étiquettes des éléments (étapes, catégories…). */
  items: z.array(z.string().min(1)).default([]),
  /** Valeurs numériques alignées sur `items` (graphiques). */
  values: z.array(z.number()).default([]),
});
export type DiagramDesignInput = z.infer<typeof DiagramDesignInputSchema>;

/**
 * Capacité « concevoir un schéma » (Diagram Engine, ADR-0016). Produit une
 * DiagramSpecification validée. Câblée prompt versionné → routeur → escalade ;
 * le MockAIProvider fabrique une spec plausible et déterministe hors ligne.
 */
export async function designDiagram(
  provider: AIProvider,
  input: DiagramDesignInput,
  signals: RoutingSignals = {},
): Promise<EscalationOutcome<DiagramSpecification>> {
  const parsed = DiagramDesignInputSchema.parse(input);
  const tier = chooseTier(CAPABILITY_BASELINE.DesignDiagram, signals);

  return generateWithEscalation<DiagramSpecification>(
    provider,
    {
      schema: DiagramSpecificationSchema,
      promptName: diagramPromptV1.PROMPT_NAME,
      promptVersion: diagramPromptV1.PROMPT_VERSION,
      system: diagramPromptV1.buildSystemPrompt(),
      user: diagramPromptV1.buildUserPrompt(parsed),
      modelTier: tier,
      context: parsed,
    },
    { startTier: tier },
  );
}

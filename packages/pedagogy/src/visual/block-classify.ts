import type { Block } from "../blocks";
import type { PedagogicalPurpose } from "./enums";
import type { ContentKind } from "./rules";

/**
 * Classification PURE d'un bloc pédagogique en signaux visuels (ADR-0016). Pré-
 * remplit l'entrée du Visual Director : concept, nature du contenu, fonction, et
 * si un visuel a une réelle valeur. Beaucoup de blocs n'ont besoin d'aucun
 * visuel — c'est volontaire (pas d'image décorative).
 */
export interface BlockVisualSignals {
  concept: string;
  contentKind: ContentKind;
  pedagogicalPurpose: PedagogicalPurpose;
  hasPedagogicalValue: boolean;
}

/** Concept court dérivé du contenu d'un bloc (sujet à illustrer). */
function conceptOf(block: Block): string {
  switch (block.type) {
    case "explanation":
      return block.title ?? block.body.slice(0, 120);
    case "example":
      return block.prompt;
    case "timeline_step":
      return block.title;
    case "slide":
      return block.title;
    case "exercise":
      return block.title;
    case "document_ref":
      return block.note ?? "document source";
    case "summary":
      return block.points[0] ?? "synthèse";
    default:
      return block.type;
  }
}

const CLASSIFY: Partial<
  Record<
    Block["type"],
    { kind: ContentKind; purpose: PedagogicalPurpose; value: boolean }
  >
> = {
  timeline_step: { kind: "chronology", purpose: "memorize", value: true },
  explanation: { kind: "other", purpose: "explain", value: true },
  example: { kind: "other", purpose: "illustrate", value: true },
  slide: { kind: "other", purpose: "engage", value: true },
  document_ref: { kind: "historical_artwork", purpose: "document", value: true },
};

/**
 * Traduit un bloc en signaux pour le Visual Director. Par défaut, un bloc n'a
 * pas besoin de visuel (`hasPedagogicalValue: false`) : seuls les types où un
 * visuel aide réellement sont marqués utiles.
 */
export function classifyBlockForVisual(block: Block): BlockVisualSignals {
  const mapped = CLASSIFY[block.type];
  return {
    concept: conceptOf(block),
    contentKind: mapped?.kind ?? "other",
    pedagogicalPurpose: mapped?.purpose ?? "illustrate",
    hasPedagogicalValue: mapped?.value ?? false,
  };
}

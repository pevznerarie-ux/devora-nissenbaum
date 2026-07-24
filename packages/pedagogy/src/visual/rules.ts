import { z } from "zod";
import type { RecommendedVisualType } from "./enums";

/**
 * Règles de décision DÉTERMINISTES (ADR-0016) — appliquées AVANT tout appel IA
 * quand le cas est clair. Le Visual Director (capacité IA) ne tranche que les
 * cas ambigus (`deferToDirector`). Pur, testable, sans I/O.
 */

/** Classification du concept à illustrer (issue de l'analyse de bloc). */
export const ContentKindSchema = z.enum([
  "quantitative_data",
  "chronology",
  "process",
  "historical_person",
  "contemporary_place",
  "animal_or_plant",
  "fictional_scene",
  "pedagogical_map",
  "historical_artwork",
  "other",
]);
export type ContentKind = z.infer<typeof ContentKindSchema>;

export interface VisualDecisionSignals {
  contentKind: ContentKind;
  /** Un visuel apporte-t-il une réelle valeur pédagogique ici ? */
  hasPedagogicalValue: boolean;
  /** Un asset déjà validé dans la médiathèque correspond-il au besoin ? */
  hasValidatedLibraryAsset?: boolean;
  /** Sujet sensible (voir SENSITIVE_SUBJECTS) → validation humaine. */
  isSensitive?: boolean;
  /** Visuel destiné à un contrôle noté → validation humaine. */
  usedInGradedAssessment?: boolean;
}

export interface VisualDecision {
  /** Type recommandé, ou null si le cas doit être tranché par le Director. */
  recommendedType: RecommendedVisualType | null;
  deferToDirector: boolean;
  requiresHumanReview: boolean;
  reason: string;
}

const KIND_TO_TYPE: Record<ContentKind, RecommendedVisualType | null> = {
  quantitative_data: "chart", // règle 1
  chronology: "timeline", // règle 2
  process: "vector_diagram", // règle 3
  historical_person: "historical_source", // règle 4
  contemporary_place: "real_photo", // règle 5
  animal_or_plant: "real_photo", // règle 6
  fictional_scene: "ai_illustration", // règle 7
  pedagogical_map: "map", // règle 8
  historical_artwork: "historical_source", // règle 9
  other: null, // ambigu → Visual Director
};

/**
 * Décision déterministe pour un bloc. Ordre : valeur pédagogique (règle 12) →
 * médiathèque existante (règle 10) → type par nature du concept (règles 1-9) ;
 * la validation humaine (règle 11 + contrôle noté) est un drapeau indépendant.
 */
export function chooseRecommendedType(signals: VisualDecisionSignals): VisualDecision {
  const requiresHumanReview =
    Boolean(signals.isSensitive) || Boolean(signals.usedInGradedAssessment);

  if (!signals.hasPedagogicalValue) {
    return {
      recommendedType: "none",
      deferToDirector: false,
      requiresHumanReview,
      reason: "Aucune valeur pédagogique : pas de visuel (règle 12).",
    };
  }

  if (signals.hasValidatedLibraryAsset) {
    return {
      recommendedType: "library_asset",
      deferToDirector: false,
      requiresHumanReview,
      reason: "Un visuel validé existe : le proposer avant toute génération (règle 10).",
    };
  }

  const mapped = KIND_TO_TYPE[signals.contentKind];
  if (mapped === null) {
    return {
      recommendedType: null,
      deferToDirector: true,
      requiresHumanReview,
      reason: "Cas ambigu : à trancher par le Visual Director.",
    };
  }

  return {
    recommendedType: mapped,
    deferToDirector: false,
    requiresHumanReview,
    reason: `Type déterminé par la nature du concept (${signals.contentKind}).`,
  };
}

/**
 * Sujets imposant TOUJOURS une validation humaine (ADR-0016). Détection par
 * mots-clés (indicative, non exhaustive) : en cas de doute, on signale.
 */
export const SENSITIVE_SUBJECTS: { code: string; keywords: string[] }[] = [
  {
    code: "religion",
    keywords: [
      "religion",
      "religie",
      "prière",
      "église",
      "mosquée",
      "synagogue",
      "temple",
    ],
  },
  {
    code: "shoah",
    keywords: ["shoah", "holocauste", "génocide", "déportation", "camp de concentration"],
  },
  { code: "violence", keywords: ["violence", "violent"] },
  { code: "war", keywords: ["guerre", "bataille", "arme", "conflit armé"] },
  { code: "human_body", keywords: ["corps humain", "nudité", "anatomie humaine"] },
  { code: "health", keywords: ["santé", "maladie", "médical"] },
  { code: "sexuality", keywords: ["sexualité", "sexuel", "reproduction humaine"] },
  { code: "death", keywords: ["mort", "décès", "funéraire"] },
  { code: "real_people", keywords: ["personne réelle", "personnalité", "célébrité"] },
  { code: "politics", keywords: ["politique", "élection", "parti", "gouvernement"] },
  {
    code: "historical_event",
    keywords: ["événement historique", "attentat", "massacre"],
  },
  {
    code: "cultures",
    keywords: ["culture", "population", "peuple", "ethnie", "minorité"],
  },
  { code: "minors", keywords: ["mineur", "enfant réel", "élève réel"] },
];

/**
 * Un concept relève-t-il d'un sujet sensible ? Comparaison sans casse. Utilisé
 * pour préremplir `isSensitive` et forcer la validation humaine.
 */
export function isSensitiveSubject(concept: string): boolean {
  const haystack = concept.toLowerCase();
  return SENSITIVE_SUBJECTS.some((s) => s.keywords.some((k) => haystack.includes(k)));
}

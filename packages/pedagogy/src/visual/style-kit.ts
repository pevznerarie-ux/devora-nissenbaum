import { z } from "zod";
import { uuid } from "../core";

/**
 * VisualStyleKit (ADR-0016) — charte visuelle par établissement, matière ou
 * tranche d'âge. Évite l'esthétique générique d'IA (3D plastique, yeux trop
 * grands, faux texte, fonds surchargés, style publicitaire). Un style jamais
 * excessivement enfantin.
 */
export const RealismLevelSchema = z.enum([
  "diagrammatic",
  "editorial",
  "semi_realistic",
  "photorealistic",
]);
export type RealismLevel = z.infer<typeof RealismLevelSchema>;

export const VisualStyleKitSchema = z.object({
  id: uuid,
  organizationId: uuid.optional(),
  name: z.string().min(1),

  targetAgeMin: z.number().int().min(3).max(20).optional(),
  targetAgeMax: z.number().int().min(3).max(20).optional(),
  schoolLevels: z.array(z.string().min(1)).default([]),
  subjects: z.array(z.string().min(1)).default([]),

  editorialStyle: z.string().min(1),
  visualMood: z.string().min(1),
  lineStyle: z.string().min(1),
  backgroundStyle: z.string().min(1),
  characterStyle: z.string().min(1),
  realismLevel: RealismLevelSchema,

  allowedColors: z.array(z.string().min(1)).default([]),
  preferredColors: z.array(z.string().min(1)).default([]),
  prohibitedColors: z.array(z.string().min(1)).default([]),

  allowedVisualTypes: z.array(z.string().min(1)).default([]),
  prohibitedVisualTypes: z.array(z.string().min(1)).default([]),

  promptPrefix: z.string().default(""),
  promptSuffix: z.string().default(""),
  negativeInstructions: z.array(z.string().min(1)).default([]),

  referenceAssetIds: z.array(uuid).default([]),
  isDefault: z.boolean().default(false),
});
export type VisualStyleKit = z.infer<typeof VisualStyleKitSchema>;

/** Interdits communs à toutes les chartes (anti « esthétique IA générique »). */
const COMMON_NEGATIVES = [
  "generic AI look",
  "plastic 3D render",
  "deformed characters",
  "oversized eyes",
  "fake typography",
  "text inside image",
  "cluttered background",
  "excessive artificial lighting",
  "advertising style",
];

/**
 * Chartes par défaut (sans organisation) pour les quatre tranches scolaires.
 * Servent de repli quand aucun kit n'est défini. Style sobre, éditorial, jamais
 * infantilisant.
 */
export const DEFAULT_STYLE_KITS: VisualStyleKit[] = [
  {
    id: "00000000-0000-4000-9000-000000000001",
    name: "Primaire 6–8 ans",
    targetAgeMin: 6,
    targetAgeMax: 8,
    schoolLevels: ["cp", "ce1"],
    subjects: [],
    editorialStyle: "illustration éditoriale douce, formes claires",
    visualMood: "rassurant et lisible",
    lineStyle: "contours nets et réguliers",
    backgroundStyle: "fonds épurés, peu d'éléments",
    characterStyle: "personnages simples aux proportions naturelles",
    realismLevel: "editorial",
    allowedColors: [],
    preferredColors: [],
    prohibitedColors: [],
    allowedVisualTypes: [],
    prohibitedVisualTypes: [],
    promptPrefix: "Clear educational editorial illustration for young children,",
    promptSuffix: "calm palette, high readability, no clutter.",
    negativeInstructions: [...COMMON_NEGATIVES, "babyish cartoon"],
    referenceAssetIds: [],
    isDefault: true,
  },
  {
    id: "00000000-0000-4000-9000-000000000002",
    name: "Primaire 9–11 ans",
    targetAgeMin: 9,
    targetAgeMax: 11,
    schoolLevels: ["ce2", "cm1", "cm2"],
    subjects: [],
    editorialStyle: "illustration éditoriale précise",
    visualMood: "curieux et clair",
    lineStyle: "traits nets, détails maîtrisés",
    backgroundStyle: "contextes simples et pertinents",
    characterStyle: "personnages réalistes non caricaturaux",
    realismLevel: "editorial",
    allowedColors: [],
    preferredColors: [],
    prohibitedColors: [],
    allowedVisualTypes: [],
    prohibitedVisualTypes: [],
    promptPrefix: "Precise educational editorial illustration,",
    promptSuffix: "clear composition, age-appropriate detail.",
    negativeInstructions: [...COMMON_NEGATIVES],
    referenceAssetIds: [],
    isDefault: true,
  },
  {
    id: "00000000-0000-4000-9000-000000000003",
    name: "Collège 11–14 ans",
    targetAgeMin: 11,
    targetAgeMax: 14,
    schoolLevels: ["sixieme", "cinquieme", "quatrieme", "troisieme"],
    subjects: [],
    editorialStyle: "illustration éditoriale semi-réaliste",
    visualMood: "sérieux et engageant",
    lineStyle: "rendu soigné, hiérarchie visuelle claire",
    backgroundStyle: "contextes crédibles et informatifs",
    characterStyle: "personnages crédibles, proportions justes",
    realismLevel: "semi_realistic",
    allowedColors: [],
    preferredColors: [],
    prohibitedColors: [],
    allowedVisualTypes: [],
    prohibitedVisualTypes: [],
    promptPrefix: "Semi-realistic educational illustration for secondary students,",
    promptSuffix: "credible detail, clear visual hierarchy.",
    negativeInstructions: [...COMMON_NEGATIVES],
    referenceAssetIds: [],
    isDefault: true,
  },
  {
    id: "00000000-0000-4000-9000-000000000004",
    name: "Lycée 15–18 ans",
    targetAgeMin: 15,
    targetAgeMax: 18,
    schoolLevels: ["seconde", "premiere", "terminale"],
    subjects: [],
    editorialStyle: "illustration éditoriale sobre, proche du manuel",
    visualMood: "rigoureux et net",
    lineStyle: "précision documentaire",
    backgroundStyle: "contextes exacts, sans surcharge",
    characterStyle: "représentations réalistes et respectueuses",
    realismLevel: "semi_realistic",
    allowedColors: [],
    preferredColors: [],
    prohibitedColors: [],
    allowedVisualTypes: [],
    prohibitedVisualTypes: [],
    promptPrefix: "Sober textbook-grade educational illustration,",
    promptSuffix: "documentary accuracy, restrained palette.",
    negativeInstructions: [...COMMON_NEGATIVES],
    referenceAssetIds: [],
    isDefault: true,
  },
];

/** Sélectionne la charte par défaut correspondant à un âge cible. */
export function defaultStyleKitForAge(age: number): VisualStyleKit {
  const found = DEFAULT_STYLE_KITS.find(
    (kit) =>
      kit.targetAgeMin !== undefined &&
      kit.targetAgeMax !== undefined &&
      age >= kit.targetAgeMin &&
      age <= kit.targetAgeMax,
  );
  // Repli : collège (tranche médiane) si l'âge sort des bornes prévues.
  return found ?? DEFAULT_STYLE_KITS[2]!;
}

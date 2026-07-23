import { z } from "zod";

/**
 * ImagePromptSpecification (ADR-0016) — spécification STRUCTURÉE d'un prompt
 * d'illustration. Le texte du prompt est DÉRIVÉ de cette structure (jamais une
 * phrase libre). Par défaut, aucun texte n'est intégré dans l'image.
 */
export const TextSafeAreaSchema = z.object({
  position: z.enum(["left", "right", "top", "bottom", "center"]),
  /** Part de la surface réservée au texte (0–100). */
  percentage: z.number().min(0).max(100),
});

export const ImagePromptSpecificationSchema = z.object({
  pedagogicalPurpose: z.string().min(1),
  subjectDescription: z.string().min(1),
  audience: z.string().min(1),
  editorialStyle: z.string().min(1),
  composition: z.string().min(1),
  requiredElements: z.array(z.string().min(1)).default([]),
  prohibitedElements: z.array(z.string().min(1)).default([]),
  historicalConstraints: z.array(z.string().min(1)).default([]),
  scientificConstraints: z.array(z.string().min(1)).default([]),
  culturalConstraints: z.array(z.string().min(1)).default([]),
  textSafeArea: TextSafeAreaSchema.optional(),
  /** Interdiction d'intégrer du texte dans l'image (défaut : vrai). */
  noTextInsideImage: z.boolean().default(true),
  aspectRatio: z.string().min(1),
});
export type ImagePromptSpecification = z.infer<typeof ImagePromptSpecificationSchema>;

function bullets(label: string, items: readonly string[]): string | null {
  if (items.length === 0) return null;
  return `${label}: ${items.join(", ")}`;
}

/**
 * Construit le texte de prompt final à partir de la spécification structurée.
 * Fonction PURE : déterministe, testable, sans dépendance fournisseur. Chaque
 * fournisseur d'images l'utilise comme base ; les fournisseurs peuvent affiner.
 */
export function buildImagePrompt(spec: ImagePromptSpecification): string {
  const lines: (string | null)[] = [
    `Pedagogical goal: ${spec.pedagogicalPurpose}`,
    `Subject: ${spec.subjectDescription}`,
    `Audience: ${spec.audience}`,
    `Editorial style: ${spec.editorialStyle}`,
    `Composition: ${spec.composition}`,
    `Aspect ratio: ${spec.aspectRatio}`,
    bullets("Must include", spec.requiredElements),
    bullets("Must not include", spec.prohibitedElements),
    bullets("Historical accuracy", spec.historicalConstraints),
    bullets("Scientific accuracy", spec.scientificConstraints),
    bullets("Cultural context", spec.culturalConstraints),
    spec.textSafeArea
      ? `Keep ${spec.textSafeArea.percentage}% free for text on the ${spec.textSafeArea.position}`
      : null,
    spec.noTextInsideImage ? "Do NOT render any text inside the image" : null,
  ];
  return lines.filter((l): l is string => l !== null).join("\n");
}

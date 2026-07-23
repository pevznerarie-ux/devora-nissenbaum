import { z } from "zod";
import { uuid } from "../core";

/**
 * VisualQualityReview (ADR-0016) — analyse automatique AVANT validation. Ne
 * remplace jamais la validation humaine ; elle la prépare et signale les cas
 * critiques. Distingue défaut esthétique, pédagogique, historique, scientifique,
 * de sécurité et de licence.
 */
export const VisualIssueSeveritySchema = z.enum(["low", "medium", "high", "critical"]);

export const VisualQualityIssueSchema = z.object({
  code: z.string().min(1),
  severity: VisualIssueSeveritySchema,
  description: z.string().min(1),
});

export const VisualQualityRecommendationSchema = z.enum([
  "approve",
  "approve_with_warning",
  "regenerate",
  "replace",
  "human_review",
]);
export type VisualQualityRecommendation = z.infer<
  typeof VisualQualityRecommendationSchema
>;

export const VisualQualityReviewSchema = z.object({
  assetId: uuid,
  overallScore: z.number().min(0).max(1),
  relevanceScore: z.number().min(0).max(1),
  qualityScore: z.number().min(0).max(1),
  accuracyScore: z.number().min(0).max(1),
  styleConsistencyScore: z.number().min(0).max(1),
  detectedIssues: z.array(VisualQualityIssueSchema).default([]),
  recommendation: VisualQualityRecommendationSchema,
  suggestedChanges: z.array(z.string().min(1)).default([]),
});
export type VisualQualityReview = z.infer<typeof VisualQualityReviewSchema>;

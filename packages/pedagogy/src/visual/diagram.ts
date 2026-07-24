import { z } from "zod";
import { uuid } from "../core";

/**
 * DiagramSpecification (ADR-0016) — l'IA produit des DONNÉES JSON ; le rendu SVG
 * (packages/ui) dessine ensuite le schéma. On ne demande JAMAIS à un générateur
 * d'images de produire un schéma contenant du texte. Résultat éditable,
 * traduisible, imprimable, accessible.
 */
export const DiagramTypeSchema = z.enum([
  "cycle",
  "process",
  "flowchart",
  "hierarchy",
  "comparison",
  "cause_effect",
  "mind_map",
  "timeline",
  "labeled_structure",
  "coordinate_graph",
  "bar_chart",
  "line_chart",
  "pie_chart",
  "table_visual",
  "simple_map",
]);
export type DiagramType = z.infer<typeof DiagramTypeSchema>;

export const DiagramNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  /** Valeur numérique pour les graphiques (bar/line/pie). */
  value: z.number().optional(),
  groupId: z.string().optional(),
  description: z.string().optional(),
});

export const DiagramEdgeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  label: z.string().optional(),
  directed: z.boolean().default(true),
});

export const DiagramGroupSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

export const DiagramLegendItemSchema = z.object({
  label: z.string().min(1),
  /** Motif/forme plutôt que couleur seule (accessibilité — jamais la couleur seule). */
  pattern: z.string().optional(),
});

export const DiagramAnnotationSchema = z.object({
  targetId: z.string().min(1).optional(),
  text: z.string().min(1),
});

export const DiagramSpecificationSchema = z.object({
  id: uuid.optional(),
  type: DiagramTypeSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  nodes: z.array(DiagramNodeSchema).default([]),
  edges: z.array(DiagramEdgeSchema).default([]),
  groups: z.array(DiagramGroupSchema).default([]),
  legend: z.array(DiagramLegendItemSchema).default([]),
  annotations: z.array(DiagramAnnotationSchema).default([]),
  /** Données brutes (ex. GeoJSON pour simple_map, séries pour graphiques). */
  sourceData: z.unknown().optional(),
  /** Alternative textuelle obligatoire (accessibilité). */
  accessibilityDescription: z.string().min(1),
});
export type DiagramSpecification = z.infer<typeof DiagramSpecificationSchema>;
export type DiagramNode = z.infer<typeof DiagramNodeSchema>;
export type DiagramEdge = z.infer<typeof DiagramEdgeSchema>;

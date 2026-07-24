import type { DiagramNode } from "./diagram";

/**
 * Géométrie PURE des schémas (ADR-0016) — calcule des coordonnées à partir d'une
 * DiagramSpecification ; le rendu SVG (packages/ui) ne fait que dessiner. Aucun
 * accès DOM/réseau : entièrement testable. Repère : viewBox 0..width / 0..height,
 * y vers le bas (convention SVG).
 */

export interface LayoutBox {
  width: number;
  height: number;
}

export interface BarLayout {
  label: string;
  value: number;
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface BarChartLayout extends LayoutBox {
  bars: BarLayout[];
  baselineY: number;
}

/** Barres proportionnelles à la valeur max, réparties horizontalement. */
export function computeBarChartLayout(
  nodes: readonly Pick<DiagramNode, "label" | "value">[],
  box: LayoutBox = { width: 480, height: 260 },
  pad = 32,
): BarChartLayout {
  const baselineY = box.height - pad;
  const usableH = baselineY - pad;
  const usableW = box.width - pad * 2;
  const max = Math.max(1, ...nodes.map((n) => n.value ?? 0));
  const slot = nodes.length > 0 ? usableW / nodes.length : usableW;
  const barW = Math.max(4, slot * 0.6);

  const bars = nodes.map((n, i) => {
    const value = n.value ?? 0;
    const height = max > 0 ? (value / max) * usableH : 0;
    const x = pad + i * slot + (slot - barW) / 2;
    return { label: n.label, value, x, y: baselineY - height, width: barW, height };
  });
  return { ...box, bars, baselineY };
}

export interface PointLayout {
  label: string;
  x: number;
  y: number;
}
export interface TimelineLayout extends LayoutBox {
  points: PointLayout[];
  axisY: number;
}

/** Points équidistants le long d'un axe horizontal (chronologie). */
export function computeTimelineLayout(
  nodes: readonly Pick<DiagramNode, "label">[],
  box: LayoutBox = { width: 560, height: 140 },
  pad = 40,
): TimelineLayout {
  const axisY = box.height / 2;
  const usableW = box.width - pad * 2;
  const step = nodes.length > 1 ? usableW / (nodes.length - 1) : 0;
  const points = nodes.map((n, i) => ({
    label: n.label,
    x: nodes.length > 1 ? pad + i * step : box.width / 2,
    y: axisY,
  }));
  return { ...box, points, axisY };
}

export interface CycleLayout extends LayoutBox {
  nodes: PointLayout[];
  center: { x: number; y: number };
  radius: number;
}

/** Nœuds répartis sur un cercle (cycle/process circulaire), départ en haut. */
export function computeCycleLayout(
  nodes: readonly Pick<DiagramNode, "label">[],
  size = 300,
  pad = 56,
): CycleLayout {
  const center = { x: size / 2, y: size / 2 };
  const radius = size / 2 - pad;
  const n = nodes.length;
  const placed = nodes.map((node, i) => {
    const angle = -Math.PI / 2 + (i / Math.max(1, n)) * Math.PI * 2;
    return {
      label: node.label,
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    };
  });
  return { width: size, height: size, nodes: placed, center, radius };
}

export interface PieSegment {
  label: string;
  value: number;
  percent: number;
  startAngle: number;
  endAngle: number;
  /** Chemin SVG de la part (secteur), rayon `r`, centre (`cx`,`cy`). */
  path: string;
}
export interface PieLayout extends LayoutBox {
  segments: PieSegment[];
  center: { x: number; y: number };
  radius: number;
}

function polar(cx: number, cy: number, r: number, angle: number): [number, number] {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

/** Secteurs proportionnels ; angles en radians depuis le haut, sens horaire. */
export function computePieLayout(
  nodes: readonly Pick<DiagramNode, "label" | "value">[],
  size = 260,
): PieLayout {
  const center = { x: size / 2, y: size / 2 };
  const radius = size / 2 - 10;
  const total = nodes.reduce((s, n) => s + Math.max(0, n.value ?? 0), 0) || 1;
  let angle = -Math.PI / 2;
  const segments = nodes.map((n) => {
    const value = Math.max(0, n.value ?? 0);
    const sweep = (value / total) * Math.PI * 2;
    const startAngle = angle;
    const endAngle = angle + sweep;
    angle = endAngle;
    const [x1, y1] = polar(center.x, center.y, radius, startAngle);
    const [x2, y2] = polar(center.x, center.y, radius, endAngle);
    const largeArc = sweep > Math.PI ? 1 : 0;
    const path = `M ${center.x} ${center.y} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
    return {
      label: n.label,
      value,
      percent: (value / total) * 100,
      startAngle,
      endAngle,
      path,
    };
  });
  return { width: size, height: size, segments, center, radius };
}

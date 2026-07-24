import { describe, expect, it } from "vitest";
import {
  computeBarChartLayout,
  computeCycleLayout,
  computePieLayout,
  computeTimelineLayout,
} from "../src/visual/diagram-layout";

describe("computeBarChartLayout", () => {
  it("hauteur proportionnelle à la valeur max, barres dans la boîte", () => {
    const l = computeBarChartLayout([
      { label: "A", value: 10 },
      { label: "B", value: 5 },
      { label: "C", value: 0 },
    ]);
    const [a, b, c] = l.bars;
    expect(a!.height).toBeGreaterThan(b!.height);
    expect(b!.height).toBeGreaterThan(c!.height);
    expect(c!.height).toBe(0);
    // La plus haute barre reste dans la zone utile.
    expect(a!.y).toBeGreaterThanOrEqual(0);
    expect(a!.y + a!.height).toBeCloseTo(l.baselineY, 5);
  });
});

describe("computeTimelineLayout", () => {
  it("répartit les points équidistants sur l'axe", () => {
    const l = computeTimelineLayout([{ label: "1" }, { label: "2" }, { label: "3" }]);
    const xs = l.points.map((p) => p.x);
    expect(xs[0]).toBeLessThan(xs[1]!);
    expect(xs[1]! - xs[0]!).toBeCloseTo(xs[2]! - xs[1]!, 5);
    expect(l.points.every((p) => p.y === l.axisY)).toBe(true);
  });

  it("centre un point unique", () => {
    const l = computeTimelineLayout([{ label: "seul" }], { width: 200, height: 100 });
    expect(l.points[0]!.x).toBe(100);
  });
});

describe("computeCycleLayout", () => {
  it("place les nœuds sur un cercle, premier en haut", () => {
    const l = computeCycleLayout(
      [{ label: "a" }, { label: "b" }, { label: "c" }, { label: "d" }],
      300,
      50,
    );
    // Premier nœud au sommet : x ≈ centre, y minimal.
    expect(l.nodes[0]!.x).toBeCloseTo(l.center.x, 5);
    expect(l.nodes[0]!.y).toBeCloseTo(l.center.y - l.radius, 5);
    // Tous à distance radius du centre.
    for (const n of l.nodes) {
      const d = Math.hypot(n.x - l.center.x, n.y - l.center.y);
      expect(d).toBeCloseTo(l.radius, 5);
    }
  });
});

describe("computePieLayout", () => {
  it("les pourcentages somment à 100 et les parts sont proportionnelles", () => {
    const l = computePieLayout([
      { label: "x", value: 3 },
      { label: "y", value: 1 },
    ]);
    const sum = l.segments.reduce((s, seg) => s + seg.percent, 0);
    expect(sum).toBeCloseTo(100, 5);
    expect(l.segments[0]!.percent).toBeCloseTo(75, 5);
    expect(l.segments[0]!.path.startsWith("M")).toBe(true);
  });

  it("gère des valeurs nulles sans division par zéro", () => {
    const l = computePieLayout([{ label: "z", value: 0 }]);
    expect(Number.isFinite(l.segments[0]!.percent)).toBe(true);
  });
});

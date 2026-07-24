import { describe, expect, it } from "vitest";
import { diffKeys, planRegeneration, type DependencyEdge } from "../src/regeneration";

const chain: DependencyEdge[] = [
  { source: "A", dependent: "B" },
  { source: "B", dependent: "C" },
];

const diamond: DependencyEdge[] = [
  { source: "A", dependent: "B" },
  { source: "A", dependent: "C" },
  { source: "B", dependent: "D" },
  { source: "C", dependent: "D" },
];

describe("planRegeneration", () => {
  it("propage la modification à toute la chaîne de dépendants", () => {
    const plan = planRegeneration(chain, ["A"]);
    expect(plan.toRegenerate.sort()).toEqual(["B", "C"]);
    expect(plan.skippedLocked).toEqual([]);
  });

  it("ne régénère rien pour une feuille", () => {
    expect(planRegeneration(chain, ["C"]).toRegenerate).toEqual([]);
  });

  it("un objet verrouillé n'est pas régénéré et stoppe la propagation", () => {
    const plan = planRegeneration(chain, ["A"], ["B"]);
    expect(plan.toRegenerate).toEqual([]); // C n'est pas atteint (B barrière)
    expect(plan.skippedLocked).toEqual(["B"]);
  });

  it("gère les losanges sans doublon (D via B et C)", () => {
    const plan = planRegeneration(diamond, ["A"]);
    expect(plan.toRegenerate.sort()).toEqual(["B", "C", "D"]);
  });

  it("atteint D par C si B est verrouillé", () => {
    const plan = planRegeneration(diamond, ["A"], ["B"]);
    expect(plan.toRegenerate.sort()).toEqual(["C", "D"]);
    expect(plan.skippedLocked).toEqual(["B"]);
  });

  it("est robuste aux cycles", () => {
    const cyclic: DependencyEdge[] = [
      { source: "A", dependent: "B" },
      { source: "B", dependent: "A" },
    ];
    const plan = planRegeneration(cyclic, ["A"]);
    expect(plan.toRegenerate).toEqual(["B"]);
  });

  it("n'inclut pas les objets modifiés eux-mêmes", () => {
    const plan = planRegeneration(chain, ["A", "B"]);
    expect(plan.toRegenerate).toEqual(["C"]);
  });
});

describe("diffKeys", () => {
  it("liste les clés dont la valeur change", () => {
    expect(
      diffKeys(
        { title: "x", duration: 55, tags: [1] },
        { title: "y", duration: 55, tags: [1, 2] },
      ),
    ).toEqual(["tags", "title"]);
  });

  it("retourne vide pour deux versions identiques", () => {
    expect(diffKeys({ a: 1, b: [2] }, { a: 1, b: [2] })).toEqual([]);
  });
});

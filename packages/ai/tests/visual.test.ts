import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { VisualRequestSchema, type ContentKind } from "@pedagoos/pedagogy";
import {
  MockImageProvider,
  MockVisualSearchProvider,
  analyzeVisualNeeds,
  type VisualDirectorInput,
} from "../src/index";
import { MockAIProvider } from "../src/index";

const provider = new MockAIProvider();

function input(overrides: Partial<VisualDirectorInput> = {}): VisualDirectorInput {
  return {
    organizationId: randomUUID(),
    concept: "Le cycle de l'eau",
    blockText: "Décrire l'évaporation et la condensation.",
    hasPedagogicalValue: true,
    hasValidatedLibraryAsset: false,
    usedInGradedAssessment: false,
    orientation: "landscape",
    ...overrides,
  };
}

describe("analyzeVisualNeeds (Visual Director mock)", () => {
  it("un processus → schéma vectoriel, pas de recherche photo", async () => {
    const outcome = await analyzeVisualNeeds(provider, input({ contentKind: "process" }));
    expect(outcome.final.status).toBe("succeeded");
    const req = VisualRequestSchema.parse(outcome.final.data);
    expect(req.recommendedType).toBe("vector_diagram");
    expect(req.preferredSource).toBe("generated_svg");
    expect(req.searchQueries).toEqual([]);
    expect(req.visualNeeded).toBe(true);
  });

  it("un animal → vraie photo avec requêtes et termes négatifs", async () => {
    const outcome = await analyzeVisualNeeds(
      provider,
      input({ concept: "Le lion", contentKind: "animal_or_plant" }),
    );
    const req = VisualRequestSchema.parse(outcome.final.data);
    expect(req.recommendedType).toBe("real_photo");
    expect(req.preferredSource).toBe("unsplash");
    expect(req.searchQueries.length).toBeGreaterThan(0);
    expect(req.negativeSearchTerms).toContain("watermark");
  });

  it("aucune valeur pédagogique → aucun visuel", async () => {
    const outcome = await analyzeVisualNeeds(
      provider,
      input({ hasPedagogicalValue: false }),
    );
    const req = VisualRequestSchema.parse(outcome.final.data);
    expect(req.recommendedType).toBe("none");
    expect(req.visualNeeded).toBe(false);
  });

  it("sujet sensible → validation humaine obligatoire", async () => {
    const outcome = await analyzeVisualNeeds(
      provider,
      input({ concept: "La Shoah", contentKind: "historical_person" }),
    );
    const req = VisualRequestSchema.parse(outcome.final.data);
    expect(req.requiresHumanReview).toBe(true);
  });

  it("un asset validé en médiathèque est proposé avant génération", async () => {
    const kinds: ContentKind[] = ["fictional_scene"];
    for (const contentKind of kinds) {
      const outcome = await analyzeVisualNeeds(
        provider,
        input({ contentKind, hasValidatedLibraryAsset: true }),
      );
      const req = VisualRequestSchema.parse(outcome.final.data);
      expect(req.recommendedType).toBe("library_asset");
    }
  });
});

describe("MockVisualSearchProvider", () => {
  it("filtre par dimensions, déduplique et limite les résultats", async () => {
    const search = new MockVisualSearchProvider();
    const results = await search.search({
      queries: ["African lion savanna", "African lion savanna", "lion pride"],
      minimumWidth: 1200,
      minimumHeight: 800,
      limit: 2,
    });
    expect(results.length).toBeLessThanOrEqual(2);
    expect(results.every((r) => r.width >= 1200 && r.height >= 800)).toBe(true);
    // Déduplication : deux requêtes identiques ne produisent pas deux résultats.
    const ids = new Set(results.map((r) => r.providerId));
    expect(ids.size).toBe(results.length);
  });
});

describe("MockImageProvider", () => {
  it("génère une image mock et des variations aux bonnes dimensions", async () => {
    const gen = new MockImageProvider();
    const one = await gen.generate({ prompt: "a lion", aspectRatio: "16:9" });
    expect(one.status).toBe("succeeded");
    expect(one.width).toBeGreaterThan(one.height);
    const variations = await gen.createVariations({
      sourceImagePath: "mock://x",
      count: 3,
      aspectRatio: "1:1",
    });
    expect(variations).toHaveLength(3);
  });
});

describe("designDiagram (mock)", () => {
  it("relie les étapes d'un cycle et fournit une description d'accessibilité", async () => {
    const { designDiagram } = await import("../src/index");
    const { DiagramSpecificationSchema } = await import("@pedagoos/pedagogy");
    const outcome = await designDiagram(provider, {
      type: "cycle",
      title: "Le cycle de l'eau",
      concept: "cycle de l'eau",
      language: "fr",
      items: ["évaporation", "condensation", "précipitations", "ruissellement"],
      values: [],
    });
    expect(outcome.final.status).toBe("succeeded");
    const spec = DiagramSpecificationSchema.parse(outcome.final.data);
    expect(spec.nodes).toHaveLength(4);
    // Cycle : 4 arêtes (dont le bouclage sur le premier nœud).
    expect(spec.edges).toHaveLength(4);
    expect(spec.accessibilityDescription.length).toBeGreaterThan(0);
  });

  it("un graphique à barres porte les valeurs sans arêtes", async () => {
    const { designDiagram } = await import("../src/index");
    const { DiagramSpecificationSchema } = await import("@pedagoos/pedagogy");
    const outcome = await designDiagram(provider, {
      type: "bar_chart",
      title: "Population",
      concept: "population par ville",
      language: "fr",
      items: ["Paris", "Lyon"],
      values: [2, 1],
    });
    const spec = DiagramSpecificationSchema.parse(outcome.final.data);
    expect(spec.edges).toHaveLength(0);
    expect(spec.nodes[0]!.value).toBe(2);
  });
});

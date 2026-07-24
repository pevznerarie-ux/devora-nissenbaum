import { describe, expect, it } from "vitest";
import {
  DEFAULT_STYLE_KITS,
  DiagramSpecificationSchema,
  ImagePromptSpecificationSchema,
  VisualAssetSchema,
  VisualRequestSchema,
  buildAttributionText,
  buildCreditsList,
  buildImagePrompt,
  chooseRecommendedType,
  defaultStyleKitForAge,
  isSensitiveSubject,
  maySendToExternalAi,
  type ContentKind,
} from "../src/visual";

const id = (n: number) => `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;

describe("chooseRecommendedType — règles déterministes", () => {
  const base = { hasPedagogicalValue: true as const };

  const cases: [ContentKind, string][] = [
    ["quantitative_data", "chart"],
    ["chronology", "timeline"],
    ["process", "vector_diagram"],
    ["historical_person", "historical_source"],
    ["contemporary_place", "real_photo"],
    ["animal_or_plant", "real_photo"],
    ["fictional_scene", "ai_illustration"],
    ["pedagogical_map", "map"],
    ["historical_artwork", "historical_source"],
  ];

  for (const [kind, expected] of cases) {
    it(`${kind} → ${expected}`, () => {
      const d = chooseRecommendedType({ ...base, contentKind: kind });
      expect(d.recommendedType).toBe(expected);
      expect(d.deferToDirector).toBe(false);
    });
  }

  it("aucune valeur pédagogique → none (règle 12)", () => {
    const d = chooseRecommendedType({
      contentKind: "animal_or_plant",
      hasPedagogicalValue: false,
    });
    expect(d.recommendedType).toBe("none");
  });

  it("asset médiathèque validé proposé avant génération (règle 10)", () => {
    const d = chooseRecommendedType({
      ...base,
      contentKind: "fictional_scene",
      hasValidatedLibraryAsset: true,
    });
    expect(d.recommendedType).toBe("library_asset");
  });

  it("cas ambigu (other) → délégué au Visual Director", () => {
    const d = chooseRecommendedType({ ...base, contentKind: "other" });
    expect(d.recommendedType).toBeNull();
    expect(d.deferToDirector).toBe(true);
  });

  it("sujet sensible ou contrôle noté → validation humaine (règle 11)", () => {
    expect(
      chooseRecommendedType({ ...base, contentKind: "process", isSensitive: true })
        .requiresHumanReview,
    ).toBe(true);
    expect(
      chooseRecommendedType({
        ...base,
        contentKind: "quantitative_data",
        usedInGradedAssessment: true,
      }).requiresHumanReview,
    ).toBe(true);
  });
});

describe("isSensitiveSubject", () => {
  it("détecte des sujets sensibles", () => {
    expect(isSensitiveSubject("La Shoah et la déportation")).toBe(true);
    expect(isSensitiveSubject("Les fêtes religieuses")).toBe(true);
  });
  it("laisse passer un sujet neutre", () => {
    expect(isSensitiveSubject("Le cycle de l'eau")).toBe(false);
  });
});

describe("buildImagePrompt", () => {
  it("dérive un prompt structuré et interdit le texte dans l'image par défaut", () => {
    const spec = ImagePromptSpecificationSchema.parse({
      pedagogicalPurpose: "comprendre l'habitat du lion",
      subjectDescription: "un lion adulte dans la savane",
      audience: "élèves de 9 ans",
      editorialStyle: "photo éditoriale",
      composition: "sujet à droite",
      requiredElements: ["savane sèche"],
      prohibitedElements: ["zoo", "cage"],
      aspectRatio: "16:9",
    });
    const prompt = buildImagePrompt(spec);
    expect(prompt).toContain("Must include: savane sèche");
    expect(prompt).toContain("Must not include: zoo, cage");
    expect(prompt).toContain("Do NOT render any text inside the image");
  });
});

describe("licences et crédits", () => {
  it("n'assume jamais qu'une image sans métadonnées est libre", () => {
    expect(
      buildAttributionText({
        isPublicDomain: false,
        attributionRequired: true,
        restrictions: [],
        publishable: false,
      }),
    ).toContain("non publiable");
  });
  it("construit une ligne de crédit lisible", () => {
    expect(
      buildAttributionText({
        creator: "Jane Doe",
        provider: "Wikimedia",
        licenseName: "CC BY-SA 4.0",
        isPublicDomain: false,
        attributionRequired: true,
        restrictions: [],
        publishable: true,
      }),
    ).toBe("Jane Doe · Wikimedia · CC BY-SA 4.0");
  });
  it("agrège les crédits requis", () => {
    const credits = buildCreditsList([
      {
        creator: "A",
        isPublicDomain: false,
        attributionRequired: true,
        restrictions: [],
        publishable: true,
      },
      {
        creator: "B",
        isPublicDomain: true,
        attributionRequired: false,
        restrictions: [],
        publishable: true,
      },
    ]);
    expect(credits).toEqual(["A"]);
  });
});

describe("chartes par défaut", () => {
  it("fournit quatre chartes couvrant les tranches scolaires", () => {
    expect(DEFAULT_STYLE_KITS).toHaveLength(4);
    expect(defaultStyleKitForAge(7).name).toContain("6–8");
    expect(defaultStyleKitForAge(16).name).toContain("15–18");
    // Hors bornes : repli sur une charte médiane, jamais d'exception.
    expect(defaultStyleKitForAge(30).name.length).toBeGreaterThan(0);
  });
});

describe("garde-fou données mineurs", () => {
  it("bloque l'envoi IA externe d'un visuel de mineur sans autorisation", () => {
    expect(
      maySendToExternalAi({
        containsMinor: true,
        containsPersonalData: false,
        externalAiProcessingAllowed: false,
      }),
    ).toBe(false);
    expect(
      maySendToExternalAi({
        containsMinor: true,
        containsPersonalData: false,
        externalAiProcessingAllowed: true,
      }),
    ).toBe(true);
    expect(
      maySendToExternalAi({
        containsMinor: false,
        containsPersonalData: false,
        externalAiProcessingAllowed: false,
      }),
    ).toBe(true);
  });
});

describe("schémas structurés", () => {
  it("valide un VisualRequest minimal", () => {
    const req = VisualRequestSchema.parse({
      id: id(1),
      organizationId: id(2),
      visualNeeded: true,
      pedagogicalPurpose: "explain",
      recommendedType: "vector_diagram",
      preferredSource: "generated_svg",
      concept: "cycle de l'eau",
      description: "schéma du cycle de l'eau",
    });
    expect(req.orientation).toBe("landscape");
    expect(req.requiresHumanReview).toBe(false);
  });

  it("valide une DiagramSpecification avec description d'accessibilité", () => {
    const spec = DiagramSpecificationSchema.parse({
      type: "cycle",
      title: "Cycle de l'eau",
      nodes: [{ id: "a", label: "évaporation" }],
      accessibilityDescription: "Cycle en quatre étapes.",
    });
    expect(spec.nodes).toHaveLength(1);
    expect(spec.edges).toEqual([]);
  });

  it("applique les défauts de confidentialité d'un VisualAsset", () => {
    const asset = VisualAssetSchema.parse({
      id: id(3),
      organizationId: id(2),
      assetType: "photo",
      sourceType: "stock",
      storagePath: `${id(2)}/visuals/x.jpg`,
      width: 1200,
      height: 800,
      mimeType: "image/jpeg",
      fileSize: 1000,
      createdBy: id(4),
    });
    expect(asset.externalAiProcessingAllowed).toBe(false);
    expect(asset.qualityStatus).toBe("pending");
  });
});

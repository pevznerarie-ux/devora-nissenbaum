import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  DEFAULT_MODELS,
  chooseTier,
  estimateCost,
  generateWithEscalation,
  nextTierUp,
  type AIProvider,
  type ModelTier,
  type StructuredGenerationRequest,
  type StructuredGenerationResult,
} from "../src/index";

describe("models & coût", () => {
  it("mappe les trois niveaux et calcule un coût depuis l'usage", () => {
    expect(DEFAULT_MODELS.standard.model).toBe("claude-sonnet-5");
    expect(DEFAULT_MODELS.economy.model).toBe("claude-haiku-4-5");
    expect(DEFAULT_MODELS.premium.model).toBe("claude-opus-4-8");

    const cost = estimateCost(DEFAULT_MODELS.standard, {
      input: 1_000_000,
      output: 1_000_000,
      cacheRead: 0,
      cacheCreation: 0,
    });
    expect(cost).toBeCloseTo(3 + 15, 6);
  });

  it("escalade economy → standard → premium → null", () => {
    expect(nextTierUp("economy")).toBe("standard");
    expect(nextTierUp("standard")).toBe("premium");
    expect(nextTierUp("premium")).toBeNull();
  });
});

describe("router", () => {
  it("premium et lightweight forcent le niveau", () => {
    expect(chooseTier("standard", { premium: true })).toBe("premium");
    expect(chooseTier("standard", { lightweight: true })).toBe("economy");
  });

  it("monte economy → standard sur signaux lourds", () => {
    expect(chooseTier("economy", { documentChars: 50_000 })).toBe("standard");
    expect(chooseTier("economy", { difficulty: "harder" })).toBe("standard");
    expect(chooseTier("economy", { languageCount: 3 })).toBe("standard");
  });

  it("descend standard → economy sur tâche triviale", () => {
    expect(
      chooseTier("standard", {
        documentChars: 500,
        difficulty: "easier",
        materialCount: 1,
      }),
    ).toBe("economy");
  });
});

/** Provider de test : échoue `failures` fois par niveau, réussit ensuite. */
class ScriptedProvider implements AIProvider {
  readonly name = "scripted";
  readonly tiersSeen: ModelTier[] = [];
  private remaining: number;
  constructor(private failuresPerTier: number) {
    this.remaining = failuresPerTier;
  }
  async generateStructured<T>(
    request: StructuredGenerationRequest<T>,
  ): Promise<StructuredGenerationResult<T>> {
    const tier = request.modelTier ?? "standard";
    this.tiersSeen.push(tier);
    const base = { provider: this.name, model: `m-${tier}`, tier, durationMs: 1 };
    if (this.remaining > 0) {
      this.remaining -= 1;
      return { ...base, status: "schema_failed", error: "schéma non respecté" };
    }
    const parsed = request.schema.safeParse({ ok: true });
    return parsed.success
      ? { ...base, status: "succeeded", data: parsed.data }
      : { ...base, status: "provider_failed", error: "x" };
  }
  async analyzeDocument() {
    return { summary: "", provider: this.name, model: "m" };
  }
  async analyzeImage() {
    return { text: "", confidence: 0, provider: this.name, model: "m" };
  }
}

const schema = z.object({ ok: z.boolean() });

describe("échelle d'escalade (ADR-0014 §4)", () => {
  it("réussit sans escalade quand la première tentative passe", async () => {
    const provider = new ScriptedProvider(0);
    const out = await generateWithEscalation(
      provider,
      {
        schema,
        promptName: "t",
        promptVersion: "1",
        system: "",
        user: "u",
        modelTier: "standard",
      },
      { startTier: "standard" },
    );
    expect(out.final.status).toBe("succeeded");
    expect(out.escalated).toBe(false);
    expect(out.attempts).toHaveLength(1);
  });

  it("répare sur le même niveau avant d'escalader", async () => {
    const provider = new ScriptedProvider(1); // 1 échec puis succès
    const out = await generateWithEscalation(
      provider,
      { schema, promptName: "t", promptVersion: "1", system: "", user: "u" },
      { startTier: "standard", repairsPerTier: 1 },
    );
    expect(out.final.status).toBe("succeeded");
    expect(out.escalated).toBe(false);
    expect(provider.tiersSeen).toEqual(["standard", "standard"]);
  });

  it("escalade au niveau supérieur quand les réparations échouent", async () => {
    const provider = new ScriptedProvider(2); // 2 échecs (initiale + réparation) sur standard
    const out = await generateWithEscalation(
      provider,
      { schema, promptName: "t", promptVersion: "1", system: "", user: "u" },
      { startTier: "standard", repairsPerTier: 1 },
    );
    expect(out.final.status).toBe("succeeded");
    expect(out.escalated).toBe(true);
    expect(provider.tiersSeen).toEqual(["standard", "standard", "premium"]);
  });

  it("échoue explicitement au sommet sans correction silencieuse", async () => {
    const provider = new ScriptedProvider(99);
    const out = await generateWithEscalation(
      provider,
      { schema, promptName: "t", promptVersion: "1", system: "", user: "u" },
      { startTier: "premium", repairsPerTier: 1 },
    );
    expect(out.final.status).toBe("schema_failed");
    expect(out.final.data).toBeUndefined();
  });
});

describe("capacité de bout en bout", () => {
  it("génère une structure via le routeur + escalade (mock)", async () => {
    const { MockAIProvider, generateSequenceStructure } = await import("../src/index");
    const provider = new MockAIProvider();
    const out = await generateSequenceStructure(provider, {
      theme: "Les fractions",
      subject: "Mathématiques",
      gradeLevel: "cm1",
      language: "fr",
      sessionCount: 3,
      sessionDurationMinutes: 55,
      difficulty: "standard",
      desiredObjectives: [],
      prerequisites: [],
      constraints: [],
      sourceExcerpts: [{ sourceDocumentId: randomUUID(), title: "Manuel", excerpt: "…" }],
    });
    expect(out.final.status).toBe("succeeded");
    expect(out.final.data?.lessons).toHaveLength(3);
    expect(out.final.tier).toBe("standard");
  });
});

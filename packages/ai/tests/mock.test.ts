import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { LessonSequenceSchema, findDanglingObjectiveIds } from "@pedagoos/pedagogy";
import { MockAIProvider, sequenceStructurePromptV1 } from "../src/index";
import type { SequenceStructureInput } from "../src/index";

const sourceId = randomUUID();

function input(overrides: Partial<SequenceStructureInput> = {}): SequenceStructureInput {
  return {
    theme: "La Révolution française",
    subject: "Histoire",
    gradeLevel: "quatrieme",
    language: "fr",
    sessionCount: 3,
    sessionDurationMinutes: 55,
    difficulty: "standard",
    desiredObjectives: ["Situer 1789"],
    prerequisites: ["Connaître la monarchie absolue"],
    constraints: [],
    sourceExcerpts: [
      {
        sourceDocumentId: sourceId,
        title: "Manuel p.42",
        excerpt: "Prise de la Bastille",
      },
    ],
    ...overrides,
  };
}

describe("MockAIProvider.generateStructured", () => {
  const provider = new MockAIProvider();

  it("produit une structure valide, alignée et déterministe", async () => {
    const result = await provider.generateStructured({
      schema: LessonSequenceSchema,
      promptName: sequenceStructurePromptV1.PROMPT_NAME,
      promptVersion: sequenceStructurePromptV1.PROMPT_VERSION,
      system: "",
      user: "",
      context: input(),
    });

    expect(result.status).toBe("succeeded");
    const structure = result.data;
    expect(structure).toBeDefined();
    if (!structure) return;
    expect(structure.lessons).toHaveLength(3);
    expect(structure.objectives).toHaveLength(3);
    // Chaque séance vise un objectif déclaré (aucun orphelin).
    expect(findDanglingObjectiveIds(structure)).toEqual([]);
    // Les sources fournies sont citées (jamais inventées).
    expect(structure.objectives[0]?.citations[0]?.sourceDocumentId).toBe(sourceId);

    // Déterminisme : deux appels identiques → structure identique.
    const again = await provider.generateStructured({
      schema: LessonSequenceSchema,
      promptName: sequenceStructurePromptV1.PROMPT_NAME,
      promptVersion: sequenceStructurePromptV1.PROMPT_VERSION,
      system: "",
      user: "",
      context: input(),
    });
    expect(again.data).toEqual(structure);
  });

  it("échoue proprement sur un prompt non géré", async () => {
    const result = await provider.generateStructured({
      schema: LessonSequenceSchema,
      promptName: "inconnu",
      promptVersion: "1",
      system: "",
      user: "",
      context: input(),
    });
    expect(result.status).toBe("provider_failed");
    expect(result.data).toBeUndefined();
  });

  it("échoue proprement sur un contexte invalide", async () => {
    const result = await provider.generateStructured({
      schema: LessonSequenceSchema,
      promptName: sequenceStructurePromptV1.PROMPT_NAME,
      promptVersion: sequenceStructurePromptV1.PROMPT_VERSION,
      system: "",
      user: "",
      context: { theme: "" },
    });
    expect(result.status).toBe("provider_failed");
  });

  it("construit des prompts non vides", () => {
    expect(sequenceStructurePromptV1.buildSystemPrompt().length).toBeGreaterThan(0);
    expect(sequenceStructurePromptV1.buildUserPrompt(input())).toContain(sourceId);
  });
});

import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import {
  BlockSchema,
  MaterialContentSchema,
  STUDENT_VARIANT,
  filterBlocksForVariant,
  type MaterialKind,
} from "@pedagoos/pedagogy";
import {
  MockAIProvider,
  applyBlockEdit,
  generateMaterial,
  type MaterialGenerationInput,
} from "../src/index";

const objectiveA = randomUUID();
const objectiveB = randomUUID();

function input(kind: MaterialKind): MaterialGenerationInput {
  return {
    kind,
    language: "fr",
    subject: "Français",
    gradeLevel: "cm1",
    lessonTitle: "Le passé composé",
    lessonSummary: "Former et employer le passé composé.",
    durationMinutes: 55,
    objectives: [
      { id: objectiveA, title: "Former le passé composé" },
      { id: objectiveB, title: "Choisir l'auxiliaire" },
    ],
    constraints: [],
    sourceExcerpts: [],
  };
}

const provider = new MockAIProvider();

describe("generateMaterial (mock)", () => {
  const kinds: MaterialKind[] = [
    "teacher_guide",
    "student_handout",
    "presentation",
    "exercise_set",
    "assessment",
  ];

  for (const kind of kinds) {
    it(`produit un support valide et non vide pour ${kind}`, async () => {
      const outcome = await generateMaterial(provider, input(kind));
      expect(outcome.final.status).toBe("succeeded");
      const parsed = MaterialContentSchema.parse(outcome.final.data);
      expect(parsed.kind).toBe(kind);
      expect(parsed.blocks.length).toBeGreaterThan(0);
      // Tout bloc vise un objectif déclaré (quand il porte des objectiveIds).
      const declared = new Set<string>([objectiveA, objectiveB]);
      for (const block of parsed.blocks) {
        for (const id of block.objectiveIds) expect(declared.has(id)).toBe(true);
      }
    });
  }

  it("n'expose jamais le corrigé dans la variante élève (exercise_set)", async () => {
    const outcome = await generateMaterial(provider, input("exercise_set"));
    const parsed = MaterialContentSchema.parse(outcome.final.data);
    const studentBlocks = filterBlocksForVariant(parsed.blocks, STUDENT_VARIANT);
    expect(studentBlocks.some((b) => b.answerKey)).toBe(false);
    expect(studentBlocks.some((b) => b.type === "expected_answer")).toBe(false);
  });
});

describe("applyBlockEdit (mock)", () => {
  it("conserve id et type et applique l'instruction", async () => {
    const block = BlockSchema.parse({
      id: objectiveA,
      type: "explanation",
      body: "Texte initial.",
    });
    const outcome = await applyBlockEdit(provider, {
      language: "fr",
      subject: "Français",
      gradeLevel: "cm1",
      instruction: "Simplifie le vocabulaire.",
      block,
    });
    expect(outcome.final.status).toBe("succeeded");
    const edited = BlockSchema.parse(outcome.final.data);
    expect(edited.id).toBe(block.id);
    expect(edited.type).toBe("explanation");
    if (edited.type === "explanation") {
      expect(edited.body).toContain("Simplifie le vocabulaire");
    }
  });
});

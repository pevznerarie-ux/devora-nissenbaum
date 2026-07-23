import { describe, expect, it } from "vitest";
import {
  BlockSchema,
  MaterialContentSchema,
  STUDENT_VARIANT,
  TEACHER_VARIANT,
  filterBlocksForVariant,
  reorderBlocks,
  type Block,
} from "../src/blocks";

const id = (n: number) => `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;

const explanation: Block = BlockSchema.parse({
  id: id(1),
  type: "explanation",
  audience: "both",
  body: "Le passé composé se forme avec un auxiliaire.",
});

const teacherNote: Block = BlockSchema.parse({
  id: id(2),
  type: "misconception",
  audience: "teacher",
  description: "Confusion entre auxiliaire être et avoir.",
});

const exerciseAnswer: Block = BlockSchema.parse({
  id: id(3),
  type: "expected_answer",
  audience: "both",
  answerKey: true,
  answer: "Il est allé.",
});

const studentExercise: Block = BlockSchema.parse({
  id: id(4),
  type: "exercise",
  audience: "student",
  title: "Conjugaison",
  category: "application",
  difficulty: 2,
  statement: "Conjugue le verbe aller.",
});

const blocks = [explanation, teacherNote, exerciseAnswer, studentExercise];

describe("BlockSchema", () => {
  it("applique les valeurs par défaut (audience, answerKey, locked)", () => {
    const parsed = BlockSchema.parse({
      id: id(9),
      type: "summary",
      points: ["Point 1"],
    });
    expect(parsed.audience).toBe("both");
    expect(parsed.answerKey).toBe(false);
    expect(parsed.locked).toBe(false);
  });

  it("rejette un type de bloc inconnu", () => {
    expect(BlockSchema.safeParse({ id: id(9), type: "video" }).success).toBe(false);
  });
});

describe("filterBlocksForVariant", () => {
  it("variante élève : ni blocs professeur, ni corrigé", () => {
    const result = filterBlocksForVariant(blocks, STUDENT_VARIANT);
    const ids = result.map((b) => b.id);
    expect(ids).toContain(explanation.id);
    expect(ids).toContain(studentExercise.id);
    expect(ids).not.toContain(teacherNote.id); // audience teacher
    expect(ids).not.toContain(exerciseAnswer.id); // answerKey
  });

  it("variante professeur : tout, y compris le corrigé et les blocs élève", () => {
    const result = filterBlocksForVariant(blocks, TEACHER_VARIANT);
    expect(result).toHaveLength(4);
  });
});

describe("reorderBlocks", () => {
  it("déplace un bloc à un nouvel index sans muter l'entrée", () => {
    const input = [explanation, teacherNote, studentExercise];
    const out = reorderBlocks(input, studentExercise.id, 0);
    expect(out.map((b) => b.id)).toEqual([
      studentExercise.id,
      explanation.id,
      teacherNote.id,
    ]);
    expect(input[0]?.id).toBe(explanation.id); // entrée intacte
  });

  it("borne un index hors limites", () => {
    const input = [explanation, teacherNote];
    const out = reorderBlocks(input, explanation.id, 99);
    expect(out.map((b) => b.id)).toEqual([teacherNote.id, explanation.id]);
  });

  it("laisse le tableau inchangé si le bloc est introuvable", () => {
    const input = [explanation, teacherNote];
    expect(reorderBlocks(input, id(999), 0).map((b) => b.id)).toEqual([
      explanation.id,
      teacherNote.id,
    ]);
  });
});

describe("MaterialContentSchema", () => {
  it("valide un support complet", () => {
    const parsed = MaterialContentSchema.parse({
      kind: "student_handout",
      title: "Le passé composé",
      blocks: [explanation, studentExercise],
    });
    expect(parsed.blocks).toHaveLength(2);
    expect(parsed.citations).toEqual([]);
  });
});

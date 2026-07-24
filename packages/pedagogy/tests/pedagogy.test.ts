import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import {
  AssessmentSchema,
  LessonSequenceSchema,
  findDanglingObjectiveIds,
  validateAssessmentAlignment,
} from "../src/index";

const objectiveId = randomUUID();

function minimalSequence() {
  return {
    title: "La Révolution française",
    theme: "Histoire — 4e",
    language: "fr",
    objectives: [
      {
        id: objectiveId,
        title: "Situer les grandes étapes de 1789",
        bloomLevel: "understand",
      },
    ],
    lessons: [
      {
        id: randomUUID(),
        orderIndex: 0,
        title: "Séance 1 — Les causes",
        durationMinutes: 55,
        objectiveIds: [objectiveId],
        phases: [],
      },
    ],
  };
}

describe("LessonSequenceSchema", () => {
  it("accepte une séquence minimale valide et applique les défauts", () => {
    const parsed = LessonSequenceSchema.parse(minimalSequence());
    expect(parsed.prerequisites).toEqual([]);
    expect(parsed.objectives[0]?.citations).toEqual([]);
  });

  it("rejette une séquence sans objectif ni séance", () => {
    const invalid = { ...minimalSequence(), objectives: [], lessons: [] };
    expect(LessonSequenceSchema.safeParse(invalid).success).toBe(false);
  });

  it("détecte un objectif référencé mais non déclaré", () => {
    const seq = LessonSequenceSchema.parse(minimalSequence());
    const ghost = randomUUID();
    seq.lessons[0]?.objectiveIds.push(ghost);
    expect(findDanglingObjectiveIds(seq)).toEqual([ghost]);
  });
});

describe("AssessmentSchema", () => {
  const assessment = {
    id: randomUUID(),
    title: "Contrôle — Révolution française",
    totalPoints: 10,
    questions: [
      {
        id: randomUUID(),
        orderIndex: 0,
        statement: "Datez la prise de la Bastille et expliquez sa portée.",
        objectiveId,
        difficulty: 2,
        points: 10,
        expectedAnswer: { id: randomUUID(), text: "14 juillet 1789 ; symbole…" },
      },
    ],
  };

  it("valide une évaluation alignée sur les objectifs déclarés", () => {
    const parsed = AssessmentSchema.parse(assessment);
    const result = validateAssessmentAlignment(parsed, [objectiveId]);
    expect(result.misalignedQuestionIds).toEqual([]);
    expect(result.pointsMismatch).toBe(false);
  });

  it("signale une question hors objectifs et un total de points incohérent", () => {
    const parsed = AssessmentSchema.parse({ ...assessment, totalPoints: 12 });
    const result = validateAssessmentAlignment(parsed, [randomUUID()]);
    expect(result.misalignedQuestionIds).toHaveLength(1);
    expect(result.pointsMismatch).toBe(true);
  });

  it("rejette une question sans réponse attendue", () => {
    const q = { ...assessment.questions[0], expectedAnswer: undefined };
    const invalid = { ...assessment, questions: [q] };
    expect(AssessmentSchema.safeParse(invalid).success).toBe(false);
  });
});

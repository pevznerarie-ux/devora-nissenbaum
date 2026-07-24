import { describe, expect, it } from "vitest";
import { BlockSchema, classifyBlockForVisual } from "../src";

const id = (n: number) => `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;

describe("classifyBlockForVisual", () => {
  it("une étape chronologique → chronologie, visuel utile", () => {
    const block = BlockSchema.parse({
      id: id(1),
      type: "timeline_step",
      index: 0,
      title: "1789 : la Révolution",
      durationMinutes: 10,
    });
    const s = classifyBlockForVisual(block);
    expect(s.contentKind).toBe("chronology");
    expect(s.hasPedagogicalValue).toBe(true);
    expect(s.concept).toContain("1789");
  });

  it("une explication → other/explain, visuel utile", () => {
    const block = BlockSchema.parse({
      id: id(2),
      type: "explanation",
      title: "Le cycle de l'eau",
      body: "L'eau s'évapore puis se condense.",
    });
    const s = classifyBlockForVisual(block);
    expect(s.pedagogicalPurpose).toBe("explain");
    expect(s.concept).toBe("Le cycle de l'eau");
  });

  it("un espace de réponse → aucun visuel utile", () => {
    const block = BlockSchema.parse({ id: id(3), type: "answer_space", lines: 5 });
    expect(classifyBlockForVisual(block).hasPedagogicalValue).toBe(false);
  });
});

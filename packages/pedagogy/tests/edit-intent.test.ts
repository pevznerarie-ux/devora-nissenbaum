import { describe, expect, it } from "vitest";
import { EditIntentSchema, editIntentToInstruction } from "../src/edit-intent";

const target = "00000000-0000-4000-8000-000000000001";

describe("EditIntentSchema", () => {
  it("accepte une action rapide seule", () => {
    expect(
      EditIntentSchema.safeParse({ targetObjectId: target, quickAction: "simplify" })
        .success,
    ).toBe(true);
  });

  it("accepte une instruction ciblée seule", () => {
    expect(
      EditIntentSchema.safeParse({
        targetObjectId: target,
        instruction: "Ajoute une date.",
      }).success,
    ).toBe(true);
  });

  it("refuse une intention vide (ni action ni instruction)", () => {
    expect(EditIntentSchema.safeParse({ targetObjectId: target }).success).toBe(false);
  });
});

describe("editIntentToInstruction", () => {
  it("traduit une action rapide en directive", () => {
    const text = editIntentToInstruction({
      targetObjectId: target,
      quickAction: "shorten",
    });
    expect(text.toLowerCase()).toContain("raccourcis");
  });

  it("combine action rapide et instruction ciblée", () => {
    const text = editIntentToInstruction({
      targetObjectId: target,
      quickAction: "add_example",
      instruction: "en lien avec la Révolution française",
    });
    expect(text).toContain("exemple");
    expect(text).toContain("Révolution française");
  });
});

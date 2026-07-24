import { describe, expect, it } from "vitest";
import { FEATURE_FLAGS, isFeatureEnabled } from "../src/feature-flags";

describe("feature flags", () => {
  it("applique les défauts (director actif, génération IA inactive au MVP)", () => {
    expect(isFeatureEnabled("visual_director", {})).toBe(true);
    expect(isFeatureEnabled("ai_image_generation", {})).toBe(false);
  });

  it("respecte l'override d'environnement dans les deux sens", () => {
    expect(
      isFeatureEnabled("ai_image_generation", { FEATURE_AI_IMAGE_GENERATION: "1" }),
    ).toBe(true);
    expect(isFeatureEnabled("visual_director", { FEATURE_VISUAL_DIRECTOR: "off" })).toBe(
      false,
    );
  });

  it("retombe sur le défaut pour une valeur non reconnue", () => {
    expect(isFeatureEnabled("charts", { FEATURE_CHARTS: "peut-être" })).toBe(true);
  });

  it("expose la liste complète des flags", () => {
    expect(FEATURE_FLAGS.length).toBeGreaterThanOrEqual(11);
  });
});

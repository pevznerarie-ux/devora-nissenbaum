import { describe, expect, it } from "vitest";
import { generateInvitationToken, hashInvitationToken } from "./token";

describe("jetons d'invitation", () => {
  it("génère des jetons uniques, opaques et sans caractères d'URL", () => {
    const a = generateInvitationToken();
    const b = generateInvitationToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(32);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("hache de façon déterministe et non réversible", () => {
    const token = generateInvitationToken();
    const hash = hashInvitationToken(token);
    expect(hash).toBe(hashInvitationToken(token));
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain(token);
  });
});

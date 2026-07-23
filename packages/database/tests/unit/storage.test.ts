import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import {
  SIGNED_URL_MAX_AGE_SECONDS,
  STORAGE_BUCKETS,
  buildStoragePath,
  organizationIdFromPath,
} from "../../src/storage";

describe("storage", () => {
  const orgId = randomUUID();

  it("les URL signées sont à durée courte (≤ 10 min — privacy §3)", () => {
    expect(SIGNED_URL_MAX_AGE_SECONDS).toBeLessThanOrEqual(600);
  });

  it("déclare les buckets privés attendus (dont les visuels)", () => {
    expect([...STORAGE_BUCKETS].sort()).toEqual([
      "ai-raw",
      "exports",
      "scans",
      "sources",
      "visuals",
      "visuals-personal",
    ]);
  });

  it("préfixe les chemins par l'organisation et les relit", () => {
    const path = buildStoragePath(orgId, "doc-1", "original.pdf");
    expect(path).toBe(`${orgId}/doc-1/original.pdf`);
    expect(organizationIdFromPath(path)).toBe(orgId);
  });

  it("rejette un organizationId non-UUID et les traversées de chemin", () => {
    expect(() => buildStoragePath("autre-org", "f.pdf")).toThrow();
    expect(() => buildStoragePath(orgId, "../evasion.pdf")).toThrow();
    expect(() => buildStoragePath(orgId, "a/b.pdf")).toThrow();
    expect(() => organizationIdFromPath("pas-un-uuid/f.pdf")).toThrow();
  });
});

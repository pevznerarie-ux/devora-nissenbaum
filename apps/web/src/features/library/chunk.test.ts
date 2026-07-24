import { describe, expect, it } from "vitest";
import { chunkText } from "./chunk";

describe("chunkText", () => {
  it("retourne un seul chunk pour un texte court", () => {
    expect(chunkText("Bonjour la classe.")).toEqual(["Bonjour la classe."]);
    expect(chunkText("   ")).toEqual([]);
  });

  it("regroupe les paragraphes sans dépasser la taille maximale", () => {
    const p1 = "a".repeat(60);
    const p2 = "b".repeat(60);
    const p3 = "c".repeat(60);
    const chunks = chunkText(`${p1}\n\n${p2}\n\n${p3}`, 130);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toBe(`${p1}\n${p2}`);
    expect(chunks[1]).toBe(p3);
  });

  it("découpe un long paragraphe aux frontières de phrases", () => {
    const sentence = "Ceci est une phrase complète qui décrit la Révolution française.";
    const text = Array.from({ length: 10 }, () => sentence).join(" ");
    const chunks = chunkText(text, 200);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(200);
    }
    expect(chunks.join(" ").replace(/\s+/g, " ")).toContain("Révolution française");
  });

  it("coupe en dur un mot-fleuve plus long que la taille maximale", () => {
    const chunks = chunkText("x".repeat(450), 200);
    expect(chunks).toHaveLength(3);
  });
});

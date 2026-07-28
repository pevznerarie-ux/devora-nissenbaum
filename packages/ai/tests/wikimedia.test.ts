import { describe, expect, it, vi } from "vitest";
import {
  MockVisualSearchProvider,
  WikimediaSearchProvider,
  createVisualSearchProvider,
} from "../src/index";

/** Réponse Commons enregistrée (structure réelle de l'API MediaWiki). */
const COMMONS_FIXTURE = {
  query: {
    pages: {
      "1": {
        index: 1,
        title: "File:Fraction cake.jpg",
        imageinfo: [
          {
            url: "https://upload.wikimedia.org/full/Fraction_cake.jpg",
            descriptionurl: "https://commons.wikimedia.org/wiki/File:Fraction_cake.jpg",
            thumburl: "https://upload.wikimedia.org/thumb/800px-Fraction_cake.jpg",
            thumbwidth: 800,
            thumbheight: 600,
            width: 2000,
            height: 1500,
            mime: "image/jpeg",
            extmetadata: {
              LicenseShortName: { value: "CC BY-SA 4.0" },
              LicenseUrl: { value: "https://creativecommons.org/licenses/by-sa/4.0" },
              License: { value: "cc-by-sa-4.0" },
              Artist: { value: '<a href="https://x">Jane Doe</a>' },
              AttributionRequired: { value: "true" },
            },
          },
        ],
      },
      "2": {
        index: 2,
        title: "File:Public fraction.png",
        imageinfo: [
          {
            url: "https://upload.wikimedia.org/full/Public_fraction.png",
            descriptionurl: "https://commons.wikimedia.org/wiki/File:Public_fraction.png",
            thumburl: "https://upload.wikimedia.org/thumb/800px-Public_fraction.png",
            width: 1600,
            height: 1600,
            mime: "image/png",
            extmetadata: {
              License: { value: "pd" },
              LicenseShortName: { value: "Public domain" },
            },
          },
        ],
      },
      "3": {
        index: 3,
        title: "File:Tiny thumbnail.jpg",
        imageinfo: [
          {
            url: "https://upload.wikimedia.org/full/Tiny.jpg",
            width: 100,
            height: 80,
            mime: "image/jpeg",
            extmetadata: {},
          },
        ],
      },
      "4": {
        index: 4,
        title: "File:Some audio.ogg",
        imageinfo: [
          {
            url: "https://upload.wikimedia.org/full/Some_audio.ogg",
            width: 0,
            height: 0,
            mime: "application/ogg",
            extmetadata: {},
          },
        ],
      },
    },
  },
};

function fetchReturning(payload: unknown, ok = true): typeof fetch {
  return vi.fn(async () => ({
    ok,
    json: async () => payload,
  })) as unknown as typeof fetch;
}

describe("WikimediaSearchProvider", () => {
  it("parse licence, auteur (HTML retiré) et miniature d'une image CC", async () => {
    const provider = new WikimediaSearchProvider({
      fetchImpl: fetchReturning(COMMONS_FIXTURE),
    });
    const results = await provider.search({ queries: ["fraction cake"], limit: 10 });
    const cc = results.find((r) => r.providerId === "File:Fraction cake.jpg");
    expect(cc).toBeDefined();
    expect(cc?.provider).toBe("wikimedia-commons");
    expect(cc?.sourceName).toBe("Wikimedia Commons");
    expect(cc?.previewUrl).toContain("800px");
    expect(cc?.fileUrl).toContain("full/Fraction_cake.jpg");
    expect(cc?.author).toBe("Jane Doe");
    expect(cc?.licenseName).toBe("CC BY-SA 4.0");
    expect(cc?.isPublicDomain).toBe(false);
    expect(cc?.attributionRequired).toBe(true);
    expect(cc?.orientation).toBe("landscape");
  });

  it("détecte le domaine public (pas d'attribution requise)", async () => {
    const provider = new WikimediaSearchProvider({
      fetchImpl: fetchReturning(COMMONS_FIXTURE),
    });
    const results = await provider.search({ queries: ["fraction"], limit: 10 });
    const pd = results.find((r) => r.providerId === "File:Public fraction.png");
    expect(pd?.isPublicDomain).toBe(true);
    expect(pd?.attributionRequired).toBe(false);
  });

  it("filtre les mime non-image et les dimensions trop petites", async () => {
    const provider = new WikimediaSearchProvider({
      fetchImpl: fetchReturning(COMMONS_FIXTURE),
    });
    const results = await provider.search({
      queries: ["fraction"],
      minimumWidth: 1000,
      limit: 10,
    });
    const ids = results.map((r) => r.providerId);
    expect(ids).not.toContain("File:Some audio.ogg"); // mime rejeté
    expect(ids).not.toContain("File:Tiny thumbnail.jpg"); // trop petit
    expect(ids).toContain("File:Fraction cake.jpg");
  });

  it("restreint au domaine public quand demandé", async () => {
    const provider = new WikimediaSearchProvider({
      fetchImpl: fetchReturning(COMMONS_FIXTURE),
    });
    const results = await provider.search({
      queries: ["fraction"],
      publicDomainOnly: true,
      limit: 10,
    });
    expect(results.every((r) => r.isPublicDomain)).toBe(true);
    expect(results.map((r) => r.providerId)).toContain("File:Public fraction.png");
  });

  it("exclut les résultats correspondant aux termes négatifs", async () => {
    const provider = new WikimediaSearchProvider({
      fetchImpl: fetchReturning(COMMONS_FIXTURE),
    });
    const results = await provider.search({
      queries: ["fraction"],
      negativeTerms: ["cake"],
      limit: 10,
    });
    expect(results.map((r) => r.providerId)).not.toContain("File:Fraction cake.jpg");
  });

  it("respecte la limite de résultats", async () => {
    const provider = new WikimediaSearchProvider({
      fetchImpl: fetchReturning(COMMONS_FIXTURE),
    });
    const results = await provider.search({ queries: ["fraction"], limit: 1 });
    expect(results).toHaveLength(1);
  });

  it("dégrade silencieusement en cas d'erreur réseau", async () => {
    const provider = new WikimediaSearchProvider({
      fetchImpl: vi.fn(async () => {
        throw new Error("réseau indisponible");
      }) as unknown as typeof fetch,
    });
    const results = await provider.search({ queries: ["fraction"], limit: 3 });
    expect(results).toEqual([]);
  });

  it("retourne [] sur réponse HTTP non-ok", async () => {
    const provider = new WikimediaSearchProvider({
      fetchImpl: fetchReturning({}, false),
    });
    const results = await provider.search({ queries: ["fraction"], limit: 3 });
    expect(results).toEqual([]);
  });

  it("exige une implémentation de fetch", () => {
    expect(
      () =>
        new WikimediaSearchProvider({ fetchImpl: undefined as unknown as typeof fetch }),
    ).not.toThrow(); // retombe sur globalThis.fetch si présent
  });
});

describe("createVisualSearchProvider", () => {
  it("renvoie le mock par défaut", () => {
    expect(createVisualSearchProvider()).toBeInstanceOf(MockVisualSearchProvider);
    expect(createVisualSearchProvider({ real: false })).toBeInstanceOf(
      MockVisualSearchProvider,
    );
  });

  it("renvoie Wikimedia quand real=true", () => {
    const provider = createVisualSearchProvider({
      real: true,
      fetchImpl: fetchReturning(COMMONS_FIXTURE),
    });
    expect(provider).toBeInstanceOf(WikimediaSearchProvider);
    expect(provider.name).toBe("wikimedia-commons");
  });
});

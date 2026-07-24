import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  INVITABLE_ROLES,
  LOCALES,
  MEMBER_ROLES,
  PRODUCT_NAME,
  isMemberRole,
  textDirection,
  toActionError,
  AppError,
} from "../src/index";
import fr from "../src/i18n/fr.json";
import en from "../src/i18n/en.json";
import he from "../src/i18n/he.json";

describe("branding", () => {
  it("expose un nom de produit non vide", () => {
    expect(PRODUCT_NAME.length).toBeGreaterThan(0);
  });
});

describe("roles", () => {
  it("contient les 8 rôles du PRD", () => {
    expect(MEMBER_ROLES).toHaveLength(8);
    expect(isMemberRole("teacher")).toBe(true);
    expect(isMemberRole("hacker")).toBe(false);
  });

  it("n'autorise pas l'invitation d'un platform_admin, d'un élève ou d'un parent", () => {
    expect(INVITABLE_ROLES).not.toContain("platform_admin");
    expect(INVITABLE_ROLES).not.toContain("student");
    expect(INVITABLE_ROLES).not.toContain("parent");
  });
});

describe("i18n", () => {
  it("fr est la locale par défaut", () => {
    expect(DEFAULT_LOCALE).toBe("fr");
    expect(LOCALES).toContain("he");
  });

  it("l'hébreu est RTL, le français LTR, une locale inconnue LTR", () => {
    expect(textDirection("he")).toBe("rtl");
    expect(textDirection("fr")).toBe("ltr");
    expect(textDirection("xx")).toBe("ltr");
  });

  it("toutes les locales ont les mêmes clés que le français", () => {
    const keys = (obj: object, prefix = ""): string[] =>
      Object.entries(obj).flatMap(([k, v]) =>
        typeof v === "object" && v !== null
          ? keys(v, `${prefix}${k}.`)
          : [`${prefix}${k}`],
      );
    const frKeys = keys(fr).sort();
    expect(keys(en).sort()).toEqual(frKeys);
    expect(keys(he).sort()).toEqual(frKeys);
  });
});

describe("errors", () => {
  it("convertit une AppError en résultat d'action", () => {
    const res = toActionError(new AppError("forbidden", "Accès refusé."));
    expect(res).toEqual({ ok: false, code: "forbidden", message: "Accès refusé." });
  });

  it("masque les erreurs inconnues", () => {
    const res = toActionError(new Error("secret interne"));
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("internal");
      expect(res.message).not.toContain("secret");
    }
  });
});

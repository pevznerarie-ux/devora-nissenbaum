import { describe, expect, it } from "vitest";
import {
  formatHebrewDate,
  hebrewAcademicYearLabel,
  hebrewNumeral,
  hebrewYearNumberOf,
  hebrewYearOf,
} from "../src/hebrew-calendar";

describe("calendrier hébreu", () => {
  it("convertit un nombre en numéral hébreu traditionnel", () => {
    expect(hebrewNumeral(786)).toBe("תשפ״ו");
    expect(hebrewNumeral(787)).toBe("תשפ״ז");
    expect(hebrewNumeral(715)).toBe("תשט״ו");
    expect(hebrewNumeral(716)).toBe("תשט״ז");
    expect(hebrewNumeral(5)).toBe("ה׳");
    expect(() => hebrewNumeral(0)).toThrow();
    expect(() => hebrewNumeral(1000)).toThrow();
  });

  it("calcule l'année hébraïque d'une date civile (Roch Hachana 5787 = 12/09/2026)", () => {
    expect(hebrewYearNumberOf("2026-09-01")).toBe(5786);
    expect(hebrewYearNumberOf("2026-10-01")).toBe(5787);
    expect(hebrewYearOf("2026-09-01")).toBe("תשפ״ו");
    expect(hebrewYearOf("2026-10-01")).toBe("תשפ״ז");
    expect(() => hebrewYearOf("pas-une-date")).toThrow();
  });

  it("libelle une année scolaire sur un ou deux ans hébraïques", () => {
    // Année israélienne (après Roch Hachana → été) : un seul an hébraïque.
    expect(hebrewAcademicYearLabel("2026-10-01", "2027-06-30")).toBe("תשפ״ז");
    // Année française (rentrée avant Roch Hachana) : chevauchement.
    expect(hebrewAcademicYearLabel("2026-09-01", "2027-06-30")).toBe("תשפ״ו–תשפ״ז");
  });

  it("formate une date complète en calendrier hébreu dans la locale UI", () => {
    const formatted = formatHebrewDate("2026-10-01", "fr");
    expect(formatted).toContain("5787");
    expect(formatted.toLowerCase()).toContain("tichri");
  });
});

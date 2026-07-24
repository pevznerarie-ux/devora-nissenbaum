import { describe, expect, it } from "vitest";
import { parseStudentsCsv } from "./csv";

describe("parseStudentsCsv", () => {
  it("parse un CSV virgule avec en-tête et date optionnelle", () => {
    const result = parseStudentsCsv(
      "prenom,nom,date_naissance\nLéa,Martin,2014-05-02\nNoam,Cohen,\n",
    );
    expect(result.errors).toEqual([]);
    expect(result.rows).toEqual([
      { line: 2, firstName: "Léa", lastName: "Martin", birthDate: "2014-05-02" },
      { line: 3, firstName: "Noam", lastName: "Cohen" },
    ]);
  });

  it("parse un CSV point-virgule sans en-tête, ignore les lignes vides", () => {
    const result = parseStudentsCsv('Ana;Silva\n\n"Jean";"Du Pont";2013-01-31\n');
    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[1]).toEqual({
      line: 3,
      firstName: "Jean",
      lastName: "Du Pont",
      birthDate: "2013-01-31",
    });
  });

  it("signale ligne par ligne les noms manquants et dates invalides", () => {
    const result = parseStudentsCsv("Léa,,\nNoam,Cohen,31/01/2013\nEmma,Levi,2014-13-40");
    expect(result.rows).toEqual([]);
    expect(result.errors).toEqual([
      { line: 1, code: "missing_name" },
      { line: 2, code: "invalid_date" },
      { line: 3, code: "invalid_date" },
    ]);
  });

  it("n'avale pas une vraie première ligne de données comme en-tête", () => {
    const result = parseStudentsCsv("Prune,Bernard,2014-02-03\nLéo,Roux,");
    expect(result.rows).toHaveLength(2);
    expect(result.errors).toEqual([]);
  });
});

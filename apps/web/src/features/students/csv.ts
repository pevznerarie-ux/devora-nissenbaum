/**
 * Parseur CSV minimal pour l'import d'élèves (PRD §3.B) : colonnes
 * prénom, nom, date de naissance (optionnelle, AAAA-MM-JJ). Séparateur
 * virgule ou point-virgule détecté, en-tête facultatif, rapport d'erreurs
 * ligne à ligne. Volontairement sans dépendance externe.
 */

export interface CsvStudentRow {
  line: number;
  firstName: string;
  lastName: string;
  birthDate?: string;
}

export type CsvErrorCode = "missing_name" | "invalid_date";

export interface CsvError {
  line: number;
  code: CsvErrorCode;
}

export interface CsvParseResult {
  rows: CsvStudentRow[];
  errors: CsvError[];
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const FIRST_NAME_HEADER_RE = /^(pr[eé]nom|first ?name)$/i;
const LAST_NAME_HEADER_RE = /^(nom|last ?name)$/i;

function splitLine(line: string, separator: string): string[] {
  return line.split(separator).map((cell) =>
    cell
      .trim()
      .replace(/^"(.*)"$/, "$1")
      .trim(),
  );
}

function isValidDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseStudentsCsv(text: string): CsvParseResult {
  const lines = text.split(/\r\n|\r|\n/);
  const separator = text.includes(";") && !text.includes(",") ? ";" : ",";
  const rows: CsvStudentRow[] = [];
  const errors: CsvError[] = [];

  lines.forEach((rawLine, index) => {
    const line = index + 1;
    if (rawLine.trim().length === 0) return;

    const cells = splitLine(rawLine, separator);
    const [first = "", last = "", birth = ""] = cells;

    // En-tête toléré uniquement en première ligne non vide, reconnu par le
    // nom exact des colonnes (jamais par ressemblance : un élève nommé
    // « Prune » ne doit pas être avalé comme en-tête).
    if (rows.length === 0 && errors.length === 0) {
      if (FIRST_NAME_HEADER_RE.test(first) || LAST_NAME_HEADER_RE.test(last)) {
        return;
      }
    }

    if (first.length === 0 || last.length === 0) {
      errors.push({ line, code: "missing_name" });
      return;
    }
    if (birth.length > 0 && !isValidDate(birth)) {
      errors.push({ line, code: "invalid_date" });
      return;
    }

    rows.push(
      birth.length > 0
        ? { line, firstName: first, lastName: last, birthDate: birth }
        : { line, firstName: first, lastName: last },
    );
  });

  return { rows, errors };
}

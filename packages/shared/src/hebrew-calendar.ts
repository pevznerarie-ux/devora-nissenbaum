/**
 * Double calendrier des années scolaires : les dates sont stockées en
 * calendrier civil (grégorien, référence de la base), et chaque année
 * scolaire porte en plus un libellé hébreu traditionnel (ex. תשפ״ו),
 * calculé automatiquement et modifiable par l'administrateur.
 */

const GERESH = "׳";
const GERSHAYIM = "״";

const ONES = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
const TENS = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
const HUNDREDS = ["", "ק", "ר", "ש", "ת", "תק", "תר", "תש", "תת", "תתק"];

/**
 * Numéral hébreu traditionnel pour 1..999 (millénaire omis, usage courant :
 * 786 → תשפו), avec les exceptions טו (15) et טז (16) et la ponctuation
 * geresh/gershayim d'usage.
 */
export function hebrewNumeral(value: number): string {
  if (!Number.isInteger(value) || value < 1 || value > 999) {
    throw new Error("hebrewNumeral attend un entier entre 1 et 999.");
  }
  const hundreds = Math.floor(value / 100);
  const remainder = value % 100;
  let letters = HUNDREDS[hundreds] ?? "";
  if (remainder === 15) {
    letters += "טו";
  } else if (remainder === 16) {
    letters += "טז";
  } else {
    letters += (TENS[Math.floor(remainder / 10)] ?? "") + (ONES[remainder % 10] ?? "");
  }
  if (letters.length === 1) return letters + GERESH;
  return letters.slice(0, -1) + GERSHAYIM + letters.slice(-1);
}

/** Année hébraïque numérique (ex. 5786) d'une date civile ISO (AAAA-MM-JJ). */
export function hebrewYearNumberOf(dateIso: string): number {
  const date = new Date(`${dateIso}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Date civile invalide.");
  }
  const formatted = new Intl.DateTimeFormat("en-u-ca-hebrew", {
    year: "numeric",
  }).format(date);
  const year = Number.parseInt(formatted, 10);
  if (!Number.isFinite(year)) {
    throw new Error("Année hébraïque non calculable.");
  }
  return year;
}

/** Libellé hébreu traditionnel (ex. תשפ״ו) d'une date civile. */
export function hebrewYearOf(dateIso: string): string {
  return hebrewNumeral(hebrewYearNumberOf(dateIso) % 1000);
}

/**
 * Libellé hébreu d'une année scolaire civile [startsOn, endsOn].
 * Une année scolaire israélienne (post-Roch Hachana → été) tient dans une
 * seule année hébraïque ; une année française (septembre → juin) peut en
 * chevaucher deux — les deux libellés sont alors joints.
 */
export function hebrewAcademicYearLabel(startsOn: string, endsOn: string): string {
  const start = hebrewYearOf(startsOn);
  const end = hebrewYearOf(endsOn);
  return start === end ? start : `${start}–${end}`;
}

/** Date complète en calendrier hébreu, dans la locale d'affichage donnée. */
export function formatHebrewDate(dateIso: string, displayLocale: string): string {
  const date = new Date(`${dateIso}T12:00:00Z`);
  return new Intl.DateTimeFormat(`${displayLocale}-u-ca-hebrew`, {
    dateStyle: "long",
  }).format(date);
}

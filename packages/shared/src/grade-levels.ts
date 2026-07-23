/**
 * Référentiel de niveaux — système français par défaut (hypothèse A-005),
 * stocké en code texte extensible (classes.grade_level). Les libellés
 * passent par i18n (`grades.<code>`).
 */
export const GRADE_LEVELS = [
  "cp",
  "ce1",
  "ce2",
  "cm1",
  "cm2",
  "sixieme",
  "cinquieme",
  "quatrieme",
  "troisieme",
  "seconde",
  "premiere",
  "terminale",
] as const;

export type GradeLevel = (typeof GRADE_LEVELS)[number];

export function isGradeLevel(value: string): value is GradeLevel {
  return (GRADE_LEVELS as readonly string[]).includes(value);
}

/** Matières semées à la création d'une organisation (modifiables ensuite). */
export const DEFAULT_SUBJECTS = [
  "Français",
  "Mathématiques",
  "Histoire-Géographie",
  "Sciences et technologie",
  "Anglais",
] as const;

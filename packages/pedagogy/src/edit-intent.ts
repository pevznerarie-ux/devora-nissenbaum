import { z } from "zod";
import { uuid } from "./core";

/**
 * Édition par intentions (ADR-0010) — le professeur ne « chatte » pas avec l'IA :
 * il désigne un objet (bloc, objectif, séance) puis exprime une intention, soit
 * via une **action rapide** prédéfinie, soit via une **instruction ciblée** en
 * langage naturel. C'est le contrat de la boucle Modifier → Régénérer.
 */

/**
 * Actions rapides prédéfinies (pas de saisie libre requise). Elles couvrent les
 * retouches les plus fréquentes sur un bloc de support.
 */
export const QuickActionSchema = z.enum([
  "simplify", // simplifier le vocabulaire / la formulation
  "shorten", // raccourcir
  "expand", // développer / ajouter du détail
  "rephrase", // reformuler sans changer le sens
  "add_example", // ajouter un exemple concret
  "raise_difficulty", // relever le niveau de difficulté
  "lower_difficulty", // abaisser le niveau de difficulté
  "make_more_concrete", // rendre plus concret / contextualisé
  "add_citation", // rattacher / rappeler une source
]);
export type QuickAction = z.infer<typeof QuickActionSchema>;

/**
 * Une intention d'édition ciblée. `targetObjectId` désigne l'objet à modifier
 * (id de bloc au sein d'un support, ou id d'objet pédagogique). Au moins l'un
 * de `quickAction` / `instruction` doit être fourni.
 */
export const EditIntentSchema = z
  .object({
    targetObjectId: uuid,
    quickAction: QuickActionSchema.optional(),
    /** Instruction ciblée en langage naturel (facultative si action rapide). */
    instruction: z.string().min(1).max(1000).optional(),
  })
  .refine((v) => v.quickAction !== undefined || v.instruction !== undefined, {
    message: "Une intention doit porter une action rapide ou une instruction.",
  });
export type EditIntent = z.infer<typeof EditIntentSchema>;

/** Libellé impératif d'une action rapide, injecté dans le prompt de retouche. */
const QUICK_ACTION_DIRECTIVE: Record<QuickAction, string> = {
  simplify: "Simplifie le vocabulaire et les phrases sans perdre le sens.",
  shorten: "Raccourcis le contenu en gardant l'essentiel.",
  expand: "Développe le contenu avec plus de détails pédagogiques.",
  rephrase: "Reformule le contenu sans en changer le sens.",
  add_example: "Ajoute un exemple concret et adapté au niveau.",
  raise_difficulty: "Relève le niveau de difficulté et d'exigence.",
  lower_difficulty: "Abaisse le niveau de difficulté pour un public en soutien.",
  make_more_concrete: "Rends le contenu plus concret et contextualisé.",
  add_citation: "Rattache le contenu à une source réelle fournie (jamais inventée).",
};

/**
 * Transforme une intention en instruction textuelle pour le moteur de retouche.
 * Une action rapide fournit une directive ; une instruction libre est reprise
 * telle quelle ; les deux se combinent si présentes.
 */
export function editIntentToInstruction(intent: EditIntent): string {
  const parts: string[] = [];
  if (intent.quickAction) parts.push(QUICK_ACTION_DIRECTIVE[intent.quickAction]);
  if (intent.instruction) parts.push(intent.instruction);
  return parts.join(" ");
}

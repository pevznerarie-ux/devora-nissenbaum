import { z } from "zod";
import { BlockSchema, MaterialKindSchema, QuickActionSchema } from "@pedagoos/pedagogy";

/** Génère un support d'un type donné pour une séance de la séquence. */
export const generateMaterialSchema = z.object({
  sequenceId: z.uuid(),
  lessonId: z.uuid(),
  kind: MaterialKindSchema,
});

export const materialIdSchema = z.object({ materialId: z.uuid() });

/** Autosave de l'état de travail : la liste de blocs, validée bloc par bloc. */
export const saveBlocksSchema = z.object({
  materialId: z.uuid(),
  blocks: z
    .string()
    .max(500_000)
    .transform((raw, ctx) => {
      try {
        return z.array(BlockSchema).parse(JSON.parse(raw));
      } catch {
        ctx.addIssue({ code: "custom", message: "Blocs invalides." });
        return z.NEVER;
      }
    }),
});

/** Édition par intentions (ADR-0010) : cible un bloc, action rapide et/ou instruction. */
export const editIntentSchema = z
  .object({
    materialId: z.uuid(),
    blockId: z.uuid(),
    quickAction: QuickActionSchema.optional().or(
      z.literal("").transform(() => undefined),
    ),
    instruction: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .or(z.literal("").transform(() => undefined)),
  })
  .refine((v) => v.quickAction !== undefined || v.instruction !== undefined, {
    message: "Une intention doit porter une action rapide ou une instruction.",
  });

export const lockBlockSchema = z.object({
  materialId: z.uuid(),
  blockId: z.uuid(),
  locked: z.enum(["true", "false"]).transform((v) => v === "true"),
});

export const restoreVersionSchema = z.object({
  materialId: z.uuid(),
  versionNumber: z.coerce.number().int().min(1),
});

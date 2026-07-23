import { z } from "zod";

/** Analyse du besoin visuel d'un bloc (Visual Director — ADR-0016). */
export const recommendVisualSchema = z.object({
  materialId: z.uuid(),
  blockId: z.uuid(),
});

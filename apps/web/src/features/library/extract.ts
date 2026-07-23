import "server-only";
import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

/**
 * Extraction de texte des documents importés (PRD §3.C). PDF et DOCX en
 * Node ; les images attendent le module OCR (A-012 / ADR-0007) et restent
 * en statut `awaiting_ocr` — jamais un faux « échec ».
 */

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export function isAllowedMimeType(mime: string): mime is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mime);
}

export type ExtractionOutcome =
  | { status: "ready"; text: string }
  | { status: "awaiting_ocr" }
  | { status: "failed"; error: string };

export async function extractTextFromFile(
  mimeType: AllowedMimeType,
  buffer: Buffer,
): Promise<ExtractionOutcome> {
  try {
    switch (mimeType) {
      case "text/plain":
        return { status: "ready", text: buffer.toString("utf-8") };
      case "application/pdf": {
        const pdf = await getDocumentProxy(new Uint8Array(buffer));
        const { text } = await extractText(pdf, { mergePages: true });
        return { status: "ready", text };
      }
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
        const result = await mammoth.extractRawText({ buffer });
        return { status: "ready", text: result.value };
      }
      case "image/png":
      case "image/jpeg":
      case "image/webp":
        return { status: "awaiting_ocr" };
    }
  } catch {
    // Détail journalisé côté serveur uniquement ; message neutre en base.
    return { status: "failed", error: "extraction_error" };
  }
}

/** Nom de fichier sûr pour un chemin Storage (un seul segment, ASCII). */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "document";
  const cleaned = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 120);
  return cleaned.length > 0 ? cleaned : "document";
}

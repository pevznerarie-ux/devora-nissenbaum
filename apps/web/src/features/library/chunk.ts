/**
 * Découpage du texte extrait en chunks (source_chunks) : base des futures
 * citations précises et de la recherche fine. Coupe de préférence aux
 * frontières de paragraphes, sinon de phrases, sans jamais dépasser maxLen.
 */

export const DEFAULT_CHUNK_LENGTH = 1500;

export function chunkText(text: string, maxLen = DEFAULT_CHUNK_LENGTH): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (normalized.length === 0) return [];
  if (maxLen < 50) throw new Error("maxLen trop petit pour un chunk utile.");

  const paragraphs = normalized.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = "";

  const flush = () => {
    const trimmed = current.trim();
    if (trimmed.length > 0) chunks.push(trimmed);
    current = "";
  };

  const pushPiece = (piece: string) => {
    if (current.length + piece.length + 1 > maxLen) flush();
    // Morceau plus long que maxLen : coupe dure en tranches.
    while (piece.length > maxLen) {
      chunks.push(piece.slice(0, maxLen).trim());
      piece = piece.slice(maxLen);
    }
    current = current.length > 0 ? `${current}\n${piece}` : piece;
  };

  for (const paragraph of paragraphs) {
    if (paragraph.length <= maxLen) {
      pushPiece(paragraph);
      continue;
    }
    // Paragraphe trop long : découpe par phrases.
    for (const sentence of paragraph.split(/(?<=[.!?؟。])\s+/)) {
      pushPiece(sentence);
    }
  }
  flush();
  return chunks;
}

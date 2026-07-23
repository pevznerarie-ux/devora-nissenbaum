import type { Block } from "@pedagoos/pedagogy";

/**
 * Résumé textuel court d'un bloc pour l'aperçu de l'éditeur (lecture seule).
 * Pur : aucune dépendance UI. Le rendu riche complet relève des exports (Phase 9).
 */
export function blockSummary(block: Block): string {
  switch (block.type) {
    case "objectives":
      return block.items.map((i) => i.label).join(" · ");
    case "vocabulary":
      return block.terms.map((t) => t.term).join(", ");
    case "timeline_step":
      return `${block.title} (${block.durationMinutes} min)`;
    case "explanation":
      return block.title ? `${block.title} — ${block.body}` : block.body;
    case "example":
      return `${block.prompt} → ${block.worked}`;
    case "discussion_question":
      return block.question;
    case "expected_answer":
      return block.answer;
    case "misconception":
      return block.description;
    case "differentiation":
      return `${block.level} — ${block.description}`;
    case "summary":
      return block.points.join(" · ");
    case "exercise":
      return `${block.title} — ${block.statement}`;
    case "assessment_question":
      return `${block.statement} (${block.points} pts)`;
    case "document_ref":
      return block.note ?? block.sourceDocumentId;
    case "answer_space":
      return block.label ?? `${block.lines} lignes`;
    case "slide":
      return `${block.title} — ${block.bullets.join(" · ")}`;
  }
}

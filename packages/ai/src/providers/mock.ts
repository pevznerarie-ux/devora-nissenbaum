import type { z } from "zod";
import {
  type BloomLevel,
  type LessonSequence,
  SourceCitationSchema,
} from "@pedagoos/pedagogy";
import type {
  AIProvider,
  DocumentAnalysisRequest,
  DocumentAnalysisResult,
  ImageAnalysisRequest,
  ImageAnalysisResult,
  StructuredGenerationRequest,
  StructuredGenerationResult,
} from "../provider";
import { PROMPT_NAME } from "../prompts/sequence-structure/v1";
import { SequenceStructureInputSchema } from "../sequence-structure";

/** Générateur d'UUID DÉTERMINISTE (mock reproductible — ADR-0004). */
function deterministicUuid(seed: number): string {
  const hex = seed.toString(16).padStart(12, "0");
  return `00000000-0000-4000-8000-${hex}`;
}

const BLOOM_PROGRESSION: BloomLevel[] = [
  "remember",
  "understand",
  "apply",
  "analyze",
  "evaluate",
  "create",
];

/**
 * Construit une structure de séquence plausible et déterministe à partir des
 * entrées de l'assistant. Cite les sources fournies (jamais de référence
 * inventée) et garantit les invariants (chaque séance vise un objectif
 * déclaré, progression sans répétition).
 */
export function buildMockSequenceStructure(
  input: z.infer<typeof SequenceStructureInputSchema>,
): LessonSequence {
  let counter = 1;
  const nextId = () => deterministicUuid(counter++);

  const citations = input.sourceExcerpts.map((source) =>
    SourceCitationSchema.parse({
      sourceDocumentId: source.sourceDocumentId,
      excerpt: source.excerpt.slice(0, 200) || undefined,
    }),
  );

  // Un objectif par séance au minimum ; réutilise les objectifs souhaités.
  const objectiveTitles: string[] = [];
  for (let i = 0; i < input.sessionCount; i++) {
    const desired = input.desiredObjectives[i];
    objectiveTitles.push(
      desired ?? `Objectif ${i + 1} — ${input.theme} (séance ${i + 1})`,
    );
  }

  const objectives = objectiveTitles.map((title, index) => ({
    id: nextId(),
    title,
    description: `Objectif rattaché au thème « ${input.theme} », niveau ${input.gradeLevel}.`,
    bloomLevel:
      BLOOM_PROGRESSION[Math.min(index, BLOOM_PROGRESSION.length - 1)] ?? "understand",
    competencyIds: [],
    citations,
  }));

  const prerequisites = input.prerequisites.map((label) => ({
    id: nextId(),
    label,
    description: undefined,
    checkSuggestion: `Vérifier en début de séquence : ${label}.`,
  }));

  const lessons = objectives.map((objective, index) => ({
    id: nextId(),
    orderIndex: index,
    title: `Séance ${index + 1} — ${objective.title}`,
    summary:
      `Progression : s'appuie sur la séance ${index}. ${input.constraints.join(" ; ")}`.trim(),
    durationMinutes: input.sessionDurationMinutes,
    objectiveIds: [objective.id],
    phases: [],
  }));

  return {
    title: `${input.theme} (${input.subject})`,
    theme: input.theme,
    language: input.language,
    objectives,
    prerequisites,
    lessons,
    citations,
    notes:
      "Proposition générée automatiquement (MockAIProvider) — à réviser et valider par un professeur.",
  };
}

/**
 * Fournisseur IA factice : déterministe, sans réseau ni coût, utilisé en CI
 * et en développement (ADR-0004). Gère la génération de structure de séquence
 * nativement ; toute autre demande structurée échoue proprement.
 */
export class MockAIProvider implements AIProvider {
  readonly name = "mock";
  readonly model = "mock-structured-v1";

  async generateStructured<T>(
    request: StructuredGenerationRequest<T>,
  ): Promise<StructuredGenerationResult<T>> {
    const start = Date.now();
    const base = {
      provider: this.name,
      model: this.model,
      tier: request.modelTier ?? ("standard" as const),
    };

    if (request.promptName !== PROMPT_NAME) {
      return {
        ...base,
        status: "provider_failed",
        error: `MockAIProvider ne gère pas le prompt « ${request.promptName} ».`,
        durationMs: Date.now() - start,
      };
    }

    const parsedInput = SequenceStructureInputSchema.safeParse(request.context);
    if (!parsedInput.success) {
      return {
        ...base,
        status: "provider_failed",
        error: "Contexte de génération invalide.",
        durationMs: Date.now() - start,
      };
    }

    const raw = buildMockSequenceStructure(parsedInput.data);
    const validated = request.schema.safeParse(raw);
    if (!validated.success) {
      return {
        ...base,
        status: "schema_failed",
        raw,
        error: validated.error.message,
        durationMs: Date.now() - start,
      };
    }

    return {
      ...base,
      status: "succeeded",
      data: validated.data,
      raw,
      durationMs: Date.now() - start,
    };
  }

  async analyzeDocument(
    request: DocumentAnalysisRequest,
  ): Promise<DocumentAnalysisResult> {
    return {
      summary: `Résumé factice (${request.text.length} caractères).`,
      provider: this.name,
      model: this.model,
    };
  }

  async analyzeImage(_request: ImageAnalysisRequest): Promise<ImageAnalysisResult> {
    return { text: "", confidence: 0, provider: this.name, model: this.model };
  }
}

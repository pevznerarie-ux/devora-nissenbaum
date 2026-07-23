import type { z } from "zod";
import {
  type Block,
  type BloomLevel,
  type LessonSequence,
  type MaterialContent,
  type PedagogicalPurpose,
  type PreferredSource,
  type RecommendedVisualType,
  type VisualRequest,
  MaterialContentSchema,
  SourceCitationSchema,
  VisualRequestSchema,
  chooseRecommendedType,
  isSensitiveSubject,
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
import * as sequenceStructurePromptV1 from "../prompts/sequence-structure/v1";
import * as materialPromptV1 from "../prompts/material/v1";
import * as materialEditPromptV1 from "../prompts/material-edit/v1";
import * as visualDirectorPromptV1 from "../prompts/visual-director/v1";
import { SequenceStructureInputSchema } from "../sequence-structure";
import { MaterialEditInputSchema, MaterialGenerationInputSchema } from "../material";
import { VisualDirectorInputSchema } from "../visual/director";

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
 * Construit un support par blocs plausible et déterministe pour un type donné.
 * Les blocs référencent les objectifs fournis, marquent `audience`/`answerKey`
 * correctement, et ne citent que les sources fournies. Base de test/CI et
 * développement (aucun réseau, aucun coût).
 */
export function buildMockMaterial(
  input: z.infer<typeof MaterialGenerationInputSchema>,
): MaterialContent {
  let counter = 1;
  const nextId = () => deterministicUuid(counter++);
  const objectiveIds = input.objectives.map((o) => o.id);
  const firstObjective = objectiveIds[0] ? [objectiveIds[0]] : [];
  const citations = input.sourceExcerpts.map((source) =>
    SourceCitationSchema.parse({
      sourceDocumentId: source.sourceDocumentId,
      excerpt: source.excerpt.slice(0, 200) || undefined,
    }),
  );

  const objectivesBlock: Block = {
    id: nextId(),
    type: "objectives",
    audience: "both",
    answerKey: false,
    locked: false,
    objectiveIds,
    items: input.objectives.map((o) => ({ objectiveId: o.id, label: o.title })),
  };

  const blocks: Block[] = [];

  switch (input.kind) {
    case "teacher_guide": {
      blocks.push(objectivesBlock);
      const phases = ["Mise en route", "Apprentissage guidé", "Synthèse"];
      phases.forEach((title, i) => {
        const duration = Math.max(5, Math.round(input.durationMinutes / phases.length));
        blocks.push({
          id: nextId(),
          type: "timeline_step",
          audience: "teacher",
          answerKey: false,
          locked: false,
          objectiveIds: firstObjective,
          index: i,
          title,
          durationMinutes: duration,
          teacherNote: `${title} — appui sur : ${input.lessonTitle}.`,
        });
      });
      blocks.push({
        id: nextId(),
        type: "misconception",
        audience: "teacher",
        answerKey: false,
        locked: false,
        objectiveIds: firstObjective,
        description: `Erreur fréquente à anticiper sur « ${input.lessonTitle} ».`,
        remediationHint: "Reprendre un exemple concret avant de généraliser.",
      });
      blocks.push({
        id: nextId(),
        type: "summary",
        audience: "both",
        answerKey: false,
        locked: false,
        objectiveIds,
        points: input.objectives.map((o) => `À retenir : ${o.title}`),
      });
      break;
    }
    case "student_handout": {
      blocks.push(objectivesBlock);
      blocks.push({
        id: nextId(),
        type: "explanation",
        audience: "student",
        answerKey: false,
        locked: false,
        objectiveIds: firstObjective,
        title: input.lessonTitle,
        body: `Explication adaptée au niveau ${input.gradeLevel}. ${input.lessonSummary}`.trim(),
        epistemic: "fact",
        citations,
      });
      blocks.push({
        id: nextId(),
        type: "example",
        audience: "student",
        answerKey: false,
        locked: false,
        objectiveIds: firstObjective,
        prompt: `Exemple appliqué à « ${input.lessonTitle} ».`,
        worked: "Étape par étape, résolution guidée.",
        citations,
      });
      blocks.push({
        id: nextId(),
        type: "exercise",
        audience: "student",
        answerKey: false,
        locked: false,
        objectiveIds: firstObjective,
        title: "Application",
        category: "application",
        difficulty: 2,
        statement: `Exercice sur « ${input.lessonTitle} ».`,
        citations,
      });
      break;
    }
    case "presentation": {
      blocks.push({
        id: nextId(),
        type: "slide",
        audience: "both",
        answerKey: false,
        locked: false,
        objectiveIds,
        title: input.lessonTitle,
        bullets: input.objectives.map((o) => o.title),
        speakerNotes: "Diapositive d'introduction.",
      });
      input.objectives.forEach((o) => {
        blocks.push({
          id: nextId(),
          type: "slide",
          audience: "both",
          answerKey: false,
          locked: false,
          objectiveIds: [o.id],
          title: o.title,
          bullets: ["Point clé 1", "Point clé 2"],
        });
      });
      break;
    }
    case "exercise_set": {
      input.objectives.forEach((o, i) => {
        blocks.push({
          id: nextId(),
          type: "exercise",
          audience: "student",
          answerKey: false,
          locked: false,
          objectiveIds: [o.id],
          title: `Exercice ${i + 1}`,
          category: i === 0 ? "comprehension" : "application",
          difficulty: Math.min(5, i + 1),
          statement: `Exercice ${i + 1} sur « ${o.title} ».`,
          citations,
        });
        blocks.push({
          id: nextId(),
          type: "expected_answer",
          audience: "teacher",
          answerKey: true,
          locked: false,
          objectiveIds: [o.id],
          answer: `Corrigé de l'exercice ${i + 1}.`,
          acceptableVariations: [],
          epistemic: "fact",
          citations,
        });
      });
      break;
    }
    case "assessment": {
      blocks.push(objectivesBlock);
      input.objectives.forEach((o, i) => {
        blocks.push({
          id: nextId(),
          type: "assessment_question",
          audience: "both",
          answerKey: false,
          locked: false,
          objectiveIds: [o.id],
          orderIndex: i,
          statement: `Question ${i + 1} — ${o.title}.`,
          points: 5,
          difficulty: Math.min(5, i + 2),
          expectedAnswer: `Réponse attendue à la question ${i + 1}.`,
          gradingCriteria: ["Exactitude", "Justification"],
        });
      });
      break;
    }
  }

  return MaterialContentSchema.parse({
    kind: input.kind,
    title: `${input.lessonTitle} — ${input.kind}`,
    blocks,
    citations,
    notes: "Support généré automatiquement (MockAIProvider) — à réviser et valider.",
  });
}

/**
 * Applique une retouche déterministe à un bloc unique (édition par intentions).
 * Conserve `id`, `type`, `audience` et `answerKey` ; annote le champ textuel
 * principal avec l'instruction pour un mock reproductible et vérifiable.
 */
export function buildMockBlockEdit(
  input: z.infer<typeof MaterialEditInputSchema>,
): Block {
  const { block, instruction } = input;
  const tag = `[retouché : ${instruction}]`;
  switch (block.type) {
    case "explanation":
      return { ...block, body: `${block.body} ${tag}` };
    case "example":
      return { ...block, worked: `${block.worked} ${tag}` };
    case "exercise":
      return { ...block, statement: `${block.statement} ${tag}` };
    case "assessment_question":
      return { ...block, statement: `${block.statement} ${tag}` };
    case "discussion_question":
      return { ...block, question: `${block.question} ${tag}` };
    case "summary":
      return { ...block, points: [...block.points, tag] };
    case "slide":
      return { ...block, bullets: [...block.bullets, tag] };
    case "misconception":
      return { ...block, description: `${block.description} ${tag}` };
    default:
      // Types sans champ textuel évident : retour inchangé (mock).
      return block;
  }
}

const PURPOSE_FALLBACK: Record<PedagogicalPurpose, RecommendedVisualType> = {
  illustrate: "ai_illustration",
  engage: "ai_illustration",
  contextualize: "ai_illustration",
  demonstrate: "vector_diagram",
  explain: "vector_diagram",
  compare: "vector_diagram",
  memorize: "vector_diagram",
  document: "historical_source",
  assess: "none",
};

const TYPE_TO_SOURCE: Record<RecommendedVisualType, PreferredSource> = {
  none: "internal_library",
  real_photo: "unsplash",
  ai_illustration: "openai",
  vector_diagram: "generated_svg",
  timeline: "generated_svg",
  chart: "generated_svg",
  map: "generated_svg",
  historical_source: "wikimedia",
  library_asset: "internal_library",
  teacher_upload: "teacher",
};

/**
 * Construit un VisualRequest plausible et déterministe (Visual Director mock,
 * ADR-0016). Applique les règles déterministes ; pour un cas ambigu, replie sur
 * la fonction pédagogique. « Aucun visuel » reste une issue normale.
 */
export function buildMockVisualRequest(
  input: z.infer<typeof VisualDirectorInputSchema>,
): VisualRequest {
  const purpose: PedagogicalPurpose = input.pedagogicalPurpose ?? "illustrate";
  const isSensitive = isSensitiveSubject(input.concept);
  const decision = chooseRecommendedType({
    contentKind: input.contentKind ?? "other",
    hasPedagogicalValue: input.hasPedagogicalValue,
    hasValidatedLibraryAsset: input.hasValidatedLibraryAsset,
    isSensitive,
    usedInGradedAssessment: input.usedInGradedAssessment,
  });
  const type = decision.recommendedType ?? PURPOSE_FALLBACK[purpose];
  const needsSearch = type === "real_photo" || type === "historical_source";

  return VisualRequestSchema.parse({
    id: deterministicUuid(1),
    organizationId: input.organizationId,
    ...(input.materialId ? { materialId: input.materialId } : {}),
    ...(input.lessonBlockId ? { lessonBlockId: input.lessonBlockId } : {}),
    visualNeeded: type !== "none",
    pedagogicalPurpose: purpose,
    recommendedType: type,
    preferredSource: TYPE_TO_SOURCE[type],
    fallbackTypes:
      type === "real_photo"
        ? ["library_asset"]
        : type === "ai_illustration"
          ? ["vector_diagram", "none"]
          : [],
    concept: input.concept,
    description: input.blockText || input.concept,
    caption: input.concept,
    altText: `Illustration : ${input.concept}`,
    ...(input.targetAge !== undefined ? { targetAge: input.targetAge } : {}),
    ...(input.schoolLevel ? { schoolLevel: input.schoolLevel } : {}),
    ...(input.subject ? { subject: input.subject } : {}),
    ...(input.language ? { language: input.language } : {}),
    orientation: input.orientation,
    searchQueries: needsSearch
      ? [input.concept, `${input.concept} educational photo`]
      : [],
    negativeSearchTerms: type === "real_photo" ? ["watermark", "cartoon", "logo"] : [],
    requiresHumanReview: decision.requiresHumanReview,
  });
}

/**
 * Fournisseur IA factice : déterministe, sans réseau ni coût, utilisé en CI et
 * en développement (ADR-0004). Gère la structure de séquence, la génération de
 * supports par blocs, la retouche d'un bloc et l'analyse visuelle (Director) ;
 * tout autre prompt échoue proprement.
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
    const fail = (
      status: "provider_failed" | "schema_failed",
      error: string,
      raw?: unknown,
    ): StructuredGenerationResult<T> => ({
      ...base,
      status,
      error,
      raw,
      durationMs: Date.now() - start,
    });

    let raw: unknown;
    if (request.promptName === sequenceStructurePromptV1.PROMPT_NAME) {
      const parsed = SequenceStructureInputSchema.safeParse(request.context);
      if (!parsed.success)
        return fail("provider_failed", "Contexte de génération invalide.");
      raw = buildMockSequenceStructure(parsed.data);
    } else if (request.promptName === materialPromptV1.PROMPT_NAME) {
      const parsed = MaterialGenerationInputSchema.safeParse(request.context);
      if (!parsed.success)
        return fail("provider_failed", "Contexte de support invalide.");
      raw = buildMockMaterial(parsed.data);
    } else if (request.promptName === materialEditPromptV1.PROMPT_NAME) {
      const parsed = MaterialEditInputSchema.safeParse(request.context);
      if (!parsed.success)
        return fail("provider_failed", "Contexte de retouche invalide.");
      raw = buildMockBlockEdit(parsed.data);
    } else if (request.promptName === visualDirectorPromptV1.PROMPT_NAME) {
      const parsed = VisualDirectorInputSchema.safeParse(request.context);
      if (!parsed.success)
        return fail("provider_failed", "Contexte d'analyse visuelle invalide.");
      raw = buildMockVisualRequest(parsed.data);
    } else {
      return fail(
        "provider_failed",
        `MockAIProvider ne gère pas le prompt « ${request.promptName} ».`,
      );
    }

    const validated = request.schema.safeParse(raw);
    if (!validated.success) return fail("schema_failed", validated.error.message, raw);

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

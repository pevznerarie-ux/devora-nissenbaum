import "server-only";
import { MockAIProvider, type AIProvider } from "@pedagoos/ai";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Fabrique du fournisseur IA (ADR-0004). Au MVP : MockAIProvider déterministe.
 * La Phase 7 branchera Anthropic/OpenAI par configuration, derrière cette
 * même interface — aucun code métier ne dépend d'un fournisseur précis.
 */
export function getAIProvider(): AIProvider {
  return new MockAIProvider();
}

export interface AiGenerationLog {
  organizationId: string;
  requestedBy: string;
  provider: string;
  model: string;
  promptName: string;
  promptVersion: string;
  parameters: Record<string, unknown>;
  targetType: string;
  targetId?: string;
  sourceDocumentIds: string[];
  rawOutput: unknown;
  validatedOutput: unknown;
  status: "succeeded" | "schema_failed" | "provider_failed";
  error?: string;
  durationMs: number;
  costEstimate?: number;
}

/** Journalise une génération IA (ai_generations) via le client service_role. */
export async function logAiGeneration(entry: AiGenerationLog): Promise<void> {
  const admin = createAdminClient();
  await admin.from("ai_generations").insert({
    organization_id: entry.organizationId,
    requested_by: entry.requestedBy,
    provider: entry.provider,
    model: entry.model,
    prompt_name: entry.promptName,
    prompt_version: entry.promptVersion,
    parameters: entry.parameters,
    target_type: entry.targetType,
    target_id: entry.targetId ?? null,
    source_document_ids: entry.sourceDocumentIds,
    raw_output: entry.rawOutput ?? null,
    validated_output: entry.validatedOutput ?? null,
    status: entry.status,
    error: entry.error ?? null,
    duration_ms: entry.durationMs,
    cost_estimate: entry.costEstimate ?? null,
  });
}

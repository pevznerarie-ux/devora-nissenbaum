import "server-only";
import {
  AnthropicProvider,
  MockAIProvider,
  type AIProvider,
  type ModelTier,
  type TokenUsage,
} from "@pedagoos/ai";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Fabrique du fournisseur IA (ADR-0004/0014). Anthropic si une clé API est
 * configurée, sinon MockAIProvider déterministe (défaut en CI et développement
 * hors ligne). Aucun code métier ne dépend d'un fournisseur ni d'un modèle
 * précis : il passe par une capacité, le routeur choisit le niveau.
 */
export function getAIProvider(): AIProvider {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (apiKey && apiKey.length > 0) {
    return new AnthropicProvider({ apiKey });
  }
  return new MockAIProvider();
}

export interface AiGenerationLog {
  organizationId: string;
  requestedBy: string;
  schoolId?: string;
  provider: string;
  model: string;
  tier?: ModelTier;
  capability?: string;
  engine?: string;
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
  responseTimeMs?: number;
  usage?: TokenUsage;
  cacheHit?: boolean;
  costEstimate?: number;
}

/** Journalise une génération IA (ai_generations) via le client service_role. */
export async function logAiGeneration(entry: AiGenerationLog): Promise<void> {
  const admin = createAdminClient();
  await admin.from("ai_generations").insert({
    organization_id: entry.organizationId,
    requested_by: entry.requestedBy,
    school_id: entry.schoolId ?? null,
    provider: entry.provider,
    model: entry.model,
    tier: entry.tier ?? null,
    capability: entry.capability ?? null,
    engine: entry.engine ?? null,
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
    response_time_ms: entry.responseTimeMs ?? entry.durationMs,
    token_input: entry.usage?.input ?? null,
    token_output: entry.usage?.output ?? null,
    token_cache_read: entry.usage?.cacheRead ?? null,
    token_cache_creation: entry.usage?.cacheCreation ?? null,
    cache_hit: entry.cacheHit ?? null,
    cost_estimate: entry.costEstimate ?? null,
  });
}

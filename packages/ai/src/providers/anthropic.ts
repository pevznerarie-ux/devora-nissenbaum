import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type {
  AIProvider,
  DocumentAnalysisRequest,
  DocumentAnalysisResult,
  ImageAnalysisRequest,
  ImageAnalysisResult,
  ModelTier,
  StructuredGenerationRequest,
  StructuredGenerationResult,
} from "../provider";
import { DEFAULT_MODELS, estimateCost, type ModelConfig } from "../models";

/**
 * Fournisseur Anthropic réel (ADR-0004/0014). Sortie structurée garantie par
 * tool-use forcé (le schéma Zod devient le schéma d'entrée d'un outil, la
 * réponse est le `tool_use.input`). Prompt caching sur le prompt système
 * (préfixe stable), retries bornés, calcul de coût depuis l'usage réel.
 *
 * Construit uniquement quand une clé API est disponible ; le MockAIProvider
 * reste le défaut en CI et en développement hors ligne.
 */
export interface AnthropicProviderOptions {
  apiKey: string;
  models?: Record<ModelTier, ModelConfig>;
  maxRetries?: number;
}

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  private readonly client: Anthropic;
  private readonly models: Record<ModelTier, ModelConfig>;

  constructor(options: AnthropicProviderOptions) {
    this.client = new Anthropic({
      apiKey: options.apiKey,
      maxRetries: options.maxRetries ?? 3,
    });
    this.models = options.models ?? DEFAULT_MODELS;
  }

  async generateStructured<T>(
    request: StructuredGenerationRequest<T>,
  ): Promise<StructuredGenerationResult<T>> {
    const start = Date.now();
    const tier = request.modelTier ?? "standard";
    const config = this.models[tier];
    const base = { provider: this.name, model: config.model, tier };

    // Schéma JSON dérivé du schéma Zod, exposé comme outil « respond ».
    const jsonSchema = z.toJSONSchema(request.schema, { target: "draft-7" });

    try {
      const message = await this.client.messages.create({
        model: config.model,
        max_tokens: request.maxTokens ?? 8000,
        // Prompt système en bloc caché : préfixe stable réutilisé (ADR-0014 §5).
        system: [
          {
            type: "text",
            text: request.system,
            cache_control: { type: "ephemeral" },
          },
        ],
        tools: [
          {
            name: "respond",
            description: "Renvoie la réponse STRICTEMENT conforme au schéma fourni.",
            input_schema: jsonSchema as Anthropic.Tool.InputSchema,
          },
        ],
        tool_choice: { type: "tool", name: "respond" },
        messages: [{ role: "user", content: request.user }],
      });

      const usage = {
        input: message.usage.input_tokens,
        output: message.usage.output_tokens,
        cacheRead: message.usage.cache_read_input_tokens ?? 0,
        cacheCreation: message.usage.cache_creation_input_tokens ?? 0,
      };
      const meta = {
        ...base,
        durationMs: Date.now() - start,
        usage,
        cacheHit: usage.cacheRead > 0,
        costEstimate: estimateCost(config, usage),
      };

      const toolUse = message.content.find((block) => block.type === "tool_use");
      if (!toolUse || toolUse.type !== "tool_use") {
        return { ...meta, status: "provider_failed", error: "Aucune sortie structurée." };
      }

      const validated = request.schema.safeParse(toolUse.input);
      if (!validated.success) {
        return {
          ...meta,
          status: "schema_failed",
          raw: toolUse.input,
          error: validated.error.message,
        };
      }
      return { ...meta, status: "succeeded", data: validated.data, raw: toolUse.input };
    } catch (error) {
      return {
        ...base,
        status: "provider_failed",
        durationMs: Date.now() - start,
        error: error instanceof Error ? error.message : "Erreur fournisseur.",
      };
    }
  }

  async analyzeDocument(
    request: DocumentAnalysisRequest,
  ): Promise<DocumentAnalysisResult> {
    const config = this.models.economy;
    const message = await this.client.messages.create({
      model: config.model,
      max_tokens: 1024,
      system: [{ type: "text", text: request.instruction }],
      messages: [{ role: "user", content: request.text.slice(0, 100_000) }],
    });
    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    return { summary: text, provider: this.name, model: config.model };
  }

  async analyzeImage(_request: ImageAnalysisRequest): Promise<ImageAnalysisResult> {
    // L'analyse d'image (OCR) relève de OCRProvider (ADR-0007), pas de ce provider.
    return {
      text: "",
      confidence: 0,
      provider: this.name,
      model: this.models.economy.model,
    };
  }
}

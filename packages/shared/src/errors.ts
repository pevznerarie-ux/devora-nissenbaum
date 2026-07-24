/**
 * Erreurs applicatives typées. Les server actions retournent
 * `ActionResult<T>` — jamais d'exception brute vers le client.
 */
export type AppErrorCode =
  | "validation_failed"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "ai_schema_failed"
  | "ai_provider_failed"
  | "internal";

export class AppError extends Error {
  readonly code: AppErrorCode;
  /** Détails sûrs à afficher (jamais de données personnelles). */
  readonly details: Record<string, string> | undefined;

  constructor(code: AppErrorCode, message: string, details?: Record<string, string>) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }
}

export type ActionResult<T> =
  { ok: true; data: T } | { ok: false; code: AppErrorCode; message: string };

export function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof AppError) {
    return { ok: false, code: error.code, message: error.message };
  }
  // Jamais de message brut d'une erreur inconnue vers le client.
  return { ok: false, code: "internal", message: "Une erreur inattendue est survenue." };
}

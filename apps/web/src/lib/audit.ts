import "server-only";
import { AppError } from "@pedagoos/shared";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AuditEntry {
  organizationId: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string;
  /** Métadonnées minimales — jamais de données personnelles inutiles. */
  metadata?: Record<string, string | number | boolean>;
}

/**
 * Journal métier append-only (CLAUDE.md §5.6). L'insertion passe par le
 * client service_role (les utilisateurs n'ont aucun droit d'écriture RLS) ;
 * un échec d'audit fait échouer l'opération : pas d'action sensible non tracée.
 */
export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("audit_logs").insert({
    organization_id: entry.organizationId,
    actor_id: entry.actorId,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    metadata: entry.metadata ?? {},
  });
  if (error) {
    throw new AppError("internal", "Écriture du journal d'audit impossible.");
  }
}

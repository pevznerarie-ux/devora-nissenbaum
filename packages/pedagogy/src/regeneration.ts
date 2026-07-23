/**
 * Régénération intelligente (ADR-0011) — logique pure, sans base ni IA.
 *
 * Chaque objet pédagogique porte `id/version/status/locked/dependencies`. Quand
 * un objet change, seuls les dépendants **non verrouillés** sont recalculés ;
 * tout le reste est conservé. Un objet verrouillé n'est jamais régénéré et
 * agit comme **barrière** : sa sortie étant figée, la propagation s'arrête à
 * lui.
 */

export type ObjectStatus = "proposed" | "draft" | "validated" | "published" | "archived";

/** Arête « la modification de `source` impose de recalculer `dependent` ». */
export interface DependencyEdge {
  source: string;
  dependent: string;
}

export interface RegenerationPlan {
  /** Dépendants à régénérer (ordre de découverte, BFS). */
  toRegenerate: string[];
  /** Dépendants ignorés car verrouillés (barrières). */
  skippedLocked: string[];
}

/**
 * Calcule la fermeture transitive des dépendants des objets modifiés, en
 * excluant les objets verrouillés (qui stoppent aussi la propagation).
 * Robuste aux cycles.
 */
export function planRegeneration(
  edges: readonly DependencyEdge[],
  changedIds: readonly string[],
  lockedIds: Iterable<string> = [],
): RegenerationPlan {
  const locked = new Set(lockedIds);
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    const list = adjacency.get(edge.source);
    if (list) list.push(edge.dependent);
    else adjacency.set(edge.source, [edge.dependent]);
  }

  const toRegenerate = new Set<string>();
  const skippedLocked = new Set<string>();
  const visited = new Set<string>();
  const queue: string[] = [...changedIds];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) break;
    for (const dependent of adjacency.get(current) ?? []) {
      if (visited.has(dependent)) continue;
      visited.add(dependent);
      if (locked.has(dependent)) {
        // Barrière : figé, non régénéré, propagation stoppée.
        skippedLocked.add(dependent);
        continue;
      }
      toRegenerate.add(dependent);
      queue.push(dependent);
    }
  }

  // Un objet modifié directement par l'utilisateur n'est pas « régénéré ».
  for (const changed of changedIds) toRegenerate.delete(changed);

  return {
    toRegenerate: [...toRegenerate],
    skippedLocked: [...skippedLocked],
  };
}

/** Clés dont la valeur diffère entre deux versions (compare — ADR-0011). */
export function diffKeys(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changed: string[] = [];
  for (const key of keys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changed.push(key);
    }
  }
  return changed.sort();
}

import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase côté navigateur : clé anon uniquement, RLS active.
 * Les variables NEXT_PUBLIC_* sont les seules exposées (CLAUDE.md §5.1).
 */
export function createSupabaseBrowserClient(url: string, anonKey: string) {
  return createBrowserClient(url, anonKey);
}

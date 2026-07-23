import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@pedagoos/database";
import { publicEnv } from "@/lib/env";

/** Client Supabase serveur au nom de l'utilisateur courant (RLS active). */
export async function createClient() {
  const cookieStore = await cookies();
  return createSupabaseServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Appel depuis un Server Component : le middleware rafraîchit la
          // session, l'écriture de cookies y est déléguée.
        }
      },
    },
  );
}

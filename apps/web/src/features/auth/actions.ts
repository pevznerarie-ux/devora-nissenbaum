"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const signUpSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.email().transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(200),
});

/** Journalisation sûre : masque tout jeton JWT, tronque (CLAUDE.md §8). */
function sanitizeForLog(message: string): string {
  return message.replace(/eyJ[A-Za-z0-9._-]{10,}/g, "[masqué]").slice(0, 300);
}

export interface SignInState {
  error: string | null;
}

export interface SignUpState {
  error: string | null;
}

export async function signInAction(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "invalid" };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      // Message générique : ne jamais révéler si l'email existe.
      return { error: "invalid" };
    }
  } catch {
    return { error: "invalid" };
  }
  redirect("/");
}

/**
 * Inscription publique. Crée le compte via le client système (`email_confirm`
 * sans SMTP, comme l'acceptation d'invitation), puis connecte l'utilisateur.
 * Le trigger `handle_new_user` crée le profil (nom complet). L'organisation est
 * créée ensuite dans /administration (cas « connecté sans organisation »).
 */
export async function signUpAction(
  _prevState: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "signUpError" };
  }

  // Toute l'orchestration est protégée : une clé service_role manquante, une
  // base injoignable ou un schéma non migré doivent produire une erreur propre
  // (jamais d'exception brute vers le client — apps/web/CLAUDE.md). Le redirect
  // final reste hors du try (il fonctionne en levant une exception dédiée).
  try {
    const admin = createAdminClient();
    const { data: created, error } = await admin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: { full_name: parsed.data.fullName },
    });

    if (error || !created.user) {
      const status = (error as { status?: number } | null)?.status;
      const message = error?.message ?? "";
      const alreadyRegistered =
        status === 422 || /already|registered|exists/i.test(message);
      if (!alreadyRegistered) {
        // Vraie erreur (clé service_role invalide, schéma, base…) : journalisée
        // (sans secret) pour diagnostic, message générique côté client.
        console.error("[signup] création refusée:", sanitizeForLog(message));
        return { error: "signUpError" };
      }
      // Le compte existe déjà : on tentera de le connecter ci-dessous.
    }

    // Connexion : compte fraîchement créé, ou déjà existant si le mot de passe
    // fourni correspond. Sinon on oriente vers la page de connexion.
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (signInError) {
      return { error: "accountExists" };
    }
  } catch (caught) {
    console.error(
      "[signup] erreur inattendue:",
      sanitizeForLog(caught instanceof Error ? caught.message : String(caught)),
    );
    return { error: "signUpError" };
  }

  redirect("/administration");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

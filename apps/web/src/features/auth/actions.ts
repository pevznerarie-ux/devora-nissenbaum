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
      // Email déjà enregistré, ou création refusée : message générique.
      return { error: "accountExists" };
    }

    const supabase = await createClient();
    await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
  } catch {
    return { error: "signUpError" };
  }

  redirect("/administration");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

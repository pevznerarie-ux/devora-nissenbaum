import { NextResponse } from "next/server";
import { z } from "zod";
import { SIGNED_URL_MAX_AGE_SECONDS } from "@pedagoos/database";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Téléchargement d'un document source : l'accès est vérifié par la RLS
 * (lecture de la ligne avec le client utilisateur), puis une URL signée à
 * durée courte est émise côté serveur — jamais d'URL publique (privacy §3).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("source_documents")
    .select("file_path")
    .eq("id", id)
    .maybeSingle();
  if (!doc || doc.file_path === "pending") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data: signed, error } = await admin.storage
    .from("sources")
    .createSignedUrl(doc.file_path, SIGNED_URL_MAX_AGE_SECONDS);
  if (error || !signed) {
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
  return NextResponse.redirect(signed.signedUrl, 302);
}

"use server";

import { revalidatePath } from "next/cache";
import { AppError, toActionError, type ActionResult } from "@pedagoos/shared";
import { buildStoragePath } from "@pedagoos/database";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { MAX_SOURCE_FILE_SIZE, uploadSourceSchema } from "./schemas";
import { extractTextFromFile, isAllowedMimeType, sanitizeFileName } from "./extract";
import { chunkText } from "./chunk";

/**
 * Import d'un document source : métadonnées validées (Zod), insertion RLS
 * (client utilisateur), fichier dans le bucket privé `sources` (serveur),
 * extraction de texte synchrone (A-006) avec état persistant, chunks pour
 * les futures citations, audit. Les images restent `awaiting_ocr`.
 */
export async function uploadSourceAction(
  formData: FormData,
): Promise<ActionResult<{ documentId: string }>> {
  try {
    const parsed = uploadSourceSchema.safeParse({
      organizationId: formData.get("organizationId"),
      title: formData.get("title"),
      language: formData.get("language"),
      gradeLevel: formData.get("gradeLevel") ?? "",
      subjectId: formData.get("subjectId") ?? "",
      schoolId: formData.get("schoolId") ?? "",
      tags: formData.get("tags") ?? "",
    });
    const file = formData.get("file");
    if (!parsed.success || !(file instanceof File) || file.size === 0) {
      throw new AppError("validation_failed", "Entrée invalide.");
    }
    if (file.size > MAX_SOURCE_FILE_SIZE) {
      throw new AppError("validation_failed", "Fichier trop volumineux (max 20 Mo).");
    }
    if (!isAllowedMimeType(file.type)) {
      throw new AppError("validation_failed", "Type de fichier non pris en charge.");
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new AppError("unauthorized", "Session requise.");

    // Insertion d'abord : la politique RLS source_documents_insert est
    // l'autorisation effective (éducateur de l'organisation).
    const { data: doc, error: insertError } = await supabase
      .from("source_documents")
      .insert({
        organization_id: parsed.data.organizationId,
        school_id: parsed.data.schoolId ?? null,
        uploaded_by: user.id,
        title: parsed.data.title,
        subject_id: parsed.data.subjectId ?? null,
        grade_level: parsed.data.gradeLevel ?? null,
        language: parsed.data.language,
        tags: parsed.data.tags,
        file_path: "pending",
        mime_type: file.type,
        file_size: file.size,
        processing_status: "processing",
      })
      .select("id")
      .single();
    if (insertError || !doc) throw new AppError("forbidden", "Import refusé.");

    const admin = createAdminClient();
    const filePath = buildStoragePath(
      parsed.data.organizationId,
      doc.id,
      sanitizeFileName(file.name),
    );

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: storageError } = await admin.storage
      .from("sources")
      .upload(filePath, buffer, { contentType: file.type, upsert: false });
    if (storageError) {
      await admin
        .from("source_documents")
        .update({ processing_status: "failed", processing_error: "upload_error" })
        .eq("id", doc.id);
      throw new AppError("internal", "Téléversement impossible.");
    }

    const outcome = await extractTextFromFile(file.type, buffer);
    if (outcome.status === "ready") {
      const text = outcome.text.trim();
      await admin
        .from("source_documents")
        .update({
          file_path: filePath,
          processing_status: "ready",
          extracted_text: text,
        })
        .eq("id", doc.id);
      const chunks = chunkText(text);
      if (chunks.length > 0) {
        await admin.from("source_chunks").insert(
          chunks.map((content, index) => ({
            source_document_id: doc.id,
            organization_id: parsed.data.organizationId,
            chunk_index: index,
            content,
          })),
        );
      }
    } else {
      await admin
        .from("source_documents")
        .update({
          file_path: filePath,
          processing_status: outcome.status,
          processing_error: outcome.status === "failed" ? outcome.error : null,
        })
        .eq("id", doc.id);
    }

    await writeAuditLog({
      organizationId: parsed.data.organizationId,
      actorId: user.id,
      action: "source.upload",
      entityType: "source_document",
      entityId: doc.id,
      metadata: { mime: file.type, status: outcome.status },
    });
    revalidatePath("/bibliotheque");
    return { ok: true, data: { documentId: doc.id } };
  } catch (error) {
    return toActionError(error);
  }
}

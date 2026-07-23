import { createHash, randomBytes } from "node:crypto";

export const INVITATION_TTL_DAYS = 7;

/** Jeton opaque transmis dans le lien d'invitation (jamais stocké en clair). */
export function generateInvitationToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Seule l'empreinte est persistée (invitations.token_hash — privacy §4). */
export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

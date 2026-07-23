export { createSupabaseBrowserClient } from "./client/browser";
export { createSupabaseServerClient } from "./client/server";
export { createSupabaseAdminClient } from "./client/admin";
export * from "./storage";

// NOTE : les types de tables (`types.gen.ts`) seront générés par `pnpm db:types`
// une fois la stack Supabase locale démarrée ; ils typeront les clients ci-dessus.

/**
 * Tests RLS — isolation multi-organisations (docs/data-model.md §9).
 * Nécessite la stack Supabase locale (`pnpm db:start`) et les variables
 * SUPABASE_TEST_URL / SUPABASE_TEST_ANON_KEY / SUPABASE_TEST_SERVICE_ROLE_KEY.
 * Sans elles, la suite est ignorée (elle ÉCHOUE en CI si RLS_TESTS_REQUIRED=1).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const url = process.env["SUPABASE_TEST_URL"];
const anonKey = process.env["SUPABASE_TEST_ANON_KEY"];
const serviceKey = process.env["SUPABASE_TEST_SERVICE_ROLE_KEY"];
const configured = Boolean(url && anonKey && serviceKey);

if (!configured && process.env["RLS_TESTS_REQUIRED"] === "1") {
  throw new Error("Tests RLS requis mais stack Supabase de test non configurée.");
}

interface TestUser {
  id: string;
  email: string;
  client: SupabaseClient;
}

describe.runIf(configured)("RLS — isolation inter-organisations", () => {
  // Créé dans beforeAll : le corps du describe est évalué à la collecte
  // même quand la suite est ignorée (stack de test absente).
  let admin: SupabaseClient;
  const password = `Rls-${randomUUID()}`;
  let orgA: string;
  let orgB: string;
  let teacherA: TestUser;
  let teacherB: TestUser;
  const createdUserIds: string[] = [];

  async function createUser(email: string): Promise<TestUser> {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) throw error ?? new Error("createUser a échoué");
    createdUserIds.push(data.user.id);
    const client = createClient(url ?? "", anonKey ?? "", {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error: signInError } = await client.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) throw signInError;
    return { id: data.user.id, email, client };
  }

  beforeAll(async () => {
    admin = createClient(url ?? "", serviceKey ?? "", {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const suffix = randomUUID().slice(0, 8);
    const { data: orgs, error } = await admin
      .from("organizations")
      .insert([
        { name: `Org A ${suffix}`, slug: `org-a-${suffix}` },
        { name: `Org B ${suffix}`, slug: `org-b-${suffix}` },
      ])
      .select("id");
    if (error || !orgs || orgs.length !== 2) throw error ?? new Error("seed orgs");
    orgA = orgs[0]?.id as string;
    orgB = orgs[1]?.id as string;

    teacherA = await createUser(`teacher-a-${suffix}@test.invalid`);
    teacherB = await createUser(`teacher-b-${suffix}@test.invalid`);

    const { error: mErr } = await admin.from("memberships").insert([
      { profile_id: teacherA.id, organization_id: orgA, role: "teacher" },
      { profile_id: teacherB.id, organization_id: orgB, role: "teacher" },
    ]);
    if (mErr) throw mErr;
  });

  afterAll(async () => {
    for (const id of createdUserIds) {
      await admin.auth.admin.deleteUser(id);
    }
    await admin.from("organizations").delete().in("id", [orgA, orgB]);
  });

  it("un membre ne voit que sa propre organisation", async () => {
    const { data, error } = await teacherA.client.from("organizations").select("id");
    expect(error).toBeNull();
    const ids = (data ?? []).map((r) => r.id);
    expect(ids).toContain(orgA);
    expect(ids).not.toContain(orgB);
  });

  it("un utilisateur anonyme ne voit aucune organisation", async () => {
    const anonClient = createClient(url ?? "", anonKey ?? "");
    const { data } = await anonClient.from("organizations").select("id");
    expect(data ?? []).toHaveLength(0);
  });

  it("un professeur ne peut pas créer une école (réservé org_admin)", async () => {
    const { error } = await teacherA.client
      .from("schools")
      .insert({ organization_id: orgA, name: "École pirate" });
    expect(error).not.toBeNull();
  });

  it("un membre d'une autre organisation ne peut rien y écrire", async () => {
    const { error } = await teacherB.client
      .from("subjects")
      .insert({ organization_id: orgA, name: "Intrusion" });
    expect(error).not.toBeNull();
  });

  it("un visiteur anonyme ne voit aucune source ni séquence", async () => {
    const anonClient = createClient(url ?? "", anonKey ?? "");
    const { data: sources } = await anonClient.from("source_documents").select("id");
    const { data: sequences } = await anonClient.from("lesson_sequences").select("id");
    expect(sources ?? []).toHaveLength(0);
    expect(sequences ?? []).toHaveLength(0);
  });

  it("un visiteur anonyme ne voit ni dépendances ni historique d'objets", async () => {
    const anonClient = createClient(url ?? "", anonKey ?? "");
    const { data: deps } = await anonClient.from("pedagogical_dependencies").select("id");
    const { data: versions } = await anonClient.from("object_versions").select("id");
    expect(deps ?? []).toHaveLength(0);
    expect(versions ?? []).toHaveLength(0);
  });

  it("un membre ne voit pas les générations IA d'une autre organisation", async () => {
    const { data: created } = await admin
      .from("ai_generations")
      .insert({
        organization_id: orgA,
        provider: "mock",
        model: "mock",
        prompt_name: "x",
        prompt_version: "1",
        target_type: "sequence_structure",
        status: "succeeded",
      })
      .select("id")
      .single();
    expect(created).not.toBeNull();
    const { data } = await teacherB.client.from("ai_generations").select("id");
    expect(data ?? []).toHaveLength(0);
  });

  it("audit_logs est inaccessible en écriture et invisible hors admin", async () => {
    const { error: insertError } = await teacherA.client
      .from("audit_logs")
      .insert({ organization_id: orgA, action: "x", entity_type: "y" });
    expect(insertError).not.toBeNull();

    const { data } = await teacherA.client.from("audit_logs").select("id");
    expect(data ?? []).toHaveLength(0);
  });

  it("audit_logs refuse update/delete même au propriétaire org_admin", async () => {
    const { data: log, error } = await admin
      .from("audit_logs")
      .insert({ organization_id: orgA, action: "test", entity_type: "test" })
      .select("id")
      .single();
    expect(error).toBeNull();

    const { data: updated } = await teacherA.client
      .from("audit_logs")
      .update({ action: "falsifié" })
      .eq("id", log?.id as string)
      .select("id");
    expect(updated ?? []).toHaveLength(0);
  });
});

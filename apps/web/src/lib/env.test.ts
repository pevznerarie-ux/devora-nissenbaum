import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `publicEnv` est évalué à l'import du module : on réinitialise le cache de
 * modules et on réimporte pour chaque scénario d'environnement.
 */
async function loadPublicEnv(url: string | undefined, anon: string | undefined) {
  vi.resetModules();
  if (url === undefined) vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  else vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", url);
  if (anon === undefined) vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
  else vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", anon);
  const mod = await import("./env");
  return mod.publicEnv;
}

describe("publicEnv", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("retombe sur les défauts locaux quand les variables sont vides", async () => {
    const env = await loadPublicEnv("", "");
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("http://127.0.0.1:54321");
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("local-dev-anon-key");
  });

  it("traite une valeur en espaces comme non fournie (pas de crash de build)", async () => {
    const env = await loadPublicEnv("   ", "  ");
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("http://127.0.0.1:54321");
  });

  it("nettoie les espaces autour d'une valeur valide", async () => {
    const env = await loadPublicEnv("  https://abc.supabase.co  ", "  anon-key  ");
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://abc.supabase.co");
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("anon-key");
  });

  it("conserve une URL valide", async () => {
    const env = await loadPublicEnv("https://project.supabase.co", "real-anon-key");
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://project.supabase.co");
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("real-anon-key");
  });

  it("rejette une URL réellement malformée", async () => {
    await expect(loadPublicEnv("pas-une-url", "anon")).rejects.toThrow();
  });
});

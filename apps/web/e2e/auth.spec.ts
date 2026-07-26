import { expect, test } from "@playwright/test";

test("la page de connexion affiche le formulaire", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Connexion");
  await expect(page.getByLabel("Adresse email")).toBeVisible();
  await expect(page.getByLabel("Mot de passe")).toBeVisible();
  await expect(page.getByRole("button", { name: "Se connecter" })).toBeEnabled();
});

test("la page de creation de compte affiche le formulaire", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Créer un compte");
  await expect(page.getByLabel("Nom complet")).toBeVisible();
  await expect(page.getByLabel("Adresse email")).toBeVisible();
  await expect(page.getByLabel("Mot de passe")).toBeVisible();
  await expect(page.getByRole("button", { name: "Créer mon compte" })).toBeEnabled();
});

test("l'accueil reste accessible sans connexion", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

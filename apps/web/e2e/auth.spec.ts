import { expect, test } from "@playwright/test";

test("la page de connexion se rend avec le formulaire accessible", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Connexion");
  await expect(page.getByLabel("Adresse email")).toBeVisible();
  await expect(page.getByLabel("Mot de passe")).toBeVisible();
  await expect(page.getByRole("button", { name: "Se connecter" })).toBeEnabled();
});

test("une route protégée redirige un visiteur non connecté vers /login", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForURL("**/login");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Connexion");
});

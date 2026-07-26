import { expect, test } from "@playwright/test";

test("la page de connexion redirige vers l'accueil", async ({ page }) => {
  await page.goto("/login");
  await page.waitForURL("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("l'accueil reste accessible sans connexion", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

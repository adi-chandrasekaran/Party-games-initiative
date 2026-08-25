import { expect, test } from "@playwright/test";
import { Buffer } from "node:buffer";

test("the explicitly enabled local preview link enters Forge with an admin session", async ({ page }) => {
  await page.goto("/?dev-auth=1&workspace=arcade");

  await expect(page.getByRole("heading", { name: "ARCADE" })).toBeVisible();

  const bootstrap = await page.request.get("/api/bootstrap");
  await expect(bootstrap).toBeOK();
  expect(await bootstrap.json()).toMatchObject({ user: { email: "local-preview@aischennai.org", role: "admin" } });
  const admin = await page.request.get("/api/platform/admin/users");
  await expect(admin).toBeOK();
});

test("decks stay in the library until a compatible Arcade game chooses one, then delete clears it", async ({ page }) => {
  const deckTitle = `Scoped deck ${Date.now()}`;
  await page.goto("/?dev-auth=1&workspace=arcade");

  await expect(page.locator(".selectedDeckBanner")).toHaveCount(0);
  await page.locator(".workspaceSidebar").getByRole("button", { name: "Decks", exact: true }).click();
  await page.locator(".workspaceDecks .deckNameInput").fill(deckTitle);
  await page.locator(".workspaceDecks input[type=file]").setInputFiles({ name: "scoped.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.7\nscoped deck") });
  await page.locator(".workspaceDecks").getByRole("button", { name: "Upload deck" }).click();
  await expect(page.getByText(deckTitle, { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Back to Arcade" }).click();
  await expect(page.locator(".selectedDeckBanner")).toHaveCount(0);
  await page.getByRole("button", { name: "FLASHCARDS" }).click();
  const gameDeckLibrary = page.locator(".gameDeckLibrary");
  await expect(gameDeckLibrary).toBeVisible();
  const gameDeckSelect = gameDeckLibrary.locator("select");
  await gameDeckSelect.selectOption({ label: deckTitle });
  await expect(gameDeckSelect).toHaveValue(/.+/);

  await page.getByRole("button", { name: "Back to Arcade" }).click();
  await page.locator(".workspaceSidebar").getByRole("button", { name: "Decks", exact: true }).click();
  await page.getByRole("button", { name: `Remove ${deckTitle}` }).click();
  await expect(page.getByText(deckTitle, { exact: true })).toHaveCount(0);
  await expect(page.locator(".selectedDeckBanner")).toHaveCount(0);
});

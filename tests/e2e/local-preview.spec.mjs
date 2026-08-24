import { expect, test } from "@playwright/test";

test("the explicitly enabled local preview link enters Forge with an admin session", async ({ page }) => {
  await page.goto("/?dev-auth=1&workspace=arcade");

  await expect(page.getByRole("heading", { name: "ARCADE" })).toBeVisible();

  const bootstrap = await page.request.get("/api/bootstrap");
  await expect(bootstrap).toBeOK();
  expect(await bootstrap.json()).toMatchObject({ user: { email: "local-preview@aischennai.org", role: "admin" } });
  const admin = await page.request.get("/api/platform/admin/users");
  await expect(admin).toBeOK();
});

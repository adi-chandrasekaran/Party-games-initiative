import { expect, test } from "@playwright/test";

const views = [
  ["Forge home", "forge-home"],
  ["Profile", "profile"],
  ["Arcade", "arcade"],
  ["Planner", "planner"],
  ["Clubs", "clubs"],
  ["Classes", "classes"],
  ["Requests", "requests"],
];

async function signUp(page) {
  const suffix = `visual-${Date.now()}-${Math.floor(Math.random() * 100_000)}`;
  await page.goto("/?workspace=arcade");
  await page.getByRole("button", { name: "Need a new account? Sign up" }).click();
  await page.getByLabel("Name", { exact: true }).fill("Visual Test");
  await page.getByLabel("Username", { exact: true }).fill(`visual_${suffix}`);
  await page.getByLabel("Email", { exact: true }).fill(`visual-${suffix}@aischennai.org`);
  await page.getByLabel("Password", { exact: true }).fill("not-a-production-password");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "ARCADE", exact: true })).toBeVisible();
}

for (const [viewportName, viewport] of [["desktop", { width: 1440, height: 900 }], ["narrow", { width: 390, height: 844 }]]) {
  for (const theme of ["dark", "light"]) {
    test(`Figma shell ${viewportName} ${theme}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await signUp(page);
      if (theme === "light") await page.getByRole("button", { name: "Toggle theme" }).click();

      for (const [label, snapshot] of views) {
        await page.locator(".forgeSidebar").getByRole("button", { name: label, exact: true }).click();
        await expect(page).toHaveScreenshot(`${viewportName}-${theme}-${snapshot}.png`, {
          fullPage: true,
          mask: snapshot === "profile"
            ? [page.locator(".profileSummaryCard"), page.locator(".profileDetailsCard"), page.locator(".profileStatsCard")]
            : [],
        });
      }
    });
  }
}

test("Figma rail and theme control are keyboard accessible", async ({ page }) => {
  await signUp(page);
  const rail = page.locator(".forgeSidebar");
  await rail.getByRole("button", { name: "Planner", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "PLANNER", exact: true })).toBeVisible();
  await rail.getByRole("button", { name: "Toggle theme" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-forge-theme", "light");
});

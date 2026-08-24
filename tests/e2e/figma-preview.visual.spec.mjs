import { expect, test } from "@playwright/test";

const viewports = [
  ["desktop", { width: 1440, height: 900 }],
  ["narrow", { width: 390, height: 844 }],
];

for (const [name, viewport] of viewports) {
  test(`Figma preview ${name} dark`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/?dev-auth=1&workspace=arcade");
    await expect(page.locator("html")).toHaveAttribute("data-forge-preview", "figma");
    await expect(page.getByRole("heading", { name: "ARCADE" })).toBeVisible();
    await expect(page).toHaveScreenshot(`${name}-dark-arcade.png`, { fullPage: true, maxDiffPixels: 150 });
  });

  test(`Figma preview ${name} light`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/?dev-auth=1&workspace=arcade");
    await page.getByRole("button", { name: "Toggle theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-forge-theme", "light");
    await expect(page).toHaveScreenshot(`${name}-light-arcade.png`, { fullPage: true, maxDiffPixels: 150 });
  });
}

test("normal application URL does not enable the preview visual attribute", async ({ page }) => {
  await page.goto("/?workspace=arcade");
  await expect(page.locator("html")).not.toHaveAttribute("data-forge-preview", "figma");
});

test("preview navigation retains the explicit preview query", async ({ page }) => {
  await page.goto("/?dev-auth=1&workspace=arcade");
  await page.locator(".forgeSidebar").getByRole("button", { name: "Planner", exact: true }).click();
  await expect(page).toHaveURL(/dev-auth=1/);
  await expect(page.locator("html")).toHaveAttribute("data-forge-preview", "figma");
});

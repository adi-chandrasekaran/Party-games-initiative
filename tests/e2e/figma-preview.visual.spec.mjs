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

test("preview keeps its visual boundary across all six Arcade game launches", async ({ page }) => {
  await page.goto("/?dev-auth=1&workspace=arcade");
  await expect(page.getByRole("button", { name: "IMPOSTER" })).toBeVisible();

  for (const title of ["IMPOSTER", "QUIZ SHOOTER", "BUILD A BEAST"]) {
    await page.getByRole("button", { name: title }).click();
    const frame = page.locator(".sameOriginMicroappFrame");
    await expect(frame).toHaveAttribute("src", /dev-auth=1/);
    await expect(frame.contentFrame().locator("html")).toHaveAttribute("data-forge-preview", "figma");
    await page.getByRole("button", { name: "Back to Arcade" }).click();
  }

  for (const title of ["FLASHCARDS", "QUIZ BOWL", "WORD MATCH"]) {
    await page.getByRole("button", { name: title }).click();
    await expect(page.locator("html")).toHaveAttribute("data-forge-preview", "figma");
    await expect(page.getByRole("button", { name: "Back to Arcade" })).toBeVisible();
    await page.getByRole("button", { name: "Back to Arcade" }).click();
  }
});

test("preview keeps its visual boundary across all four Planner app launches", async ({ page }) => {
  await page.goto("/?dev-auth=1&workspace=planner");
  await expect(page.getByRole("button", { name: "HABIT TRACKER" })).toBeVisible();

  for (const title of ["HABIT TRACKER", "TO-DO BOARD", "TIMER", "ASSIGNMENTS"]) {
    await page.getByRole("button", { name: title }).click();
    const frame = page.locator(".sameOriginMicroappFrame");
    await expect(frame).toHaveAttribute("src", /dev-auth=1/);
    await expect(frame.contentFrame().locator("html")).toHaveAttribute("data-forge-preview", "figma");
    await page.getByRole("button", { name: "Back to Planner" }).click();
  }
});

test("preview styles the remaining Forge navigation without changing its boundary", async ({ page }) => {
  await page.goto("/?dev-auth=1&workspace=arcade");
  const rail = page.locator(".forgeSidebar");
  for (const label of ["Profile", "Clubs", "Classes", "Requests"]) {
    await rail.getByRole("button", { name: label, exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-forge-preview", "figma");
  }
});

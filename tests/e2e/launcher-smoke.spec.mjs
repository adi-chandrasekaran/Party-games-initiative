import { expect, test } from "@playwright/test";

const externalLaunchers = [
  ["arcade", "QUIZ SHOOTER", "http://localhost:5173/"],
  ["arcade", "BUILD A BEAST", "http://localhost:5174/"],
];

const sameOriginLaunchers = [
  ["arcade", "IMPOSTER", "/arcade/imposter", "Imposter Who"],
  ["planner", "HABIT TRACKER", "/planner/habit-tracker", "Habit Tracker"],
  ["planner", "TO-DO BOARD", "/planner/todo-board", "To-Do Board"],
  ["planner", "TIMER", "/planner/timer", "Timer"],
  ["planner", "ASSIGNMENTS", "/planner/assignments", "Assignments"],
];

const internalArcadeLaunchers = ["FLASHCARDS", "QUIZ BOWL", "WORD MATCH"];

async function signUpForSmokeTest(page, workspace) {
  const suffix = `${workspace}-${Date.now()}-${Math.floor(Math.random() * 100_000)}`;

  await page.goto(`/?workspace=${workspace}`);
  await expect(page.getByRole("heading", { name: "Sign in with Google" })).toBeVisible();
  await page.getByRole("button", { name: "Need a new account? Sign up" }).click();
  await page.getByLabel("Name", { exact: true }).fill("PR-01 Smoke Test");
  await page.getByLabel("Username", { exact: true }).fill(`pr01_${suffix}`);
  await page.getByLabel("Email", { exact: true }).fill(`pr01-${suffix}@aischennai.org`);
  await page.getByLabel("Password", { exact: true }).fill("not-a-production-password");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: workspace === "planner" ? "PLANNER" : "ARCADE", exact: true })).toBeVisible();
}

test("hub loads its local authentication gate", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sign in with Google" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Need a new account? Sign up" })).toBeVisible();
});

for (const [workspace, title, target] of externalLaunchers) {
  test(`${title} preserves its documented legacy launcher behavior`, async ({ page }) => {
    await signUpForSmokeTest(page, workspace);
    await page.getByRole("button", { name: title }).click();
    await expect(page).toHaveURL(target);
  });
}

for (const [workspace, title, route, frameHeading] of sameOriginLaunchers) {
  test(`${title} opens through its same-origin shell route`, async ({ page }) => {
    await signUpForSmokeTest(page, workspace);
    await page.getByRole("button", { name: title }).click();
    await expect(page).toHaveURL(new RegExp(`${route}$`));
    await expect(page.locator(".sameOriginMicroappFrame")).toHaveAttribute("src", /\/microapps\//);
    await expect(page.frameLocator(".sameOriginMicroappFrame").getByRole("heading", { name: frameHeading, exact: true })).toBeVisible();
  });
}

for (const title of internalArcadeLaunchers) {
  test(`${title} opens its current in-shell game view`, async ({ page }) => {
    await signUpForSmokeTest(page, "arcade");
    await page.getByRole("button", { name: title }).click();
    await expect(page.getByRole("button", { name: "Back to Arcade" })).toBeVisible();
  });
}

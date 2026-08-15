import { expect, test } from "@playwright/test";

async function signUp(page, workspace) {
  const suffix = `${workspace}-${Date.now()}-${Math.floor(Math.random() * 100_000)}`;
  await page.goto(`/?workspace=${workspace}`);
  await page.getByRole("button", { name: "Need a new account? Sign up" }).click();
  await page.getByLabel("Name", { exact: true }).fill("PR-05 Test");
  await page.getByLabel("Username", { exact: true }).fill(`pr05_${suffix}`);
  await page.getByLabel("Email", { exact: true }).fill(`pr05-${suffix}@aischennai.org`);
  await page.getByLabel("Password", { exact: true }).fill("not-a-production-password");
  await page.getByRole("button", { name: "Create account" }).click();
}

async function openMicroapp(page, workspace, title) {
  await signUp(page, workspace);
  await page.getByRole("button", { name: title }).click();
  return page.frameLocator(".sameOriginMicroappFrame");
}

test("Imposter starts a manual-word round under the shell origin", async ({ page }) => {
  const frame = await openMicroapp(page, "arcade", "IMPOSTER");
  await frame.locator("#word").fill("Orbit");
  await frame.getByRole("button", { name: "Next" }).click();
  await expect(frame.getByRole("heading", { name: "Enter Players", exact: true })).toBeVisible();
});

test("Habit Tracker adds a habit under the shell origin", async ({ page }) => {
  const frame = await openMicroapp(page, "planner", "HABIT TRACKER");
  await frame.locator("#habitName").fill("Read");
  await frame.locator("#addHabit").click();
  await expect(frame.getByText("Read", { exact: true })).toBeVisible();
});

test("To-do Board adds a task under the shell origin", async ({ page }) => {
  const frame = await openMicroapp(page, "planner", "TO-DO BOARD");
  await frame.locator("#taskTitle").fill("Finish lab notes");
  await frame.locator("#addTask").click();
  await expect(frame.getByText("Finish lab notes", { exact: true })).toBeVisible();
});

test("Timer opens a selected preset under the shell origin", async ({ page }) => {
  const frame = await openMicroapp(page, "planner", "TIMER");
  await frame.locator('[data-preset="25"]').click();
  await expect(frame.getByRole("heading", { name: "25 minute timer", exact: true })).toBeVisible();
});

test("Assignments adds a spreadsheet row under the shell origin", async ({ page }) => {
  const frame = await openMicroapp(page, "planner", "ASSIGNMENTS");
  await frame.locator("#subject").fill("Math");
  await frame.locator("#assignment").fill("Worksheet");
  await frame.locator("#addRow").click();
  await expect(frame.getByText("Worksheet", { exact: true })).toBeVisible();
});

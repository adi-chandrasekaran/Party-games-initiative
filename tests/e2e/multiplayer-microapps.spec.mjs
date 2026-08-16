import { expect, test } from "@playwright/test";

async function signUp(page, username) {
  await page.goto("/?workspace=arcade");
  await page.getByRole("button", { name: "Need a new account? Sign up" }).click();
  await page.getByLabel("Name", { exact: true }).fill(username);
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page.getByLabel("Email", { exact: true }).fill(`${username}@aischennai.org`);
  await page.getByLabel("Password", { exact: true }).fill("not-a-production-password");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "ARCADE", exact: true })).toBeVisible();
}

async function openGame(page, title) {
  await page.getByRole("button", { name: title }).click();
  await expect(page.locator(".sameOriginMicroappFrame")).toBeVisible();
  return page.frameLocator(".sameOriginMicroappFrame");
}

async function createPlayers(browser, prefix) {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;
  const hostContext = await browser.newContext();
  const playerContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const playerPage = await playerContext.newPage();
  await signUp(hostPage, `${prefix}_host_${suffix}`);
  await signUp(playerPage, `${prefix}_player_${suffix}`);
  return { hostContext, playerContext, hostPage, playerPage };
}

test("Quiz Shooter hosts and joins a room through the hub origin", async ({ browser }) => {
  const players = await createPlayers(browser, "quiz");
  try {
    const host = await openGame(players.hostPage, "QUIZ SHOOTER");
    await host.getByPlaceholder("AISC username").fill("Quiz host");
    await host.getByRole("button", { name: "Host Game" }).click();
    await expect(host.getByRole("heading", { name: "Host Room", exact: true })).toBeVisible();
    const roomCode = await host.locator(".room-code").textContent();

    const player = await openGame(players.playerPage, "QUIZ SHOOTER");
    await player.getByPlaceholder("AISC username").fill("Quiz player");
    await player.getByPlaceholder("Room code").fill(roomCode ?? "");
    await player.getByRole("button", { name: "Join as Player" }).click();
    await expect(player.getByRole("heading", { name: "Waiting for Host", exact: true })).toBeVisible();
  } finally {
    await players.hostContext.close();
    await players.playerContext.close();
  }
});

test("Build-a-Beast hosts and joins a room through the hub origin", async ({ browser }) => {
  const players = await createPlayers(browser, "beast");
  try {
    const host = await openGame(players.hostPage, "BUILD A BEAST");
    await host.getByPlaceholder("AISC username").fill("Beast host");
    await host.getByRole("button", { name: "Host Game" }).click();
    const roomCode = await host.locator(".room-code-small").textContent();
    await expect(host.getByRole("button", { name: "Start Build Phase" })).toBeVisible();

    const player = await openGame(players.playerPage, "BUILD A BEAST");
    await player.getByPlaceholder("AISC username").fill("Beast player");
    await player.getByPlaceholder("Room code").fill(roomCode ?? "");
    await player.getByRole("button", { name: "Join as Player" }).click();
    await expect(player.getByRole("heading", { name: "Waiting for host...", exact: true })).toBeVisible();
  } finally {
    await players.hostContext.close();
    await players.playerContext.close();
  }
});

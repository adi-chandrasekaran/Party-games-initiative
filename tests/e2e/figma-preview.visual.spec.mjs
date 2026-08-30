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
  await expect(page.locator(".launchCardButton")).toHaveCount(6);

  for (const title of ["IMPOSTER", "QUIZ SHOOTER", "BUILD A BEAST"]) {
    await page.getByRole("button", { name: title }).click();
    const frame = page.locator(".sameOriginMicroappFrame");
    await expect(frame).toHaveAttribute("src", /dev-auth=1/);
    await expect(frame.contentFrame().locator("html")).toHaveAttribute("data-forge-preview", "figma");
    await expect(frame.contentFrame().locator(".backButton")).toBeHidden();
    await expect(frame.contentFrame().locator(".partyBackBtn, .party-back-button")).toBeHidden();
    await expect(page.locator(".gameDeckLibrary")).toBeVisible();
    await page.getByRole("button", { name: "Back to Arcade" }).click();
  }

  for (const title of ["FLASHCARDS", "QUIZ BOWL", "WORD MATCH"]) {
    await page.getByRole("button", { name: title }).click();
    await expect(page.locator("html")).toHaveAttribute("data-forge-preview", "figma");
    await expect(page.getByRole("button", { name: "Back to Arcade" })).toBeVisible();
    await expect(page.locator(".gameDeckLibrary")).toBeVisible();
    await page.getByRole("button", { name: "Back to Arcade" }).click();
  }
});

test("preview launcher cards have one contained action and uniform icons", async ({ page }) => {
  await page.goto("/?dev-auth=1&workspace=arcade");
  const cards = page.locator(".launchCardButton");
  await expect(cards).toHaveCount(6);
  await expect(cards.locator(".launchCardCta")).toHaveCount(6);

  const measurements = await cards.evaluateAll((nodes) => nodes.map((node) => {
    const frame = node.querySelector(".launchCardFrame").getBoundingClientRect();
    const icon = node.querySelector(".launchCardIcon").getBoundingClientRect();
    const title = node.querySelector(".launchCardTitle").getBoundingClientRect();
    const pseudo = node.ownerDocument.defaultView.getComputedStyle(node, "::after");
    const button = node.ownerDocument.defaultView.getComputedStyle(node);
    return {
      buttonWidth: node.getBoundingClientRect().width,
      buttonHeight: node.getBoundingClientRect().height,
      frameWidth: frame.width,
      frameHeight: frame.height,
      iconWidth: icon.width,
      iconHeight: icon.height,
      iconFits: icon.right <= frame.right && icon.bottom <= title.top,
      pseudoHidden: pseudo.display === "none" || pseudo.content === "none",
      wrapperIsFlat: button.backgroundColor === "rgba(0, 0, 0, 0)" && button.borderTopWidth === "0px",
    };
  }));

  expect(measurements.every((card) => card.frameWidth === 190 && card.frameHeight === 190)).toBe(true);
  expect(measurements.every((card) => card.buttonWidth === card.frameWidth && card.buttonHeight === card.frameHeight)).toBe(true);
  expect(measurements.every((card) => card.iconWidth === 40 && card.iconHeight === 40 && card.iconFits)).toBe(true);
  expect(measurements.every((card) => card.pseudoHidden && card.wrapperIsFlat)).toBe(true);
});

test("preview uses a six-card Arcade row, centered requests, and one shell back action", async ({ page }) => {
  await page.goto("/?dev-auth=1&workspace=arcade");
  const cards = page.locator(".launchCardButton");
  await expect(cards).toHaveCount(6);
  const cardTops = await cards.evaluateAll((nodes) => nodes.map((node) => Math.round(node.getBoundingClientRect().top)));
  expect(new Set(cardTops).size).toBe(1);

  await page.getByRole("button", { name: "IMPOSTER" }).click();
  const frame = page.locator(".sameOriginMicroappFrame");
  await expect(frame.contentFrame().locator(".backButton")).toBeHidden();
  await expect(page.getByRole("button", { name: "Back to Arcade" })).toHaveCount(1);
  const frameFillsShell = await page.locator(".sameOriginMicroapp").evaluate((shell) => {
    const frameRect = shell.querySelector(".sameOriginMicroappFrame").getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    return Math.abs(shellRect.bottom - frameRect.bottom) <= 1 && frameRect.height > 0;
  });
  expect(frameFillsShell).toBe(true);

  await page.goto("/?dev-auth=1");
  await page.locator(".forgeSidebar").getByRole("button", { name: "Requests", exact: true }).click();
  await expect(page.locator(".requestOnlyPanel .workspaceHero")).toHaveCSS("text-align", "center");
  await expect(page.locator(".requestOnlyPanel .workspaceHero h2")).toHaveCSS("font-size", "16px");
});

test("preview hides the duplicate Forge link in all three embedded multiplayer games", async ({ page }) => {
  await page.goto("/?dev-auth=1&workspace=arcade");
  for (const title of ["IMPOSTER", "QUIZ SHOOTER", "BUILD A BEAST"]) {
    await page.getByRole("button", { name: title }).click();
    const frame = page.locator(".sameOriginMicroappFrame");
    await expect(frame.contentFrame().locator(".partyBackBtn, .party-back-button")).toBeHidden();
    await expect(page.getByRole("button", { name: "Back to Arcade" })).toHaveCount(1);
    await page.getByRole("button", { name: "Back to Arcade" }).click();
  }
});

test("preview keeps multiplayer deck controls inside a compact drawer and scrolls game pages", async ({ page }) => {
  await page.goto("/?dev-auth=1&workspace=arcade");

  for (const title of ["IMPOSTER", "QUIZ SHOOTER", "BUILD A BEAST"]) {
    await page.getByRole("button", { name: title }).click();

    const canvas = page.locator(".sameOriginMicroappCanvas");
    const drawer = canvas.locator("details.gameDeckLibraryCompact");
    await expect(drawer).toBeVisible();
    await expect(drawer).not.toHaveAttribute("open", "");
    await drawer.locator("summary").click();
    await expect(drawer).toHaveAttribute("open", "");
    await expect(drawer.locator("select")).toBeVisible();

    const scrollsWhenContentOverflows = await page.locator(".workspaceStage").evaluate((stage) => {
      const originalHeight = stage.style.minHeight;
      const canvas = stage.querySelector(".sameOriginMicroappCanvas");
      if (!canvas) return false;
      canvas.style.minHeight = "1400px";
      const overflowY = window.getComputedStyle(stage).overflowY;
      stage.scrollTop = 200;
      const result = ["auto", "scroll"].includes(overflowY) && stage.scrollTop > 0;
      canvas.style.minHeight = originalHeight;
      return result;
    });
    expect(scrollsWhenContentOverflows).toBe(true);

    await page.getByRole("button", { name: "Back to Arcade" }).click();
  }
});

test("preview light mode uses readable surfaces and text across Forge pages", async ({ page }) => {
  const turnOnLightTheme = async () => {
    await expect(page.locator(".forgeSidebar")).toBeVisible();
    if (await page.locator("html").getAttribute("data-forge-theme") !== "light") {
      await page.getByRole("button", { name: "Toggle theme" }).click();
    }
    await expect(page.locator("html")).toHaveAttribute("data-forge-theme", "light");
  };

  await page.goto("/?dev-auth=1");
  await turnOnLightTheme();
  await page.getByRole("button", { name: "Forge home" }).click();
  await expect(page.locator(".forgeMain")).toHaveCSS("background-color", "rgb(247, 248, 251)");
  await expect(page.locator(".forgeHomeCard").first()).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(page.locator(".forgeHomeCard strong").first()).toHaveCSS("color", "rgb(17, 24, 39)");

  await page.goto("/?dev-auth=1&workspace=arcade");
  await turnOnLightTheme();
  await expect(page.locator(".workspaceStage")).toHaveCSS("background-color", "rgb(248, 250, 252)");
  await expect(page.locator(".launchCardTitle").first()).toHaveCSS("color", "rgb(17, 24, 39)");

  await page.goto("/?dev-auth=1");
  await turnOnLightTheme();
  const rail = page.locator(".forgeSidebar");
  await rail.getByRole("button", { name: "Clubs", exact: true }).click();
  await expect(page.locator(".communityCard").first()).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(page.locator(".communityCardTop strong").first()).toHaveCSS("color", "rgb(17, 24, 39)");
  await rail.getByRole("button", { name: "Requests", exact: true }).click();
  await expect(page.locator(".requestOnlyPanel")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(page.getByLabel("Send feedback")).toHaveCSS("color", "rgb(17, 24, 39)");
});

test("preview keeps its visual boundary across all four Planner app launches", async ({ page }) => {
  await page.goto("/?dev-auth=1&workspace=planner");
  await expect(page.getByRole("button", { name: "HABIT TRACKER" })).toBeVisible();

  for (const title of ["HABIT TRACKER", "TO-DO BOARD", "TIMER", "ASSIGNMENTS"]) {
    await page.getByRole("button", { name: title }).click();
    const frame = page.locator(".sameOriginMicroappFrame");
    await expect(frame).toHaveAttribute("src", /dev-auth=1/);
    await expect(frame.contentFrame().locator("html")).toHaveAttribute("data-forge-preview", "figma");
    await expect(frame.contentFrame().locator(".backButton")).toBeHidden();
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

test("preview renders Clubs and Classes as compact Figma card grids", async ({ page }) => {
  await page.goto("/?dev-auth=1&workspace=arcade");
  const rail = page.locator(".forgeSidebar");
  for (const label of ["Clubs", "Classes"]) {
    await rail.getByRole("button", { name: label, exact: true }).click();
    await expect(page.locator(".communityGrid")).toBeVisible();
    await expect(page.locator(".communityCard")).toHaveCount(3);
    await expect(page.locator("html")).toHaveAttribute("data-forge-preview", "figma");
  }
});

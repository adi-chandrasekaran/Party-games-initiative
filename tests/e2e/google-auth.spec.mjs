import { expect, test } from "@playwright/test";

async function googleAuth(request, credential, role = "member") {
  return request.post("/api/auth/google", { data: { credential, role } });
}

test("Google fixture student receives a server session and can log out", async ({ page }) => {
  await page.goto("/");
  const response = await googleAuth(page.request, "member");
  await expect(response).toBeOK();
  expect(await response.json()).toMatchObject({ user: { email: "member@aischennai.org", role: "student" } });

  const logout = await page.request.post("/api/logout", { data: {} });
  await expect(logout).toBeOK();
});

test("Google fixture bootstrap account receives the admin role", async ({ page }) => {
  await page.goto("/");
  const response = await googleAuth(page.request, "owner", "owner");
  await expect(response).toBeOK();
  expect(await response.json()).toMatchObject({ user: { email: "caditi28@aischennai.org", role: "admin" } });
});

test("Google fixture rejects an expired credential", async ({ page }) => {
  await page.goto("/");
  const response = await googleAuth(page.request, "expired");
  expect(response.status()).toBe(401);
  expect(await response.json()).toMatchObject({ error: "Google sign-in credential has expired." });
});

test("Google fixture rejects a non-AISC identity", async ({ page }) => {
  await page.goto("/");
  const response = await googleAuth(page.request, "rejectedDomain");
  expect(response.status()).toBe(401);
  expect(await response.json()).toMatchObject({ error: "Only @aischennai.org accounts can access The Forge." });
});

test("Google fixture session expires on the server", async ({ page }) => {
  await page.goto("/");
  const signIn = await googleAuth(page.request, "expiredSession");
  await expect(signIn).toBeOK();
  const bootstrap = await page.request.get("/api/bootstrap");
  await expect(bootstrap).toBeOK();
  expect(await bootstrap.json()).toMatchObject({ user: null });
});

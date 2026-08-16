import { defineConfig } from "@playwright/test";
import { tmpdir } from "node:os";
import { join } from "node:path";

const smokeStore = join(tmpdir(), `party-games-pr-01-playwright-${process.pid}.json`);
const postgresUrl = "postgresql://forge:forge-local-password@127.0.0.1:5432/forge";
const hubPort = Number(process.env.PLAYWRIGHT_HUB_PORT || 5176);
const platformPort = Number(process.env.PLAYWRIGHT_PLATFORM_PORT || 8787);
const platformUrl = `http://localhost:${platformPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  workers: 1,
  use: {
    baseURL: `http://localhost:${hubPort}`,
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "pnpm --dir apps/hub run dev",
      url: `http://localhost:${hubPort}`,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: {
        ...process.env,
        NODE_ENV: "test",
        GOOGLE_CLIENT_ID: "forge-playwright-client",
        VITE_GOOGLE_CLIENT_ID: "forge-playwright-client",
        AUTH_TEST_GOOGLE_FIXTURES: JSON.stringify({
          member: { email: "member@aischennai.org", name: "Playwright Member", picture: "", googleSub: "member-fixture" },
          owner: { email: "caditi28@aischennai.org", name: "Playwright Owner", picture: "", googleSub: "owner-fixture" },
          expired: { error: "Google sign-in credential has expired." },
          rejectedDomain: { error: "Only @aischennai.org accounts can access The Forge." },
          expiredSession: { email: "expired-session@aischennai.org", name: "Expired Session", picture: "", googleSub: "expired-session-fixture", sessionTtlMs: 0 },
        }),
        HUB_DATA_FILE: smokeStore,
        DATABASE_URL: postgresUrl,
        VITE_PLATFORM_API_URL: platformUrl,
        PLATFORM_PROXY_URL: platformUrl,
        HUB_PORT: String(hubPort),
      },
    },
    {
      command: "pnpm --dir apps/platform-server run dev",
      url: `${platformUrl}/health`,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: {
        ...process.env,
        NODE_ENV: "test",
        GOOGLE_CLIENT_ID: "forge-playwright-client",
        AUTH_TEST_GOOGLE_FIXTURES: JSON.stringify({
          member: { email: "member@aischennai.org", name: "Playwright Member", picture: "", googleSub: "member-fixture" },
          owner: { email: "caditi28@aischennai.org", name: "Playwright Owner", picture: "", googleSub: "owner-fixture" },
          expired: { error: "Google sign-in credential has expired." },
          rejectedDomain: { error: "Only @aischennai.org accounts can access The Forge." },
          expiredSession: { email: "expired-session@aischennai.org", name: "Expired Session", picture: "", googleSub: "expired-session-fixture", sessionTtlMs: 0 },
        }),
        HUB_DATA_FILE: smokeStore,
        DATABASE_URL: postgresUrl,
        PLATFORM_SERVER_PORT: String(platformPort),
      },
    },
  ],
});

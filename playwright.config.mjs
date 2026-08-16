import { defineConfig } from "@playwright/test";
import { tmpdir } from "node:os";
import { join } from "node:path";

const smokeStore = join(tmpdir(), `party-games-pr-01-playwright-${process.pid}.json`);
const postgresUrl = "postgresql://forge:forge-local-password@127.0.0.1:5432/forge";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  workers: 1,
  use: {
    baseURL: "http://localhost:5176",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "pnpm --dir apps/hub run dev",
      url: "http://localhost:5176",
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: {
        ...process.env,
        HUB_DATA_FILE: smokeStore,
        DATABASE_URL: postgresUrl,
      },
    },
    {
      command: "pnpm --dir apps/platform-server run dev",
      url: "http://localhost:8787/health",
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: {
        ...process.env,
        HUB_DATA_FILE: smokeStore,
        DATABASE_URL: postgresUrl,
      },
    },
    { command: "pnpm --dir apps/quiz-shooter/server run start", url: "http://localhost:4000/health", timeout: 120_000, reuseExistingServer: !process.env.CI },
    { command: "pnpm --dir apps/build-a-beast/server run start", url: "http://localhost:4100/health", timeout: 120_000, reuseExistingServer: !process.env.CI },
  ],
});

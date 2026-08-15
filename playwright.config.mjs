import { defineConfig } from "@playwright/test";
import { tmpdir } from "node:os";
import { join } from "node:path";

const smokeStore = join(tmpdir(), `party-games-pr-01-playwright-${process.pid}.json`);

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
      },
    },
    { command: "pnpm --dir apps/quiz-shooter/client run dev", url: "http://localhost:5173", timeout: 120_000, reuseExistingServer: !process.env.CI },
    { command: "pnpm --dir apps/build-a-beast/client run dev", url: "http://localhost:5174", timeout: 120_000, reuseExistingServer: !process.env.CI },
  ],
});

import { defineConfig } from "@playwright/test";
import { tmpdir } from "node:os";
import { join } from "node:path";

const smokeStore = join(tmpdir(), `party-games-pr-01-playwright-${process.pid}.json`);

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
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
    { command: "pnpm --dir apps/imposter run dev", url: "http://localhost:5181", timeout: 120_000, reuseExistingServer: !process.env.CI },
    { command: "pnpm --dir apps/quiz-shooter/client run dev", url: "http://localhost:5173", timeout: 120_000, reuseExistingServer: !process.env.CI },
    { command: "pnpm --dir apps/build-a-beast/client run dev", url: "http://localhost:5174", timeout: 120_000, reuseExistingServer: !process.env.CI },
    { command: "pnpm --dir apps/planner-habit run dev", url: "http://localhost:5314", timeout: 120_000, reuseExistingServer: !process.env.CI },
    { command: "pnpm --dir apps/planner-todo run dev", url: "http://localhost:5315", timeout: 120_000, reuseExistingServer: !process.env.CI },
    { command: "pnpm --dir apps/planner-timer run dev", url: "http://localhost:5316", timeout: 120_000, reuseExistingServer: !process.env.CI },
    { command: "pnpm --dir apps/planner-assignments run dev", url: "http://localhost:5317", timeout: 120_000, reuseExistingServer: !process.env.CI },
  ],
});

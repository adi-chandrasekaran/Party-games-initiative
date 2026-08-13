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
  webServer: {
    command: "npm run dev --prefix apps/hub",
    url: "http://localhost:5176",
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      HUB_DATA_FILE: smokeStore,
    },
  },
});

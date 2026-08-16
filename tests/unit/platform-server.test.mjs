import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("platform server exposes the sole supported runtime", async () => {
  const [platformPackage, platformEntry, hubServer] = await Promise.all([
    readFile(new URL("../../apps/platform-server/package.json", import.meta.url), "utf8"),
    readFile(new URL("../../apps/platform-server/src/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../../apps/hub/server.js", import.meta.url), "utf8"),
  ]);

  assert.match(platformPackage, /"name": "platform-server"/);
  assert.match(platformEntry, /startHubApiServer/);
  assert.match(hubServer, /export function createHubApiServer/);
  assert.match(hubServer, /export async function startHubApiServer/);
});

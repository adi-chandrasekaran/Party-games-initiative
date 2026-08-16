import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("platform server exposes a typed runtime and legacy rollback entry point", async () => {
  const [platformPackage, platformEntry, hubPackage, hubServer] = await Promise.all([
    readFile(new URL("../../apps/platform-server/package.json", import.meta.url), "utf8"),
    readFile(new URL("../../apps/platform-server/src/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../../apps/hub/package.json", import.meta.url), "utf8"),
    readFile(new URL("../../apps/hub/server.js", import.meta.url), "utf8"),
  ]);

  assert.match(platformPackage, /"name": "platform-server"/);
  assert.match(platformEntry, /startHubApiServer/);
  assert.match(hubPackage, /"api:legacy"/);
  assert.match(hubServer, /export function createHubApiServer/);
  assert.match(hubServer, /export async function startHubApiServer/);
});

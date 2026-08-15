import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("hub staging builds only the two PR-06 multiplayer clients with route-local assets", async () => {
  const source = await readFile(new URL("../../scripts/stage-multiplayer-microapps.mjs", import.meta.url), "utf8");

  assert.match(source, /apps\/quiz-shooter\/client/);
  assert.match(source, /apps\/build-a-beast\/client/);
  assert.match(source, /"quiz-shooter"/);
  assert.match(source, /"build-a-beast"/);
  assert.match(source, /"--base",\s*"\.\/"/);
  assert.doesNotMatch(source, /imposter|planner-/);
});

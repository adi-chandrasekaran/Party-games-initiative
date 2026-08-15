import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("hub staging copies only the five PR-05 source packages to same-origin entries", async () => {
  const source = await readFile(new URL("../../scripts/stage-simple-microapps.mjs", import.meta.url), "utf8");
  for (const route of ["imposter", "habit-tracker", "todo-board", "timer", "assignments"]) {
    assert.match(source, new RegExp(`"${route}"`));
  }
  assert.doesNotMatch(source, /quiz-shooter|build-a-beast/);
  assert.match(source, /replaceAll\("http:\/\/localhost:5176\/\?workspace="/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("PR-13 documents one platform origin without legacy launcher ports", async () => {
  const ports = await readFile(new URL("../../docs/PORTS_AND_RUNNING.md", import.meta.url), "utf8");

  assert.match(ports, /single platform origin/i);
  assert.doesNotMatch(ports, /localhost:(5173|5174|5176|5181|5314|5315|5316|5317)/);
});

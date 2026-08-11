import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("known baseline build defects are explicitly documented", async () => {
  const defects = await readFile(new URL("../../docs/architecture/baseline-defects.md", import.meta.url), "utf8");

  assert.match(defects, /BD-001/);
  assert.match(defects, /BD-002/);
  assert.match(defects, /Expected failure/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("PR-13 records resolved baseline build defects", async () => {
  const defects = await readFile(new URL("../../docs/architecture/baseline-defects.md", import.meta.url), "utf8");

  assert.match(defects, /BD-001.*Resolved by PR-13/s);
  assert.match(defects, /BD-002.*Resolved by PR-13/s);
  assert.doesNotMatch(defects, /Expected failure/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("PR-01 keeps the documented legacy launcher ports", async () => {
  const ports = await readFile(new URL("../../docs/PORTS_AND_RUNNING.md", import.meta.url), "utf8");

  for (const port of ["5176", "5181", "5173", "5174", "5314", "5315", "5316", "5317"]) {
    assert.match(ports, new RegExp(`localhost:${port}`));
  }
});

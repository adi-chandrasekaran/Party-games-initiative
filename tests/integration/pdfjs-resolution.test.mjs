import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

test("hub resolves PDFJS from its declared workspace dependency", () => {
  const result = execFileSync(
    "pnpm",
    ["--dir", "apps/hub", "exec", "node", "--input-type=module", "-e", "import('pdfjs-dist/legacy/build/pdf.mjs').then(() => process.stdout.write('resolved'))"],
    { encoding: "utf8" },
  );
  assert.equal(result, "resolved");
});

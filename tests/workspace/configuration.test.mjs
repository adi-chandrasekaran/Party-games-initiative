import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = new URL("../..", import.meta.url);
const expectedPackages = [
  "packages/contracts",
  "packages/app-registry",
  "packages/design-tokens",
  "apps/hub",
  "apps/imposter",
  "apps/planner-assignments",
  "apps/planner-habit",
  "apps/planner-timer",
  "apps/planner-todo",
  "apps/quiz-shooter/client",
  "apps/quiz-shooter/server",
  "apps/build-a-beast/client",
  "apps/build-a-beast/server",
];

test("workspace lists the active packages and shared foundations", async () => {
  const workspace = await readFile(new URL("../../pnpm-workspace.yaml", import.meta.url), "utf8");
  for (const entry of expectedPackages) assert.match(workspace, new RegExp(`- ${entry}`));
  assert.doesNotMatch(workspace, /old-games/);
});

test("workspace toolchain and manifest packages are deterministic", async () => {
  const manifest = JSON.parse(await readFile(new URL("../../package.json", import.meta.url), "utf8"));
  assert.equal(manifest.packageManager, "pnpm@11.19.0");
  assert.equal(manifest.devDependencies.turbo, "2.10.9");

  const names = execFileSync("pnpm", ["-r", "list", "--depth", "-1", "--json"], { cwd: fileURLToPath(root), encoding: "utf8" });
  const packages = JSON.parse(names);
  assert.equal(new Set(packages.map((entry) => entry.name)).size, packages.length);
});

test("npm lockfiles and contributor-specific PDFJS paths are absent", async () => {
  const tracked = execFileSync("git", ["ls-files"], { cwd: fileURLToPath(root), encoding: "utf8" });
  assert.doesNotMatch(tracked, /(^|\n).*package-lock\.json(\n|$)/);

  const hubServer = await readFile(new URL("../../apps/hub/server.js", import.meta.url), "utf8");
  assert.match(hubServer, /pdfjs-dist\/legacy\/build\/pdf\.mjs/);
  assert.doesNotMatch(hubServer, /\/Users\//);
});

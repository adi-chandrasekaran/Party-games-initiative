import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { API_CONTRACTS, DECK_CAPABILITIES, REALTIME_CONTRACTS } from "@forge/contracts";
import { appManifests, validateAppRegistry } from "@forge/app-registry";

test("every app manifest has valid package, permission, deck, API, and realtime contracts", () => {
  validateAppRegistry();
  const packages = JSON.parse(execFileSync("pnpm", ["-r", "list", "--depth", "-1", "--json"], { encoding: "utf8" }));
  const packageNames = new Set(packages.map((entry) => entry.name));

  for (const manifest of appManifests) {
    assert.ok(manifest.access, `${manifest.id} needs an access policy`);
    assert.ok(DECK_CAPABILITIES.includes(manifest.deckCapability), `${manifest.id} needs a valid deck capability`);
    assert.ok(manifest.apiContracts.every((name) => API_CONTRACTS[name]), `${manifest.id} references known API contracts`);
    if (manifest.packageName) assert.ok(packageNames.has(manifest.packageName), `${manifest.id} client package exists`);
    if (manifest.serverPackageName) assert.ok(packageNames.has(manifest.serverPackageName), `${manifest.id} server package exists`);
    if (manifest.realtimeContract) assert.ok(REALTIME_CONTRACTS[manifest.realtimeContract], `${manifest.id} realtime contract exists`);
  }
});

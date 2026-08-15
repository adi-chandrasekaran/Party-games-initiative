import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { appManifests, resolveLegacyLaunch, validateAppRegistry } from "@forge/app-registry";

test("registry declares every current arcade and planner product app", () => {
  assert.deepEqual(appManifests.map((manifest) => manifest.id), [
    "imposter", "quiz-shooter", "build-a-beast", "flashcards", "quiz-bowl", "word-match",
    "habit-tracker", "todo-board", "timer", "assignments",
  ]);
  assert.equal(appManifests.filter((manifest) => manifest.area === "arcade").length, 6);
  assert.equal(appManifests.filter((manifest) => manifest.area === "planner").length, 4);
});

test("registry rejects duplicate IDs, routes, and invalid compatibility targets", () => {
  const duplicateId = appManifests.map((manifest) => ({ ...manifest }));
  duplicateId[1].id = duplicateId[0].id;
  assert.throws(() => validateAppRegistry(duplicateId), /Duplicate app ID/);

  const duplicateRoute = appManifests.map((manifest) => ({ ...manifest }));
  duplicateRoute[1].canonicalRoute = duplicateRoute[0].canonicalRoute;
  assert.throws(() => validateAppRegistry(duplicateRoute), /Duplicate canonical route/);

  const invalidOrigin = appManifests.map((manifest) => ({ ...manifest, legacyFallback: manifest.legacyFallback && { ...manifest.legacyFallback } }));
  invalidOrigin[0].legacyFallback.defaultOrigin = "file:///not-a-launcher";
  assert.throws(() => validateAppRegistry(invalidOrigin), /Invalid legacy origin protocol/);
});

test("registry routes the five simple micro-apps through the hub and preserves fallbacks", () => {
  const sameOriginApps = appManifests.filter((manifest) => manifest.launchMode === "same-origin");
  assert.deepEqual(sameOriginApps.map((manifest) => manifest.id), ["imposter", "habit-tracker", "todo-board", "timer", "assignments"]);
  assert.ok(sameOriginApps.every((manifest) => manifest.sameOriginEntry.startsWith("/microapps/")));
  assert.equal(resolveLegacyLaunch("imposter"), "http://localhost:5181");
  assert.equal(resolveLegacyLaunch("imposter", { VITE_IMPOSTER_ORIGIN: "https://forge.example.test" }), "https://forge.example.test");
  assert.throws(() => resolveLegacyLaunch("imposter", { VITE_IMPOSTER_ORIGIN: "not a url" }), /Invalid legacy origin/);
});

test("hub launcher source uses the registry instead of embedded legacy app origins", async () => {
  const source = await readFile(new URL("../../apps/hub/src/App.jsx", import.meta.url), "utf8");
  assert.match(source, /from "\.\/appRegistry"/);
  assert.doesNotMatch(source, /localhost:(5181|5173|5174|5314|5315|5316|5317)/);
  assert.doesNotMatch(source, /gamesConfig/);
});

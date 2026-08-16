import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { appManifests, validateAppRegistry } from "@forge/app-registry";

test("registry declares every current arcade and planner product app", () => {
  assert.deepEqual(appManifests.map((manifest) => manifest.id), [
    "imposter", "quiz-shooter", "build-a-beast", "flashcards", "quiz-bowl", "word-match",
    "habit-tracker", "todo-board", "timer", "assignments",
  ]);
  assert.equal(appManifests.filter((manifest) => manifest.area === "arcade").length, 6);
  assert.equal(appManifests.filter((manifest) => manifest.area === "planner").length, 4);
});

test("registry rejects duplicate IDs, routes, and compatibility fields", () => {
  const duplicateId = appManifests.map((manifest) => ({ ...manifest }));
  duplicateId[1].id = duplicateId[0].id;
  assert.throws(() => validateAppRegistry(duplicateId), /Duplicate app ID/);

  const duplicateRoute = appManifests.map((manifest) => ({ ...manifest }));
  duplicateRoute[1].canonicalRoute = duplicateRoute[0].canonicalRoute;
  assert.throws(() => validateAppRegistry(duplicateRoute), /Duplicate canonical route/);

  const compatibilityField = appManifests.map((manifest) => ({ ...manifest }));
  compatibilityField[0].legacyFallback = { environmentKey: "VITE_OLD", defaultOrigin: "http://localhost:1" };
  assert.throws(() => validateAppRegistry(compatibilityField), /cannot declare a compatibility target/);
});

test("registry routes the seven migrated micro-apps through the hub", () => {
  const sameOriginApps = appManifests.filter((manifest) => manifest.launchMode === "same-origin");
  assert.deepEqual(sameOriginApps.map((manifest) => manifest.id), [
    "imposter",
    "quiz-shooter",
    "build-a-beast",
    "habit-tracker",
    "todo-board",
    "timer",
    "assignments",
  ]);
  assert.ok(sameOriginApps.every((manifest) => manifest.sameOriginEntry.startsWith("/microapps/")));
  assert.ok(sameOriginApps.every((manifest) => !manifest.legacyFallback));
});

test("platform game records retain public host access after a same-origin migration", async () => {
  const { listPlatformGames } = await import("@forge/app-registry");
  assert.deepEqual(listPlatformGames().map((game) => game.id), ["imposter", "quiz-shooter", "build-a-beast"]);
  assert.deepEqual(listPlatformGames().map((game) => game.route), [
    "/arcade/imposter",
    "/arcade/quiz-shooter",
    "/arcade/build-a-beast",
  ]);
});

test("hub launcher source uses the registry instead of embedded legacy app origins", async () => {
  const source = await readFile(new URL("../../apps/hub/src/App.jsx", import.meta.url), "utf8");
  assert.match(source, /from "\.\/appRegistry"/);
  assert.doesNotMatch(source, /localhost:(5181|5173|5174|5314|5315|5316|5317)/);
  assert.doesNotMatch(source, /gamesConfig/);
});

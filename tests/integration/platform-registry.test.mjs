import test from "node:test";
import assert from "node:assert/strict";
import { listPlatformGames } from "@forge/app-registry";
import { getPublicGames } from "../../apps/hub/platform-data.js";

test("hub platform game records resolve legacy routes through the registry", () => {
  const registryGames = listPlatformGames();
  const persistedGame = { ...registryGames[0], route: "http://incorrect.example.test", isPublic: true, status: "active" };
  const [game] = getPublicGames({ gameConfigs: [persistedGame] });

  assert.equal(game.id, registryGames[0].id);
  assert.equal(game.route, registryGames[0].route);
  assert.notEqual(game.route, "http://incorrect.example.test");
});

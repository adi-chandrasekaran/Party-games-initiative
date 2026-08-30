import test from "node:test";
import assert from "node:assert/strict";
import { buildOwnerStatistics } from "../../apps/hub/admin-dashboard.js";

test("owner statistics ranks plays and averages ratings for the registered apps", () => {
  const result = buildOwnerStatistics(
    [
      { id: "a", title: "Alpha" },
      { id: "b", title: "Beta" },
      { id: "c", title: "Gamma" },
    ],
    { Alpha: 9, Beta: 2 },
    [
      { game: "Alpha", stars: 5 },
      { game: "Alpha", stars: 3 },
      { game: "Beta", stars: 4 },
      { game: "Removed app", stars: 1 },
    ],
  );

  assert.deepEqual(result.mostPlayed, { id: "a", title: "Alpha", count: 9 });
  assert.deepEqual(result.leastPlayed, { id: "c", title: "Gamma", count: 0 });
  assert.equal(result.averageRating, 4);
  assert.deepEqual(result.ratings.find((app) => app.title === "Alpha"), { id: "a", title: "Alpha", count: 2, average: 4 });
  assert.deepEqual(result.ratings.find((app) => app.title === "Gamma"), { id: "c", title: "Gamma", count: 0, average: null });
});

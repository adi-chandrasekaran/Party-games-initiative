import test from "node:test";
import assert from "node:assert/strict";
import { readDeckSelections, removeDeckFromSelections, selectDeckForApp } from "../../apps/hub/src/deck-selection.js";

test("deck selection is keyed by the compatible game rather than a workspace", () => {
  const selections = selectDeckForApp({}, "flashcards", "deck-a");
  const next = selectDeckForApp(selections, "quiz-bowl", "deck-b");
  assert.deepEqual(next, { flashcards: "deck-a", "quiz-bowl": "deck-b" });
});

test("removing a library deck clears every game that referenced it", () => {
  assert.deepEqual(removeDeckFromSelections({ flashcards: "deck-a", quizBowl: "deck-b", wordMatch: "deck-a" }, "deck-a"), { quizBowl: "deck-b" });
  assert.deepEqual(readDeckSelections(["not-a-map"]), {});
});

import test from "node:test";
import assert from "node:assert/strict";
import { MAX_FEEDBACK_LENGTH, validateFeedbackMessage } from "../../apps/hub/feedback.js";

test("feedback validation trims a short message", () => {
  assert.equal(validateFeedbackMessage("  Helpful idea  "), "Helpful idea");
});

test("feedback validation rejects empty and oversized messages", () => {
  assert.throws(() => validateFeedbackMessage("   "), /required/);
  assert.throws(() => validateFeedbackMessage("x".repeat(MAX_FEEDBACK_LENGTH + 1)), /characters or fewer/);
});

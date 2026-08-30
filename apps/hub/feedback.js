const MAX_FEEDBACK_LENGTH = 2_000;

export function validateFeedbackMessage(value) {
  const message = String(value || "").trim();
  if (!message) throw new Error("Feedback message is required.");
  if (message.length > MAX_FEEDBACK_LENGTH) {
    throw new Error(`Feedback message must be ${MAX_FEEDBACK_LENGTH} characters or fewer.`);
  }
  return message;
}

export { MAX_FEEDBACK_LENGTH };

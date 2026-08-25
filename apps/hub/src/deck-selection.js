export function readDeckSelections(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([appId, deckId]) => typeof appId === "string" && typeof deckId === "string"));
}

export function selectDeckForApp(selections, appId, deckId) {
  return { ...readDeckSelections(selections), [appId]: deckId };
}

export function removeDeckFromSelections(selections, deckId) {
  return Object.fromEntries(Object.entries(readDeckSelections(selections)).filter(([, selectedDeckId]) => selectedDeckId !== deckId));
}

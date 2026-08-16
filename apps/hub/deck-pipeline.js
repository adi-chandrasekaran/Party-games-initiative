const MAX_DECK_BYTES = 5 * 1024 * 1024;

export function validatePdfDeck({ title, fileName, decoded }) {
  const cleanTitle = String(title || "").trim();
  const cleanFileName = String(fileName || "").trim();
  if (!cleanTitle || cleanTitle.length > 120) throw new Error("Deck name must be between 1 and 120 characters.");
  if (!decoded || decoded.mimeType !== "application/pdf") throw new Error("Only PDF decks are supported.");
  if (!cleanFileName.toLowerCase().endsWith(".pdf")) throw new Error("Deck file name must end in .pdf.");
  if (decoded.buffer.length === 0 || decoded.buffer.length > MAX_DECK_BYTES) throw new Error("PDF decks must be between 1 byte and 5 MB.");
  if (!decoded.buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) throw new Error("The uploaded file is not a valid PDF.");
  return { title: cleanTitle, fileName: cleanFileName };
}

export function extractDeckItems(text) {
  const lines = String(text || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const items = [];
  for (let index = 0; index < lines.length; index += 2) {
    const [term, inlineDefinition] = lines[index].split(/\s[-–:]\s/, 2);
    const definition = inlineDefinition || lines[index + 1] || term;
    if (term) items.push({ id: `item-${items.length + 1}`, term: term.slice(0, 240), definition: definition.slice(0, 800) });
  }
  return items.slice(0, 200);
}

export function deckSummary(deck) {
  const { sourceDataUrl, ...safe } = deck;
  return safe;
}

export function deckForGame(deck, gameId) {
  const items = Array.isArray(deck.items) ? deck.items : extractDeckItems(deck.text);
  if (gameId === "imposter") return { id: deck.id, title: deck.title, terms: items.map((item) => item.term).filter(Boolean) };
  return { id: deck.id, title: deck.title, items };
}

import test from "node:test";
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { deckForGame, deckSummary, extractDeckItems, validatePdfDeck } from "../../apps/hub/deck-pipeline.js";

test("deck pipeline validates PDF signatures, size, title, and filename", () => {
  const decoded = { mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.7\nexample") };
  assert.deepEqual(validatePdfDeck({ title: "Biology", fileName: "biology.pdf", decoded }), { title: "Biology", fileName: "biology.pdf" });
  assert.throws(() => validatePdfDeck({ title: "Biology", fileName: "biology.txt", decoded }), /\.pdf/);
  assert.throws(() => validatePdfDeck({ title: "Biology", fileName: "biology.pdf", decoded: { ...decoded, buffer: Buffer.from("not a pdf") } }), /valid PDF/);
});

test("deck extraction produces structured items and never exposes source bytes in summaries", () => {
  const items = extractDeckItems("Mitosis\nCell division\nOsmosis - Water movement");
  assert.deepEqual(items.map((item) => item.term), ["Mitosis", "Osmosis"]);
  const deck = { id: "deck-1", title: "Biology", text: "Mitosis\nCell division", items, sourceDataUrl: "data:application/pdf;base64,secret" };
  assert.equal(deckSummary(deck).sourceDataUrl, undefined);
  assert.deepEqual(deckForGame(deck, "imposter").terms, ["Mitosis", "Osmosis"]);
  assert.equal(deckForGame(deck, "quiz-shooter").items[0].definition, "Cell division");
});

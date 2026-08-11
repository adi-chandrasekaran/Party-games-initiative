import { useEffect, useMemo, useState } from "react";
import type { Question } from "../types";

const starterText = `What is 7 × 8?
54
56 *
64

Which gas do plants absorb for photosynthesis?
Oxygen
Carbon dioxide *
Nitrogen

What is the capital of Japan?
Seoul
Kyoto
Tokyo *
Osaka`;

export function parseDeck(raw: string): Question[] {
  return raw
    .split(/\n\s*\n/g)
    .map((block, index) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      const prompt = lines[0] ?? "";
      const answerLines = lines.slice(1);
      const choices = answerLines.map((line, choiceIndex) => ({
        id: String.fromCharCode(97 + choiceIndex),
        text: line.replace(/\s*\*$/, "")
      }));

      const correctIndex = answerLines.findIndex((line) => line.endsWith("*"));

      return {
        id: `q${index + 1}`,
        prompt,
        choices,
        correctChoiceId: choices[Math.max(0, correctIndex)]?.id ?? choices[0]?.id ?? "a"
      };
    })
    .filter((q) => q.prompt && q.choices.length >= 2);
}

function parseDeckFile(raw: string): Question[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((entry: any, index: number) => {
            const prompt = String(entry.prompt || entry.question || "").trim();
            const choices = Array.isArray(entry.choices)
              ? entry.choices.map((choice: string, choiceIndex: number) => ({
                  id: String.fromCharCode(97 + choiceIndex),
                  text: String(choice).replace(/\s*\*$/, "").trim()
                }))
              : [];
            const correctChoiceId =
              typeof entry.correctChoiceId === "string"
                ? entry.correctChoiceId
                : choices.find((choice) => String(entry.correctAnswer || "").trim().toLowerCase() === choice.text.toLowerCase())?.id ||
                  choices[Math.max(0, Number(entry.correctIndex) || 0)]?.id ||
                  choices[0]?.id ||
                  "a";

            return { id: `q${index + 1}`, prompt, choices, correctChoiceId };
          })
          .filter((question) => question.prompt && question.choices.length >= 2);
      }
    } catch {
      return parseDeck(trimmed);
    }
  }

  return parseDeck(trimmed);
}

export default function DeckEditor({
  initialRaw = starterText,
  onDeckChange
}: {
  initialRaw?: string;
  onDeckChange: (deck: Question[]) => void;
}) {
  const [raw, setRaw] = useState(initialRaw);

  useEffect(() => {
    setRaw(initialRaw);
  }, [initialRaw]);

  const deck = useMemo(() => parseDeckFile(raw), [raw]);

  function loadFile(file: File | undefined) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const contents = String(reader.result || "");
      setRaw(contents);
      onDeckChange(parseDeckFile(contents));
    };
    reader.readAsText(file);
  }

  function applyDeck() {
    onDeckChange(deck);
  }

  return (
    <div className="form-stack">
      <p className="muted">
        Put one question per block. Add <strong>*</strong> after the correct answer, or upload a
        `.txt`, `.csv`, or `.json` deck file.
      </p>
      <label className="fileUpload">
        <span>Upload question deck</span>
        <input
          type="file"
          accept=".txt,.csv,.json"
          onChange={(event) => loadFile(event.target.files?.[0])}
        />
      </label>
      <textarea
        className="textarea"
        value={raw}
        onChange={(event) => setRaw(event.target.value)}
      />
      <div className="button-row">
        <button className="secondary-btn" onClick={applyDeck}>
          Apply Question Deck
        </button>
        <span className="muted">{deck.length} questions detected</span>
      </div>
    </div>
  );
}

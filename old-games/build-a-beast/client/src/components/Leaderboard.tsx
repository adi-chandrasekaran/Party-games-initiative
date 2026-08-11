import type { LeaderboardEntry } from "../types";

export default function Leaderboard({
  entries,
  animated = false
}: {
  entries: LeaderboardEntry[];
  animated?: boolean;
}) {
  return (
    <div className={animated ? "leaderboard animated-board" : "leaderboard"}>
      <h3>Leaderboard</h3>
      {entries.length === 0 ? (
        <p className="muted">No scores yet.</p>
      ) : (
        entries.map((entry, index) => (
          <div className="leader-row" key={entry.playerId}>
            <div>
              <strong>{index + 1}. {entry.name}</strong>
              <p className="muted small">
                {entry.beastName} · {entry.partCount} parts
              </p>
            </div>
            <span className="score-pill">{entry.score}</span>
          </div>
        ))
      )}
    </div>
  );
}

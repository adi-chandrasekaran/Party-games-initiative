import Leaderboard from "./Leaderboard";
import PointsBoard from "./PointsBoard";
import type { LeaderboardEntry, SimulationOutput } from "../types";

export default function Podium({
  entries,
  isHost,
  onRestart,
  onEnd,
  simulation,
  playerId
}: {
  entries: LeaderboardEntry[];
  isHost: boolean;
  onRestart: () => void;
  onEnd: () => void;
  simulation?: SimulationOutput | null;
  playerId?: string | null;
}) {
  const first = entries[0];
  const second = entries[1];
  const third = entries[2];

  return (
    <div className="podium-screen">
      <div className="spotlight left-light" />
      <div className="spotlight right-light" />
      <section className="podium-card">
        <p className="badge">Final Survival Results</p>
        <h1>Beast Podium</h1>

        <div className="podium-stage">
          <div className="podium-place second">
            <div className="podium-name">{second?.name ?? "—"}</div>
            <div className="podium-beast">{second?.beastName ?? "No beast"}</div>
            <div className="podium-score">{second?.score ?? 0}</div>
            <div className="podium-block">2</div>
          </div>

          <div className="podium-place first">
            <div className="crown">👑</div>
            <div className="podium-name">{first?.name ?? "—"}</div>
            <div className="podium-beast">{first?.beastName ?? "No beast"}</div>
            <div className="podium-score">{first?.score ?? 0}</div>
            <div className="podium-block">1</div>
          </div>

          <div className="podium-place third">
            <div className="podium-name">{third?.name ?? "—"}</div>
            <div className="podium-beast">{third?.beastName ?? "No beast"}</div>
            <div className="podium-score">{third?.score ?? 0}</div>
            <div className="podium-block">3</div>
          </div>
        </div>

        {simulation && playerId && (
          <PointsBoard simulation={simulation} playerId={playerId} title="Your Final Points Board" />
        )}

        <Leaderboard entries={entries} animated />

        {isHost && (
          <div className="button-row centered">
            <button className="primary-btn" onClick={onRestart}>
              Restart Same Challenge
            </button>
            <button className="danger-btn" onClick={onEnd}>
              End Game For Everyone
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

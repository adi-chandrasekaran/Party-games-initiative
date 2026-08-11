import PointsBoard from "./PointsBoard";
import type { SimulationOutput } from "../types";

export default function SimulationView({
  simulation,
  onSkipToPodium,
  playerId
}: {
  simulation: SimulationOutput;
  onSkipToPodium: () => void;
  playerId?: string | null;
}) {
  return (
    <div className="simulation-screen">
      <section className="simulation-hero">
        <p className="badge">Arena Simulation</p>
        <h1>The beasts enter the arena.</h1>
        <p className="muted">
          Each event tests different adaptations. Strong design choices survive. Bad tradeoffs get exposed.
        </p>
        <button className="secondary-btn" onClick={onSkipToPodium}>
          Skip to Podium
        </button>
      </section>

      {playerId && <PointsBoard simulation={simulation} playerId={playerId} title="Your Points Board" />}

      <section className="timeline">
        {simulation.timeline.map((step, index) => (
          <article className="event-card" key={step.eventId}>
            <div className="event-index">{index + 1}</div>
            <div>
              <h2>{step.title}</h2>
              <p className="muted">{step.description}</p>
              <div className="event-results">
                {step.results.map((result) => (
                  <div className="event-result" key={result.playerId}>
                    <div>
                      <strong>{result.beastName}</strong>
                      <p className="muted small">by {result.playerName}</p>
                      <ul>
                        {result.reasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                    <div className={result.delta >= 0 ? "delta positive" : "delta negative"}>
                      {result.delta >= 0 ? "+" : ""}
                      {result.delta}
                      <small>{result.scoreAfter}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

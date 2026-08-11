import type { SimulationOutput } from "../types";

export default function PointsBoard({
  simulation,
  playerId,
  title = "Points Board"
}: {
  simulation: SimulationOutput;
  playerId?: string | null;
  title?: string;
}) {
  const rows = simulation.timeline
    .map((step) => {
      const result = playerId
        ? step.results.find((entry) => entry.playerId === playerId)
        : step.results[0];

      if (!result) return null;

      return {
        eventId: step.eventId,
        eventTitle: step.title,
        description: step.description,
        ...result
      };
    })
    .filter(Boolean) as Array<{
      eventId: string;
      eventTitle: string;
      description: string;
      playerId: string;
      playerName: string;
      beastName: string;
      delta: number;
      scoreAfter: number;
      reasons: string[];
    }>;

  const finalScore = rows.length > 0 ? rows[rows.length - 1].scoreAfter : 0;
  const positive = rows.filter((row) => row.delta >= 0).length;
  const negative = rows.filter((row) => row.delta < 0).length;

  return (
    <section className="points-board">
      <div className="points-board-header">
        <div>
          <p className="badge">What went right / wrong</p>
          <h2>{title}</h2>
          {rows[0] && (
            <p className="muted">
              {rows[0].beastName} by {rows[0].playerName}
            </p>
          )}
        </div>
        <div className="points-summary">
          <span>Final<strong>{finalScore}</strong></span>
          <span>Worked<strong>{positive}</strong></span>
          <span>Cost Points<strong>{negative}</strong></span>
        </div>
      </div>

      <div className="points-table">
        {rows.map((row) => (
          <article className="points-row" key={row.eventId}>
            <div>
              <h3>{row.eventTitle}</h3>
              <p className="muted small">{row.description}</p>
              <ul>
                {row.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
            <div className={row.delta >= 0 ? "points-delta good" : "points-delta bad"}>
              {row.delta >= 0 ? "+" : ""}{row.delta}
              <small>Total {row.scoreAfter}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

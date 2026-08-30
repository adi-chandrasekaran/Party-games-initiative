/**
 * Creates the data used by the owner dashboard's statistics tab.
 * Kept independent of HTTP and persistence so the ranking rules are testable.
 */
export function buildOwnerStatistics(apps, playCounts = {}, gameRatings = []) {
  const dashboardApps = apps.map((app) => ({ id: app.id, title: app.title }));
  const countFor = (app) => Number(playCounts[app.title] || 0);
  const rankedByPlays = [...dashboardApps]
    .sort((a, b) => countFor(b) - countFor(a) || a.title.localeCompare(b.title));
  const ratings = dashboardApps.map((app) => {
    const entries = gameRatings.filter((rating) => rating.game === app.title);
    const average = entries.length
      ? entries.reduce((sum, rating) => sum + Number(rating.stars || 0), 0) / entries.length
      : null;
    return { ...app, count: entries.length, average };
  });
  const allRatings = gameRatings.filter((rating) => dashboardApps.some((app) => app.title === rating.game));

  return {
    mostPlayed: rankedByPlays[0] ? { ...rankedByPlays[0], count: countFor(rankedByPlays[0]) } : null,
    leastPlayed: rankedByPlays.at(-1) ? { ...rankedByPlays.at(-1), count: countFor(rankedByPlays.at(-1)) } : null,
    averageRating: allRatings.length
      ? allRatings.reduce((sum, rating) => sum + Number(rating.stars || 0), 0) / allRatings.length
      : null,
    ratings,
  };
}

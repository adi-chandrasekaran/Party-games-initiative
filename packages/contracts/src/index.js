export const PRODUCT_AREAS = Object.freeze(["arcade", "planner"]);
export const ACCESS_POLICIES = Object.freeze(["authenticated-member", "public-host"]);
export const DECK_CAPABILITIES = Object.freeze(["none", "optional", "required"]);
export const LAUNCH_MODES = Object.freeze(["legacy-external", "embedded"]);

export const API_CONTRACTS = Object.freeze({
  platformGames: Object.freeze({ method: "GET", path: "/api/platform/games" }),
  gameAccess: Object.freeze({ method: "GET", path: "/api/platform/game-access/:gameId" }),
  canHost: Object.freeze({ method: "POST", path: "/api/platform/can-host" }),
});

export const REALTIME_CONTRACTS = Object.freeze({
  quizShooter: Object.freeze(["room:create", "room:join", "game:start"]),
  buildABeast: Object.freeze(["room:create", "room:join", "game:start"]),
});

export function isOneOf(value, values) {
  return values.includes(value);
}

export function assertContract(condition, message) {
  if (!condition) throw new Error(message);
}

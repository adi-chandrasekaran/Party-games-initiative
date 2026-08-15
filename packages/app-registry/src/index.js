import {
  ACCESS_POLICIES,
  API_CONTRACTS,
  DECK_CAPABILITIES,
  LAUNCH_MODES,
  PRODUCT_AREAS,
  REALTIME_CONTRACTS,
  assertContract,
  isOneOf,
} from "@forge/contracts";

const legacyTarget = (environmentKey, defaultOrigin) => ({ environmentKey, defaultOrigin });

export const appManifests = Object.freeze([
  { id: "imposter", title: "IMPOSTER", subtitle: "Find the secret player", area: "arcade", canonicalRoute: "/arcade/imposter", launchMode: "same-origin", sameOriginEntry: "/microapps/imposter/index.html", access: "public-host", deckCapability: "optional", color: "#ff2fa3", icon: "imposter", packageName: "imposter-game", apiContracts: ["platformGames", "gameAccess", "canHost"], legacyFallback: legacyTarget("VITE_IMPOSTER_ORIGIN", "http://localhost:5181") },
  { id: "quiz-shooter", title: "QUIZ SHOOTER", subtitle: "Answer fast, shoot faster", area: "arcade", canonicalRoute: "/arcade/quiz-shooter", launchMode: "legacy-external", access: "public-host", deckCapability: "optional", color: "#18d8ff", icon: "quiz", packageName: "quiz-shooter-3d-client", serverPackageName: "quiz-shooter-3d-server", apiContracts: ["platformGames", "gameAccess", "canHost"], realtimeContract: "quizShooter", legacyTarget: legacyTarget("VITE_QUIZ_SHOOTER_ORIGIN", "http://localhost:5173") },
  { id: "build-a-beast", title: "BUILD A BEAST", subtitle: "Create your monster", area: "arcade", canonicalRoute: "/arcade/build-a-beast", launchMode: "legacy-external", access: "public-host", deckCapability: "optional", color: "#7cff2f", icon: "beast", packageName: "build-a-beast-client", serverPackageName: "build-a-beast-server", apiContracts: ["platformGames", "gameAccess", "canHost"], realtimeContract: "buildABeast", legacyTarget: legacyTarget("VITE_BUILD_A_BEAST_ORIGIN", "http://localhost:5174") },
  { id: "flashcards", title: "FLASHCARDS", subtitle: "Study term-definition pairs", area: "arcade", canonicalRoute: "/arcade/flashcards", launchMode: "embedded", access: "authenticated-member", deckCapability: "optional", color: "#8b5cf6", icon: "flashcards", apiContracts: [], },
  { id: "quiz-bowl", title: "QUIZ BOWL", subtitle: "Multiple choice challenge", area: "arcade", canonicalRoute: "/arcade/quiz-bowl", launchMode: "embedded", access: "authenticated-member", deckCapability: "optional", color: "#06b6d4", icon: "quizbowl", apiContracts: [], },
  { id: "word-match", title: "WORD MATCH", subtitle: "Match terms to definitions", area: "arcade", canonicalRoute: "/arcade/word-match", launchMode: "embedded", access: "authenticated-member", deckCapability: "optional", color: "#10b981", icon: "wordmatch", apiContracts: [], },
  { id: "habit-tracker", title: "HABIT TRACKER", subtitle: "Month tabs, daily checkboxes", area: "planner", canonicalRoute: "/planner/habit-tracker", launchMode: "same-origin", sameOriginEntry: "/microapps/habit-tracker/index.html", access: "authenticated-member", deckCapability: "none", color: "#4dd6ff", icon: "habit", packageName: "planner-habit-tracker", apiContracts: [], legacyFallback: legacyTarget("VITE_HABIT_TRACKER_ORIGIN", "http://localhost:5314") },
  { id: "todo-board", title: "TO-DO BOARD", subtitle: "Priority tabs and task lanes", area: "planner", canonicalRoute: "/planner/todo-board", launchMode: "same-origin", sameOriginEntry: "/microapps/todo-board/index.html", access: "authenticated-member", deckCapability: "none", color: "#ff8a3d", icon: "todo", packageName: "planner-todo-board", apiContracts: [], legacyFallback: legacyTarget("VITE_TODO_BOARD_ORIGIN", "http://localhost:5315") },
  { id: "timer", title: "TIMER", subtitle: "Six study timers in one app", area: "planner", canonicalRoute: "/planner/timer", launchMode: "same-origin", sameOriginEntry: "/microapps/timer/index.html", access: "authenticated-member", deckCapability: "none", color: "#7cff2f", icon: "timer", packageName: "planner-timer", apiContracts: [], legacyFallback: legacyTarget("VITE_TIMER_ORIGIN", "http://localhost:5316") },
  { id: "assignments", title: "ASSIGNMENTS", subtitle: "Spreadsheet-style tracker", area: "planner", canonicalRoute: "/planner/assignments", launchMode: "same-origin", sameOriginEntry: "/microapps/assignments/index.html", access: "authenticated-member", deckCapability: "none", color: "#ff59c7", icon: "assignments", packageName: "planner-assignments", apiContracts: [], legacyFallback: legacyTarget("VITE_ASSIGNMENTS_ORIGIN", "http://localhost:5317") },
]);

export function validateAppRegistry(manifests = appManifests) {
  const ids = new Set();
  const routes = new Set();
  for (const manifest of manifests) {
    assertContract(manifest && typeof manifest === "object", "Every app manifest must be an object.");
    assertContract(typeof manifest.id === "string" && /^[a-z0-9-]+$/.test(manifest.id), "Every app manifest needs a stable kebab-case ID.");
    assertContract(!ids.has(manifest.id), `Duplicate app ID: ${manifest.id}`);
    ids.add(manifest.id);
    assertContract(isOneOf(manifest.area, PRODUCT_AREAS), `Invalid area for ${manifest.id}`);
    assertContract(typeof manifest.canonicalRoute === "string" && manifest.canonicalRoute.startsWith(`/${manifest.area}/`), `Invalid canonical route for ${manifest.id}`);
    assertContract(!routes.has(manifest.canonicalRoute), `Duplicate canonical route: ${manifest.canonicalRoute}`);
    routes.add(manifest.canonicalRoute);
    assertContract(isOneOf(manifest.access, ACCESS_POLICIES), `Invalid access policy for ${manifest.id}`);
    assertContract(isOneOf(manifest.deckCapability, DECK_CAPABILITIES), `Invalid deck capability for ${manifest.id}`);
    assertContract(isOneOf(manifest.launchMode, LAUNCH_MODES), `Invalid launch mode for ${manifest.id}`);
    assertContract(Array.isArray(manifest.apiContracts) && manifest.apiContracts.every((name) => API_CONTRACTS[name]), `Unknown API contract for ${manifest.id}`);
    assertContract(!manifest.realtimeContract || REALTIME_CONTRACTS[manifest.realtimeContract], `Unknown realtime contract for ${manifest.id}`);
    if (manifest.launchMode === "legacy-external") {
      assertContract(manifest.legacyTarget?.environmentKey && manifest.legacyTarget?.defaultOrigin, `Legacy app ${manifest.id} needs a compatibility target.`);
      assertLegacyOrigin(manifest.legacyTarget.defaultOrigin, manifest.id);
    } else if (manifest.launchMode === "same-origin") {
      assertContract(typeof manifest.sameOriginEntry === "string" && manifest.sameOriginEntry.startsWith("/microapps/"), `Same-origin app ${manifest.id} needs a shell entry.`);
      assertContract(manifest.legacyFallback?.environmentKey && manifest.legacyFallback?.defaultOrigin, `Same-origin app ${manifest.id} needs a legacy fallback.`);
      assertLegacyOrigin(manifest.legacyFallback.defaultOrigin, manifest.id);
    } else {
      assertContract(!manifest.legacyTarget && !manifest.legacyFallback, `Embedded app ${manifest.id} cannot declare a compatibility target.`);
    }
  }
  return manifests;
}

export function assertLegacyOrigin(origin, appId = "app") {
  let parsed;
  try { parsed = new URL(origin); } catch { throw new Error(`Invalid legacy origin for ${appId}`); }
  assertContract(parsed.protocol === "http:" || parsed.protocol === "https:", `Invalid legacy origin protocol for ${appId}`);
  assertContract(Boolean(parsed.host), `Legacy origin requires a host for ${appId}`);
  assertContract(parsed.pathname === "/", `Legacy origin must not include a path for ${appId}`);
  return parsed.origin;
}

export function getAppManifest(id) {
  return appManifests.find((manifest) => manifest.id === id) || null;
}

export function resolveLegacyLaunch(manifestOrId, environment = {}) {
  const manifest = typeof manifestOrId === "string" ? getAppManifest(manifestOrId) : manifestOrId;
  assertContract(manifest, "Unknown app manifest.");
  assertContract(manifest.launchMode === "legacy-external" || manifest.launchMode === "same-origin", `${manifest.id} has no legacy launcher.`);
  const target = manifest.legacyTarget || manifest.legacyFallback;
  const override = environment[target.environmentKey];
  return assertLegacyOrigin(override || target.defaultOrigin, manifest.id);
}

export function toLauncherCard(manifestOrId, environment = {}) {
  const manifest = typeof manifestOrId === "string" ? getAppManifest(manifestOrId) : manifestOrId;
  assertContract(manifest, "Unknown app manifest.");
  return Object.freeze({
    ...manifest,
    legacyUrl: manifest.launchMode === "legacy-external" || manifest.launchMode === "same-origin" ? resolveLegacyLaunch(manifest, environment) : null,
  });
}

export function listLauncherCards(area, environment = {}) {
  return appManifests.filter((manifest) => manifest.area === area).map((manifest) => toLauncherCard(manifest, environment));
}

export function listPlatformGames(environment = {}) {
  return appManifests.filter((manifest) => manifest.area === "arcade" && manifest.launchMode === "legacy-external").map((manifest) => {
    const card = toLauncherCard(manifest, environment);
    return { id: card.id, title: card.title, route: card.legacyUrl, description: card.subtitle, isPublic: card.access === "public-host", status: "active", color: card.color, icon: card.icon };
  });
}

validateAppRegistry();

import { listPlatformGames } from "@forge/app-registry";
import { readPostgresStore, writePostgresStore } from "./postgres-store.js";

const PLATFORM_DATA_STORE_ID = "platform-registry";

const GAME_SEED = listPlatformGames(process.env).map((game) => ({ ...game, hostUserIds: ["aditi"] }));

function defaultPlatformData() {
  return {
    users: [
      {
        id: "aditi",
        name: "Aditi",
        emailOrUsername: "aditi@aischennai.org",
        role: "owner",
        hostGameIds: GAME_SEED.map((game) => game.id),
        createdAt: new Date().toISOString(),
      },
      {
        id: "caditi28",
        name: "Caditi",
        emailOrUsername: "caditi28@aischennai.org",
        role: "owner",
        hostGameIds: GAME_SEED.map((game) => game.id),
        createdAt: new Date().toISOString(),
      },
    ],
    gameConfigs: GAME_SEED,
  };
}

export async function readPlatformData() {
  const data = await readPostgresStore(defaultPlatformData(), PLATFORM_DATA_STORE_ID);
  return {
    users: Array.isArray(data.users) ? data.users : [],
    gameConfigs: Array.isArray(data.gameConfigs) ? data.gameConfigs : [],
  };
}

export async function writePlatformData(data) {
  await writePostgresStore(data, PLATFORM_DATA_STORE_ID);
}

function normalizeLookup(value) {
  return String(value || "").trim().toLowerCase();
}

function uniqueIds(ids) {
  return Array.from(new Set((ids || []).map((id) => String(id).trim()).filter(Boolean)));
}

function withRegistryLaunch(game) {
  const registryGame = listPlatformGames(process.env).find((entry) => entry.id === game.id);
  return registryGame ? { ...game, route: registryGame.route } : game;
}

function syncUserHostGames(data, userId, hostGameIds) {
  for (const game of data.gameConfigs) {
    const shouldHost = hostGameIds.includes(game.id);
    game.hostUserIds = uniqueIds(game.hostUserIds || []);
    if (shouldHost) {
      if (!game.hostUserIds.includes(userId)) game.hostUserIds.push(userId);
    } else {
      game.hostUserIds = game.hostUserIds.filter((id) => id !== userId);
    }
  }
}

export function getPublicGames(data) {
  return (data.gameConfigs || []).filter((game) => game.isPublic && game.status === "active").map(withRegistryLaunch);
}

export function getAllGamesForAdmin(data) {
  return (data.gameConfigs || []).map(withRegistryLaunch);
}

export function findUserByLogin(data, emailOrUsername) {
  const lookup = normalizeLookup(emailOrUsername);
  if (!lookup) return null;
  return (data.users || []).find((user) => {
    const userEmail = normalizeLookup(user.emailOrUsername);
    const userName = normalizeLookup(user.name);
    return user.id === lookup || userEmail === lookup || userName === lookup;
  }) || null;
}

export function canUserHostGame(data, emailOrUsername, gameId) {
  const user = findUserByLogin(data, emailOrUsername);
  const game = (data.gameConfigs || []).find((entry) => entry.id === gameId);

  if (!game) {
    return { canHost: false, reason: "Game not found.", user: null, game: null };
  }

  if (game.status === "hidden" && user?.role !== "owner") {
    return { canHost: false, reason: "This game is currently unavailable.", user, game };
  }

  if (!user) {
    return { canHost: false, reason: "You are not assigned as a host for this game. Ask Aditi for access.", user: null, game };
  }

  if (user.role === "owner") {
    return { canHost: true, reason: "Owner access granted.", user, game };
  }

  if ((user.hostGameIds || []).includes(gameId)) {
    return { canHost: true, reason: "Host access granted.", user, game };
  }

  if (!game.isPublic && game.status === "active") {
    return { canHost: false, reason: "This game is currently private. Ask the host for access.", user, game };
  }

  if (game.isPublic && game.status === "active") {
    return { canHost: false, reason: "You are not assigned as a host for this game. Ask Aditi for access.", user, game };
  }

  if (!game.isPublic) {
    return { canHost: false, reason: "This game is currently private. Ask the host for access.", user, game };
  }

  return { canHost: false, reason: "You are not assigned as a host for this game. Ask Aditi for access.", user, game };
}

export async function addOrUpdateUser(input) {
  const data = await readPlatformData();
  const lookup = normalizeLookup(input.id || input.emailOrUsername || input.name);
  const nextUser = {
    id: String(input.id || lookup || `user-${Math.random().toString(36).slice(2, 9)}`),
    name: String(input.name || "").trim(),
    emailOrUsername: String(input.emailOrUsername || "").trim(),
    role: input.role || "other",
    hostGameIds: uniqueIds(input.hostGameIds),
    createdAt: input.createdAt || new Date().toISOString(),
  };

  const existingIndex = data.users.findIndex((user) => normalizeLookup(user.id) === lookup || normalizeLookup(user.emailOrUsername) === normalizeLookup(nextUser.emailOrUsername));
  if (existingIndex >= 0) {
    const existing = data.users[existingIndex];
    const merged = { ...existing, ...nextUser, createdAt: existing.createdAt || nextUser.createdAt };
    if (merged.role === "owner") {
      merged.hostGameIds = data.gameConfigs.map((game) => game.id);
    }
    data.users[existingIndex] = merged;
    syncUserHostGames(data, merged.id, merged.hostGameIds);
    await writePlatformData(data);
    return merged;
  }

  if (nextUser.role === "owner") {
    nextUser.hostGameIds = data.gameConfigs.map((game) => game.id);
  }

  data.users.push(nextUser);
  syncUserHostGames(data, nextUser.id, nextUser.hostGameIds);
  await writePlatformData(data);
  return nextUser;
}

export async function updateGameVisibility(gameId, patch) {
  const data = await readPlatformData();
  const game = data.gameConfigs.find((entry) => entry.id === gameId);
  if (!game) return null;

  if (typeof patch.isPublic === "boolean") {
    game.isPublic = patch.isPublic;
  }

  if (patch.status === "active" || patch.status === "hidden") {
    game.status = patch.status;
  }

  await writePlatformData(data);
  return game;
}

export async function updateHostAssignments(gameId, hostUserIds) {
  const data = await readPlatformData();
  const game = data.gameConfigs.find((entry) => entry.id === gameId);
  if (!game) return null;

  const nextHostIds = uniqueIds(hostUserIds);
  game.hostUserIds = nextHostIds;

  for (const user of data.users) {
    const shouldHost = nextHostIds.includes(user.id);
    user.hostGameIds = uniqueIds(user.hostGameIds);
    if (shouldHost) {
      if (!user.hostGameIds.includes(gameId)) user.hostGameIds.push(gameId);
    } else {
      user.hostGameIds = user.hostGameIds.filter((id) => id !== gameId);
    }
    if (user.role === "owner") {
      user.hostGameIds = data.gameConfigs.map((entry) => entry.id);
      game.hostUserIds = uniqueIds([...new Set([...game.hostUserIds, user.id])]);
    }
  }

  await writePlatformData(data);
  return game;
}

export async function deleteUser(userId) {
  const data = await readPlatformData();
  const index = data.users.findIndex((user) => user.id === userId);
  if (index < 0) return null;
  const [removed] = data.users.splice(index, 1);
  for (const game of data.gameConfigs) {
    game.hostUserIds = uniqueIds((game.hostUserIds || []).filter((id) => id !== userId));
  }
  await writePlatformData(data);
  return removed;
}

export async function setGameHostsFromUser(userId, hostGameIds) {
  const data = await readPlatformData();
  const user = data.users.find((entry) => entry.id === userId);
  if (!user) return null;
  user.hostGameIds = uniqueIds(hostGameIds);
  if (user.role === "owner") {
    user.hostGameIds = data.gameConfigs.map((game) => game.id);
  }
  syncUserHostGames(data, user.id, user.hostGameIds);
  await writePlatformData(data);
  return user;
}

export async function syncPlatformDefaults() {
  const data = await readPlatformData();
  const owner = data.users.find((user) => user.role === "owner");
  if (owner) {
    owner.hostGameIds = data.gameConfigs.map((game) => game.id);
  }
  for (const game of data.gameConfigs) {
    if (!Array.isArray(game.hostUserIds)) game.hostUserIds = [];
    if (owner && !game.hostUserIds.includes(owner.id)) game.hostUserIds.push(owner.id);
  }
  await writePlatformData(data);
  return data;
}

import http from "node:http";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import {
  addOrUpdateUser,
  canUserHostGame,
  deleteUser,
  findUserByLogin,
  getAllGamesForAdmin,
  getPublicGames,
  readPlatformData,
  setGameHostsFromUser,
  updateGameVisibility,
  updateHostAssignments,
  syncPlatformDefaults,
} from "./platform-data.js";
import { readPostgresStore, writePostgresStore } from "./postgres-store.js";
import { createGoogleVerifier } from "./google-verifier.js";
import { createSupabaseTokenVerifier, supabaseAuthConfigured } from "./supabase-auth.js";
import { deckForGame, deckSummary, extractDeckItems, validatePdfDeck } from "./deck-pipeline.js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const PORT = Number(process.env.PLATFORM_SERVER_PORT || process.env.PORT || 8787);
const COOKIE_NAME = "party_games_session";
const SCHOOL_DOMAIN = "@aischennai.org";
const AUTH_RATE_LIMIT_WINDOW_MS = 60_000;
const AUTH_RATE_LIMIT_MAX_ATTEMPTS = 10;
const __filename = fileURLToPath(import.meta.url);
const googleAuthAttempts = new Map();
let sessionTtlMs = Number(process.env.SESSION_TTL_MS || 8 * 60 * 60 * 1000);

function loadTestGoogleFixtures() {
  if (process.env.NODE_ENV !== "test" || !process.env.AUTH_TEST_GOOGLE_FIXTURES) return {};
  try {
    const fixtures = JSON.parse(process.env.AUTH_TEST_GOOGLE_FIXTURES);
    return fixtures && typeof fixtures === "object" ? fixtures : {};
  } catch {
    throw new Error("AUTH_TEST_GOOGLE_FIXTURES must contain a JSON object.");
  }
}

const testGoogleFixtures = loadTestGoogleFixtures();

const defaultStore = {
  users: [],
  sessions: {},
  games: {
    counts: {},
    history: [],
    userPlays: {},
    ratings: [],
  },
  decks: [],
  chats: {
    threads: [],
  },
  privateApps: {
    all: [
      {
        id: "sample-private-app",
        title: "Sample Private App",
        description: "Placeholder private app for invite requests and access previews.",
        owner: "AISC school admin",
        members: ["School admins"],
      },
    ],
    invites: {},
    memberships: {},
    requests: {},
  },
};

async function readStore() {
  return readPostgresStore(defaultStore);
}

async function writeStore(store) {
  return writePostgresStore(store);
}

function json(res, status, payload, extraHeaders = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    ...extraHeaders,
  });
  res.end(JSON.stringify(payload));
}

function setCorsHeaders(req, res) {
  const origin = req.headers.origin || "";
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return header.split(";").reduce((acc, pair) => {
    const [rawKey, ...rest] = pair.trim().split("=");
    if (!rawKey) return acc;
    acc[decodeURIComponent(rawKey)] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}

function setCookie(res, name, value) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${encodeURIComponent(name)}=${encodeURIComponent(value)}; HttpOnly; Path=/; Max-Age=${Math.floor(sessionTtlMs / 1000)}; SameSite=Lax${secure}`);
}

function clearCookie(res, name) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${encodeURIComponent(name)}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure}`);
}

function isTrustedMutationOrigin(req) {
  const origin = String(req.headers.origin || "");
  if (!origin) return true;
  const configuredOrigins = String(process.env.TRUSTED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || configuredOrigins.includes(origin);
}

function consumeGoogleAuthAttempt(req) {
  const now = Date.now();
  const key = req.socket.remoteAddress || "unknown";
  const attempts = (googleAuthAttempts.get(key) || []).filter((at) => now - at < AUTH_RATE_LIMIT_WINDOW_MS);
  if (attempts.length >= AUTH_RATE_LIMIT_MAX_ATTEMPTS) {
    return Math.ceil((AUTH_RATE_LIMIT_WINDOW_MS - (now - attempts[0])) / 1000);
  }
  attempts.push(now);
  googleAuthAttempts.set(key, attempts);
  return 0;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function decodeDataUrl(dataUrl) {
  const value = String(dataUrl || "");
  const match = value.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return null;
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

async function extractPdfText(buffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
  });

  const document = await loadingTask.promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => (typeof item.str === "string" ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) {
      pages.push(text);
    }
  }

  return pages.join("\n").trim();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  if (typeof salt !== "string" || typeof hash !== "string" || !salt || !hash) return false;
  const attempted = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return attempted.length === expected.length && crypto.timingSafeEqual(attempted, expected);
}

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, passwordSalt, ...safe } = user;
  return safe;
}

function currentUserFromRequest(req, store) {
  const cookies = parseCookies(req);
  const sessionId = cookies[COOKIE_NAME];
  const session = sessionId ? store.sessions[sessionId] : null;
  const userId = typeof session === "string" ? session : session?.userId;
  if (session && typeof session === "object" && Date.parse(session.expiresAt || "") <= Date.now()) return null;
  if (!userId) return null;
  return store.users.find((user) => user.id === userId) || null;
}

export async function realtimeUserFromCookie(cookie) {
  const store = await readStore();
  return sanitizeUser(currentUserFromRequest({ headers: { cookie: String(cookie || "") } }, store));
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeLogin(login) {
  return String(login || "").trim().toLowerCase();
}

function loginMatchesUser(user, login) {
  const normalized = normalizeLogin(login);
  if (!normalized || !user) return false;
  return [user.id, user.name, user.username, user.email].some((value) => normalizeLogin(value) === normalized);
}

function schoolEmail(email) {
  return normalizeEmail(email).endsWith(SCHOOL_DOMAIN);
}

function getOwnerLoginEmail() {
  return "caditi28@aischennai.org";
}

function legacyPasswordAuthDisabled() {
  return process.env.NODE_ENV === "production" && process.env.ALLOW_LEGACY_PASSWORD_AUTH !== "true";
}

function requireLegacyPasswordAuth(res) {
  if (!legacyPasswordAuthDisabled()) return false;
  sendJsonError(res, 403, "Password authentication is disabled. Sign in with Google.");
  return true;
}

const productionGoogleVerifier = createGoogleVerifier({ clientId: GOOGLE_CLIENT_ID });
const productionSupabaseVerifier = createSupabaseTokenVerifier();
let verifyGoogleIdToken = async (credential) => {
  const fixture = testGoogleFixtures[String(credential || "")];
  if (fixture) {
    if (fixture.error) throw new Error(fixture.error);
    return fixture;
  }
  return productionGoogleVerifier(credential);
};
let verifySupabaseAccessToken = productionSupabaseVerifier;

export function setGoogleVerifierForTests(verifier) {
  verifyGoogleIdToken = verifier;
}

export function setSupabaseVerifierForTests(verifier) {
  verifySupabaseAccessToken = verifier || productionSupabaseVerifier;
}

export function setSessionTtlForTests(ttlMs) {
  sessionTtlMs = ttlMs;
}

export function resetAuthRateLimitForTests() {
  googleAuthAttempts.clear();
}

function topEntryFromCounts(counts) {
  return Object.entries(counts || {}).sort((a, b) => b[1] - a[1])[0] || null;
}

function buildUserStats(store, userId) {
  const plays = store.games.userPlays[userId] || [];
  const counts = plays.reduce((acc, item) => {
    acc[item.title] = (acc[item.title] || 0) + 1;
    return acc;
  }, {});
  const recentGame = plays[0] || null;
  const mostPlayed = topEntryFromCounts(counts);
  const hubMostPopular = topEntryFromCounts(store.games.counts);
  const ratings = store.games.ratings.filter((entry) => entry.userId === userId);

  return {
    recentGame,
    mostPlayedGame: mostPlayed ? { title: mostPlayed[0], count: mostPlayed[1] } : null,
    hubMostPopularGame: hubMostPopular ? { title: hubMostPopular[0], count: hubMostPopular[1] } : null,
    ratings,
  };
}

function buildThreads(store, userId) {
  return store.chats.threads
    .filter((thread) => thread.memberIds.includes(userId))
    .map((thread) => ({
      ...thread,
      memberNames: thread.memberIds.map((memberId) => sanitizeUser(store.users.find((user) => user.id === memberId))?.name || "Unknown"),
    }));
}

function buildPrivateApps(store, userId) {
  return {
    invites: store.privateApps.invites[userId] || [],
    memberships: store.privateApps.memberships[userId] || [],
    all: store.privateApps.all,
    requestedIds: store.privateApps.requests[userId] || [],
  };
}

async function bootstrapPayload(store, user) {
  if (!user) {
    return { user: null };
  }

  return {
    user: sanitizeUser(user),
    stats: buildUserStats(store, user.id),
    decks: store.decks || [],
    chats: {
      threads: buildThreads(store, user.id),
    },
    privateApps: buildPrivateApps(store, user.id),
  };
}

function createSession(store, userId, ttlMs = sessionTtlMs) {
  const sessionId = crypto.randomUUID();
  store.sessions[sessionId] = { userId, expiresAt: new Date(Date.now() + ttlMs).toISOString() };
  return sessionId;
}

function deleteSession(store, sessionId) {
  delete store.sessions[sessionId];
}

function deleteUserSessions(store, userId) {
  for (const [sessionId, sessionUserId] of Object.entries(store.sessions)) {
    if (sessionUserId === userId) {
      delete store.sessions[sessionId];
    }
  }
}

function sendJsonError(res, status, message) {
  json(res, status, { error: message });
}

async function requireAdmin(req, res) {
  const store = await readStore();
  const currentUser = currentUserFromRequest(req, store);
  if (!currentUser) return null;
  const data = await readPlatformData();
  const platformUser = findUserByLogin(data, currentUser.email || currentUser.username || currentUser.name);
  if (platformUser?.role !== "admin") return null;
  return { currentUser, data, platformUser };
}

async function handleSignup(req, res) {
  if (requireLegacyPasswordAuth(res)) return;
  const store = await readStore();
  const body = await readBody(req);
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  const name = String(body.name || "").trim();
  const username = String(body.username || "").trim();
  const avatar = String(body.avatar || "").trim();

  if (!name || !username || !email || !password) {
    return sendJsonError(res, 400, "Name, username, email, and password are required.");
  }

  if (!schoolEmail(email)) {
    return sendJsonError(res, 400, "Only @aischennai.org email addresses can be used.");
  }

  if (store.users.some((user) => user.email === email)) {
    return sendJsonError(res, 409, "That account already exists. Use Log in instead.");
  }

  const { salt, hash } = hashPassword(password);
  const user = {
    id: crypto.randomUUID(),
    name,
    username,
    email,
    avatar,
    passwordSalt: salt,
    passwordHash: hash,
  };

  store.users.push(user);
  const sessionId = createSession(store, user.id);
  await writeStore(store);
  setCookie(res, COOKIE_NAME, sessionId);
  json(res, 201, await bootstrapPayload(store, user));
}

async function handleLogin(req, res) {
  if (requireLegacyPasswordAuth(res)) return;
  const store = await readStore();
  const body = await readBody(req);
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");

  if (!email || !password) {
    return sendJsonError(res, 400, "Email and password are required.");
  }

  if (!schoolEmail(email)) {
    return sendJsonError(res, 400, "Only @aischennai.org email addresses can be used.");
  }

  const user = store.users.find((entry) => entry.email === email);
  if (!user) {
    return sendJsonError(res, 401, "No account found for that email.");
  }

  if (!user.passwordSalt || !user.passwordHash) {
    return sendJsonError(res, 401, "This account has no local password. Use Forgot password? to set one, or sign in with Google.");
  }

  if (!verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    return sendJsonError(res, 401, "Incorrect password for that email.");
  }

  const sessionId = createSession(store, user.id);
  await writeStore(store);
  setCookie(res, COOKIE_NAME, sessionId);
  json(res, 200, await bootstrapPayload(store, user));
}

async function handleGoogleAuth(req, res) {
  if (supabaseAuthConfigured()) return sendJsonError(res, 410, "Google sign-in is handled by Supabase Auth.");
  const retryAfter = consumeGoogleAuthAttempt(req);
  if (retryAfter) return json(res, 429, { error: "Too many Google sign-in attempts. Try again shortly." }, { "Retry-After": String(retryAfter) });
  const store = await readStore();
  const body = await readBody(req);

  if (!GOOGLE_CLIENT_ID) {
    return sendJsonError(res, 503, "Google sign-in is not configured yet.");
  }

  let profile;
  try {
    profile = await verifyGoogleIdToken(body.credential);
  } catch (error) {
    return sendJsonError(res, 401, error.message || "Unable to verify Google sign-in.");
  }

  const isOwnerEmail = profile.email === getOwnerLoginEmail();
  const existing = store.users.find((entry) => normalizeEmail(entry.email) === profile.email);
  let user = existing || null;

  if (!user) {
    const baseUsername = profile.email.split("@")[0].replace(/[^a-z0-9._-]/g, "");
    user = {
      id: crypto.randomUUID(),
      name: profile.name || "AISC User",
      username: baseUsername || `user-${crypto.randomUUID().slice(0, 8)}`,
      email: profile.email,
      avatar: profile.picture || "",
      role: isOwnerEmail ? "admin" : "student",
      authProvider: "google",
      googleSub: profile.googleSub,
      createdAt: new Date().toISOString(),
    };
    store.users.push(user);
  } else {
    user.name = profile.name || user.name;
    user.username = user.username || profile.email.split("@")[0];
    user.avatar = profile.picture || user.avatar || "";
    user.role = isOwnerEmail ? "admin" : (user.role === "member" || user.role === "owner" || !user.role ? "student" : user.role);
    user.authProvider = "google";
    user.googleSub = profile.googleSub;
  }

  if (isOwnerEmail) {
    user.role = "admin";
  }

  const sessionId = createSession(store, user.id, Number.isFinite(profile.sessionTtlMs) ? profile.sessionTtlMs : sessionTtlMs);
  await writeStore(store);
  setCookie(res, COOKIE_NAME, sessionId);
  json(res, 200, await bootstrapPayload(store, user));
}

async function handleSupabaseAuth(req, res) {
  const retryAfter = consumeGoogleAuthAttempt(req);
  if (retryAfter) return json(res, 429, { error: "Too many sign-in attempts. Try again shortly." }, { "Retry-After": String(retryAfter) });
  const store = await readStore();
  const body = await readBody(req);
  let profile;
  try {
    profile = await verifySupabaseAccessToken(body.accessToken);
  } catch (error) {
    return sendJsonError(res, 401, error.message || "Unable to verify the Supabase session.");
  }

  const existing = store.users.find((entry) => entry.supabaseUserId === profile.id || normalizeEmail(entry.email) === profile.email);
  const user = existing || {
    id: crypto.randomUUID(),
    username: profile.email.split("@")[0].replace(/[^a-z0-9._-]/g, "") || `user-${crypto.randomUUID().slice(0, 8)}`,
    role: "student",
    createdAt: new Date().toISOString(),
  };
  user.name = profile.name || user.name || "AISC User";
  user.email = profile.email;
  user.avatar = profile.picture || user.avatar || "";
  user.authProvider = "supabase-google";
  user.supabaseUserId = profile.id;
  if (!existing) store.users.push(user);

  const platformData = await readPlatformData();
  let platformUser = findUserByLogin(platformData, profile.email);
  if (!platformUser) {
    platformUser = await addOrUpdateUser({ name: user.name, emailOrUsername: profile.email, role: "student", hostGameIds: [] });
  }
  user.role = platformUser.role;

  const sessionId = createSession(store, user.id);
  await writeStore(store);
  setCookie(res, COOKIE_NAME, sessionId);
  json(res, 200, await bootstrapPayload(store, user));
}

async function handleResetPassword(req, res) {
  if (requireLegacyPasswordAuth(res)) return;
  const store = await readStore();
  const body = await readBody(req);
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  const confirmPassword = String(body.confirmPassword || "");

  if (!email || !password || !confirmPassword) {
    return sendJsonError(res, 400, "Email, new password, and confirmation are required.");
  }

  if (!schoolEmail(email)) {
    return sendJsonError(res, 400, "Only @aischennai.org email addresses can be used.");
  }

  if (password !== confirmPassword) {
    return sendJsonError(res, 400, "Passwords do not match.");
  }

  const user = store.users.find((entry) => entry.email === email);
  if (!user) {
    return sendJsonError(res, 404, "No account found for that email.");
  }

  const { salt, hash } = hashPassword(password);
  user.passwordSalt = salt;
  user.passwordHash = hash;
  deleteUserSessions(store, user.id);

  const sessionId = createSession(store, user.id);
  await writeStore(store);
  setCookie(res, COOKIE_NAME, sessionId);
  json(res, 200, await bootstrapPayload(store, user));
}

async function handleLogout(req, res) {
  const store = await readStore();
  const cookies = parseCookies(req);
  const sessionId = cookies[COOKIE_NAME];
  if (sessionId) {
    deleteSession(store, sessionId);
    await writeStore(store);
  }
  clearCookie(res, COOKIE_NAME);
  json(res, 200, { ok: true });
}

async function handleBootstrap(req, res) {
  const store = await readStore();
  const user = currentUserFromRequest(req, store);
  json(res, 200, await bootstrapPayload(store, user));
}

async function handleProfile(req, res) {
  const store = await readStore();
  const user = currentUserFromRequest(req, store);
  if (!user) return sendJsonError(res, 401, "Not signed in.");

  const body = await readBody(req);
  if (typeof body.username === "string" && body.username.trim()) {
    user.username = body.username.trim();
  }
  if (typeof body.avatar === "string") {
    user.avatar = body.avatar.trim();
  }

  await writeStore(store);
  json(res, 200, await bootstrapPayload(store, user));
}

async function handleGamePlay(req, res) {
  const store = await readStore();
  const user = currentUserFromRequest(req, store);
  if (!user) return sendJsonError(res, 401, "Not signed in.");

  const body = await readBody(req);
  const title = String(body.title || "").trim();
  if (!title) return sendJsonError(res, 400, "Game title is required.");

  const playedAt = new Date().toISOString();
  store.games.counts[title] = (store.games.counts[title] || 0) + 1;
  store.games.history.unshift({ id: crypto.randomUUID(), title, userId: user.id, playedAt });
  store.games.history = store.games.history.slice(0, 200);
  store.games.userPlays[user.id] = store.games.userPlays[user.id] || [];
  store.games.userPlays[user.id].unshift({ id: crypto.randomUUID(), title, playedAt });
  store.games.userPlays[user.id] = store.games.userPlays[user.id].slice(0, 20);
  await writeStore(store);
  json(res, 200, { ok: true });
}

async function handleRateGame(req, res) {
  const store = await readStore();
  const user = currentUserFromRequest(req, store);
  if (!user) return sendJsonError(res, 401, "Not signed in.");

  const body = await readBody(req);
  const game = String(body.game || "").trim();
  const stars = Number(body.stars || 0);
  if (!game || !Number.isFinite(stars) || stars < 1 || stars > 5) {
    return sendJsonError(res, 400, "Game and stars are required.");
  }

  store.games.ratings = store.games.ratings.filter((entry) => !(entry.userId === user.id && entry.game === game));
  store.games.ratings.push({ id: crypto.randomUUID(), userId: user.id, game, stars, createdAt: new Date().toISOString() });
  await writeStore(store);
  json(res, 200, { ok: true });
}

async function handleSearchUsers(req, res, url) {
  const store = await readStore();
  const user = currentUserFromRequest(req, store);
  if (!user) return sendJsonError(res, 401, "Not signed in.");

  const query = String(url.searchParams.get("q") || "").trim().toLowerCase();
  if (!query) return json(res, 200, { users: [] });

  const users = store.users
    .filter((entry) => entry.id !== user.id)
    .filter((entry) => entry.email.includes(query) || entry.name.toLowerCase().includes(query) || entry.username.toLowerCase().includes(query))
    .map(sanitizeUser);

  json(res, 200, { users });
}

async function handleDirectChat(req, res) {
  const store = await readStore();
  const user = currentUserFromRequest(req, store);
  if (!user) return sendJsonError(res, 401, "Not signed in.");

  const body = await readBody(req);
  const recipientId = String(body.recipientId || "").trim();
  if (!recipientId) return sendJsonError(res, 400, "recipientId is required.");

  const recipient = store.users.find((entry) => entry.id === recipientId);
  if (!recipient) return sendJsonError(res, 404, "Recipient not found.");

  const existing = store.chats.threads.find(
    (thread) => thread.type === "direct" && thread.memberIds.length === 2 && thread.memberIds.includes(user.id) && thread.memberIds.includes(recipient.id),
  );

  if (existing) {
    json(res, 200, { thread: existing });
    return;
  }

  const thread = {
    id: crypto.randomUUID(),
    type: "direct",
    name: recipient.name,
    memberIds: [user.id, recipient.id],
    createdAt: new Date().toISOString(),
    messages: [],
  };

  store.chats.threads.unshift(thread);
  await writeStore(store);
  json(res, 201, { thread });
}

async function handleGroupChat(req, res) {
  const store = await readStore();
  const user = currentUserFromRequest(req, store);
  if (!user) return sendJsonError(res, 401, "Not signed in.");

  const body = await readBody(req);
  const groupName = String(body.groupName || "").trim();
  const memberIds = Array.isArray(body.memberIds) ? body.memberIds.map((value) => String(value).trim()).filter(Boolean) : [];

  if (!groupName || memberIds.length < 2) {
    return sendJsonError(res, 400, "A group name and at least two members are required.");
  }

  const uniqueMemberIds = Array.from(new Set([user.id, ...memberIds])).filter((memberId) => store.users.some((entry) => entry.id === memberId));
  if (uniqueMemberIds.length < 3) {
    return sendJsonError(res, 400, "Select at least two other people.");
  }

  const thread = {
    id: crypto.randomUUID(),
    type: "group",
    name: groupName,
    memberIds: uniqueMemberIds,
    createdAt: new Date().toISOString(),
    messages: [],
  };

  store.chats.threads.unshift(thread);
  await writeStore(store);
  json(res, 201, { thread });
}

async function handleMessage(req, res, threadId) {
  const store = await readStore();
  const user = currentUserFromRequest(req, store);
  if (!user) return sendJsonError(res, 401, "Not signed in.");

  const thread = store.chats.threads.find((entry) => entry.id === threadId);
  if (!thread) return sendJsonError(res, 404, "Thread not found.");
  if (!thread.memberIds.includes(user.id)) return sendJsonError(res, 403, "You cannot post to this thread.");

  const body = await readBody(req);
  const text = String(body.text || "").trim();
  if (!text) return sendJsonError(res, 400, "Message text is required.");

  thread.messages.push({
    id: crypto.randomUUID(),
    senderId: user.id,
    senderName: user.name,
    text,
    createdAt: new Date().toISOString(),
  });

  await writeStore(store);
  json(res, 200, { thread });
}

async function handleRequestPrivateApp(req, res) {
  const store = await readStore();
  const user = currentUserFromRequest(req, store);
  if (!user) return sendJsonError(res, 401, "Not signed in.");

  const body = await readBody(req);
  const appId = String(body.appId || "").trim();
  const app = store.privateApps.all.find((entry) => entry.id === appId);
  if (!app) return sendJsonError(res, 404, "Private app not found.");

  store.privateApps.requests[user.id] = Array.from(new Set([...(store.privateApps.requests[user.id] || []), appId]));
  await writeStore(store);
  json(res, 200, { requestedIds: store.privateApps.requests[user.id] });
}

async function handleDecks(req, res) {
  const store = await readStore();
  const user = currentUserFromRequest(req, store);

  if (req.method === "GET") {
    if (!user) return sendJsonError(res, 401, "Not signed in.");
    return json(res, 200, { decks: (store.decks || []).map(deckSummary) });
  }

  if (req.method === "POST") {
    if (!user) return sendJsonError(res, 401, "Not signed in.");

    const body = await readBody(req);
    const title = String(body.title || "").trim();
    const fileName = String(body.fileName || "").trim();
    const dataUrl = String(body.dataUrl || "").trim();
    const decoded = decodeDataUrl(dataUrl);

    let validated;
    try {
      validated = validatePdfDeck({ title, fileName: fileName || `${title}.pdf`, decoded });
    } catch (error) {
      return sendJsonError(res, 400, error.message);
    }

    const text = await extractPdfText(decoded.buffer).catch(() => "");
    const items = extractDeckItems(text);
    const deck = {
      id: crypto.randomUUID(),
      title: validated.title,
      fileName: validated.fileName,
      mimeType: decoded.mimeType,
      text,
      items,
      extraction: { status: "complete", itemCount: items.length, completedAt: new Date().toISOString() },
      sourceDataUrl: dataUrl,
      uploadedByUserId: user.id,
      uploadedByName: user.name,
      createdAt: new Date().toISOString(),
    };

    store.decks = [deck, ...(store.decks || [])];
    await writeStore(store);
    return json(res, 201, { deck: deckSummary(deck), decks: store.decks.map(deckSummary) });
  }

  return sendJsonError(res, 405, "Method not allowed.");
}

async function handleDeckById(req, res, deckId) {
  const store = await readStore();
  const user = currentUserFromRequest(req, store);
  if (!user) return sendJsonError(res, 401, "Not signed in.");

  const index = (store.decks || []).findIndex((deck) => deck.id === deckId);
  if (index < 0) return sendJsonError(res, 404, "Deck not found.");

  const deck = store.decks[index];
  const isOwner = deck.uploadedByUserId === user.id;
  if (req.method === "GET") {
    const gameId = new URL(req.url || "", "http://localhost").searchParams.get("gameId");
    if (gameId) return json(res, 200, { deck: deckForGame(deck, gameId) });
    return json(res, 200, { deck: deckSummary(deck) });
  }

  if (req.method === "DELETE") {
    if (!isOwner) return sendJsonError(res, 403, "Only the deck owner can delete this deck.");
    const [removed] = store.decks.splice(index, 1);
    await writeStore(store);
    return json(res, 200, { deck: deckSummary(removed), decks: store.decks.map(deckSummary) });
  }

  return sendJsonError(res, 405, "Method not allowed.");
}

async function handlePlatformGames(req, res) {
  const data = await readPlatformData();
  json(res, 200, { games: getPublicGames(data) });
}

async function handlePlatformAdminGames(req, res) {
  const authorization = await requireAdmin(req, res);
  if (!authorization) return sendJsonError(res, 403, "Admin access is required.");
  json(res, 200, { games: getAllGamesForAdmin(authorization.data) });
}

async function handlePlatformGameAccess(req, res, gameId) {
  const data = await readPlatformData();
  const game = data.gameConfigs.find((entry) => entry.id === gameId);
  if (!game) return sendJsonError(res, 404, "Game not found.");
  json(res, 200, {
    id: game.id,
    title: game.title,
    route: game.route,
    isPublic: game.isPublic,
    status: game.status,
    canOpen: game.status === "active" && game.isPublic,
  });
}

async function handlePlatformCanHost(req, res) {
  const body = await readBody(req);
  const data = await readPlatformData();
  const authStore = await readStore();
  const currentUser = currentUserFromRequest(req, authStore);
  const gameId = String(body.gameId || "").trim();
  const login = normalizeLogin(body.emailOrUsername || body.username || currentUser?.username || currentUser?.email || currentUser?.name);
  const game = data.gameConfigs.find((entry) => entry.id === gameId);

  if (!game) {
    return json(res, 200, { canHost: false, reason: "Game not found.", user: null, game: null });
  }

  if (game.isPublic && game.status === "active") {
    const user = currentUser || (login ? data.users.find((entry) => loginMatchesUser(entry, login)) : null);
    return json(res, 200, {
      canHost: true,
      reason: "Public host access granted.",
      user: user ? sanitizeUser(user) : null,
      game,
    });
  }

  const result = canUserHostGame(data, login, gameId);
  if (!result.canHost && login && currentUser && !loginMatchesUser(currentUser, login)) {
    return json(res, 200, { ...result, reason: "username incorrect", user: sanitizeUser(currentUser) });
  }

  if (!result.canHost && !login) {
    return json(res, 200, { ...result, reason: "username incorrect" });
  }

  json(res, 200, result);
}

async function handlePlatformAdminUsers(req, res) {
  const authorization = await requireAdmin(req, res);
  if (!authorization) return sendJsonError(res, 403, "Admin access is required.");
  const body = req.method === "POST" ? await readBody(req) : {};

  if (req.method === "GET") {
    return json(res, 200, { users: authorization.data.users });
  }

  if (req.method === "POST") {
    const user = await addOrUpdateUser({
      name: body.name,
      emailOrUsername: body.emailOrUsername,
      role: body.role,
      hostGameIds: body.hostGameIds || [],
    });
    return json(res, 201, { user });
  }

  return sendJsonError(res, 405, "Method not allowed.");
}

async function handlePlatformAdminUserById(req, res, userId) {
  const authorization = await requireAdmin(req, res);
  if (!authorization) return sendJsonError(res, 403, "Admin access is required.");
  const body = await readBody(req);
  const data = authorization.data;
  const user = data.users.find((entry) => entry.id === userId);
  if (!user) return sendJsonError(res, 404, "User not found.");

  if (req.method === "PATCH") {
    if (user.role === "admin" && body.role !== undefined && body.role !== "admin" && data.users.filter((entry) => entry.role === "admin").length <= 1) {
      return sendJsonError(res, 400, "You cannot demote the final admin.");
    }
    const updated = await addOrUpdateUser({
      id: userId,
      name: typeof body.name === "string" ? body.name : user.name,
      emailOrUsername: typeof body.emailOrUsername === "string" ? body.emailOrUsername : user.emailOrUsername,
      role: typeof body.role === "string" ? body.role : user.role,
      hostGameIds: Array.isArray(body.hostGameIds) ? body.hostGameIds : user.hostGameIds,
      createdAt: user.createdAt,
    });
    return json(res, 200, { user: updated });
  }

  if (req.method === "DELETE") {
    if (user.role === "admin" && data.users.filter((entry) => entry.role === "admin").length <= 1) {
      return sendJsonError(res, 400, "You cannot remove the final admin.");
    }
    const removed = await deleteUser(userId);
    return json(res, 200, { user: removed });
  }

  return sendJsonError(res, 405, "Method not allowed.");
}

async function handlePlatformAdminGameById(req, res, gameId) {
  if (!(await requireAdmin(req, res))) return sendJsonError(res, 403, "Admin access is required.");
  const body = await readBody(req);

  if (req.method === "PATCH") {
    const game = await updateGameVisibility(gameId, body);
    if (!game) return sendJsonError(res, 404, "Game not found.");
    if (Array.isArray(body.hostUserIds)) {
      await updateHostAssignments(gameId, body.hostUserIds);
    }
    const data = await readPlatformData();
    return json(res, 200, { game: data.gameConfigs.find((entry) => entry.id === gameId) || game });
  }

  return sendJsonError(res, 405, "Method not allowed.");
}

async function handlePlatformAdminGameHosts(req, res, gameId) {
  if (!(await requireAdmin(req, res))) return sendJsonError(res, 403, "Admin access is required.");
  const body = await readBody(req);
  if (!Array.isArray(body.hostUserIds)) return sendJsonError(res, 400, "hostUserIds must be an array.");
  const game = await updateHostAssignments(gameId, body.hostUserIds);
  if (!game) return sendJsonError(res, 404, "Game not found.");
  return json(res, 200, { game });
}

const STATIC_CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

async function serveHubAsset(req, res, staticRoot, routePath) {
  if (!staticRoot || !["GET", "HEAD"].includes(req.method || "")) return false;
  const requestedPath = decodeURIComponent(routePath);
  const relativePath = requestedPath === "/" ? "index.html" : requestedPath.replace(/^\/+/, "");
  const root = path.resolve(staticRoot);
  const target = path.resolve(root, relativePath);
  if (!target.startsWith(`${root}${path.sep}`) && target !== root) return false;

  try {
    const body = await readFile(target);
    res.writeHead(200, { "Content-Type": STATIC_CONTENT_TYPES[path.extname(target)] || "application/octet-stream" });
    if (req.method === "HEAD") res.end(); else res.end(body);
    return true;
  } catch {
    if (path.extname(relativePath)) return false;
    try {
      const body = await readFile(path.join(root, "index.html"));
      res.writeHead(200, { "Content-Type": STATIC_CONTENT_TYPES[".html"] });
      if (req.method === "HEAD") res.end(); else res.end(body);
      return true;
    } catch {
      return false;
    }
  }
}

export function createHubApiServer({ staticRoot } = {}) {
  return http.createServer(async (req, res) => {
  setCorsHeaders(req, res);
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const routePath = url.pathname.startsWith("/api/") ? url.pathname.slice(4) : url.pathname;

  try {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      res.end();
      return;
    }

    if (["POST", "PATCH", "PUT", "DELETE"].includes(req.method || "") && !isTrustedMutationOrigin(req)) {
      return sendJsonError(res, 403, "Request origin is not allowed.");
    }

    if (req.method === "GET" && routePath === "/bootstrap") return await handleBootstrap(req, res);
    if (req.method === "POST" && routePath === "/signup") return await handleSignup(req, res);
    if (req.method === "POST" && routePath === "/login") return await handleLogin(req, res);
    if (req.method === "POST" && routePath === "/auth/google") return await handleGoogleAuth(req, res);
    if (req.method === "POST" && routePath === "/auth/supabase") return await handleSupabaseAuth(req, res);
    if (req.method === "POST" && routePath === "/reset-password") return await handleResetPassword(req, res);
    if (req.method === "POST" && routePath === "/logout") return await handleLogout(req, res);
    if (req.method === "PATCH" && routePath === "/profile") return await handleProfile(req, res);
    if (req.method === "POST" && routePath === "/game-play") return await handleGamePlay(req, res);
    if (req.method === "POST" && routePath === "/ratings") return await handleRateGame(req, res);
    if (req.method === "GET" && routePath === "/users/search") return await handleSearchUsers(req, res, url);
    if (req.method === "POST" && routePath === "/chats/direct") return await handleDirectChat(req, res);
    if (req.method === "POST" && routePath === "/chats/group") return await handleGroupChat(req, res);
    if (req.method === "POST" && routePath.startsWith("/chats/") && routePath.endsWith("/messages")) {
      const threadId = routePath.split("/")[2];
      return await handleMessage(req, res, threadId);
    }
    if (req.method === "POST" && routePath === "/private-apps/request") return await handleRequestPrivateApp(req, res);
    if (req.method === "GET" && routePath === "/decks") return await handleDecks(req, res);
    if (req.method === "POST" && routePath === "/decks") return await handleDecks(req, res);
    if (routePath.startsWith("/decks/") && (req.method === "GET" || req.method === "DELETE")) {
      const deckId = routePath.split("/")[2];
      return await handleDeckById(req, res, deckId);
    }
    if (req.method === "GET" && routePath === "/platform/games") return await handlePlatformGames(req, res);
    if (routePath === "/platform/admin/games" && (req.method === "GET")) return await handlePlatformAdminGames(req, res);
    if (routePath.startsWith("/platform/admin/games/") && routePath.endsWith("/hosts") && req.method === "PATCH") {
      const gameId = routePath.split("/")[4];
      return await handlePlatformAdminGameHosts(req, res, gameId);
    }
    if (routePath.startsWith("/platform/admin/games/") && req.method === "PATCH") {
      const gameId = routePath.split("/")[4];
      return await handlePlatformAdminGameById(req, res, gameId);
    }
    if (routePath === "/platform/admin/users" && req.method === "GET") return await handlePlatformAdminUsers(req, res);
    if (routePath === "/platform/admin/users" && req.method === "POST") return await handlePlatformAdminUsers(req, res);
    if (routePath.startsWith("/platform/admin/users/") && (req.method === "PATCH" || req.method === "DELETE")) {
      const userId = routePath.split("/")[4];
      return await handlePlatformAdminUserById(req, res, userId);
    }
    if (req.method === "POST" && routePath === "/platform/can-host") return await handlePlatformCanHost(req, res);
    if (req.method === "GET" && routePath.startsWith("/platform/game-access/")) {
      const gameId = routePath.split("/")[3];
      return await handlePlatformGameAccess(req, res, gameId);
    }
    if (req.method === "GET" && routePath === "/health") return json(res, 200, { ok: true });
    if (await serveHubAsset(req, res, staticRoot, url.pathname)) return;

    return json(res, 404, { error: "Not found" });
  } catch (error) {
    console.error(error);
    return sendJsonError(res, 500, error?.message || "Server error");
  }
  });
}

export async function startHubApiServer({ port = PORT, staticRoot } = {}) {
  await syncPlatformDefaults().catch(() => null);
  const server = createHubApiServer({ staticRoot });
  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
  console.log(`Hub API listening on http://127.0.0.1:${port}`);
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  await startHubApiServer();
}

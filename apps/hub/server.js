import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  addOrUpdateUser,
  canUserHostGame,
  deleteUser,
  getAllGamesForAdmin,
  getPublicGames,
  readPlatformData,
  setGameHostsFromUser,
  updateGameVisibility,
  updateHostAssignments,
  syncPlatformDefaults,
} from "./platform-data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// The default keeps the legacy runtime unchanged. Tests can supply disposable state so they do
// not create accounts or sessions in a contributor's local store.
const STORE_PATH = process.env.HUB_DATA_FILE || path.join(__dirname, "data", "store.json");
const OWNER_ADMIN_CODE = process.env.OWNER_ADMIN_CODE || "aisc-admin";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const PORT = Number(process.env.PLATFORM_SERVER_PORT || process.env.PORT || 8787);
const COOKIE_NAME = "party_games_session";
const SCHOOL_DOMAIN = "@aischennai.org";
const ADMIN_HEADER = "x-owner-admin-code";

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

async function ensureStore() {
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify(defaultStore, null, 2));
  }
}

async function readStore() {
  await ensureStore();
  const raw = await fs.readFile(STORE_PATH, "utf8");
  return JSON.parse(raw);
}

async function writeStore(store) {
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2));
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
  res.setHeader("Set-Cookie", `${encodeURIComponent(name)}=${encodeURIComponent(value)}; HttpOnly; Path=/; SameSite=Lax`);
}

function clearCookie(res, name) {
  res.setHeader("Set-Cookie", `${encodeURIComponent(name)}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
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
  const userId = sessionId ? store.sessions[sessionId] : null;
  if (!userId) return null;
  return store.users.find((user) => user.id === userId) || null;
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

async function verifyGoogleIdToken(credential) {
  const token = String(credential || "").trim();
  if (!token) {
    throw new Error("Google sign-in credential is required.");
  }

  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || "Unable to verify Google sign-in.");
  }

  if (GOOGLE_CLIENT_ID && payload.aud !== GOOGLE_CLIENT_ID) {
    throw new Error("Google sign-in was issued for a different client.");
  }

  const email = normalizeEmail(payload.email);
  if (!schoolEmail(email)) {
    throw new Error("Only @aischennai.org accounts can access The Forge.");
  }

  return {
    email,
    name: String(payload.name || payload.given_name || email.split("@")[0] || "AISC User").trim(),
    picture: String(payload.picture || "").trim(),
    googleSub: String(payload.sub || "").trim(),
  };
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

function createSession(store, userId) {
  const sessionId = crypto.randomUUID();
  store.sessions[sessionId] = userId;
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

function isAdminCodeValid(code) {
  return String(code || "").trim() && String(code || "").trim() === OWNER_ADMIN_CODE;
}

function getAdminCode(req, body) {
  return String(body?.code || req.headers[ADMIN_HEADER] || "").trim();
}

function requireAdminCode(req, body) {
  return isAdminCodeValid(getAdminCode(req, body));
}

async function handleSignup(req, res) {
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

  if (!verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    return sendJsonError(res, 401, "Incorrect password for that email.");
  }

  const sessionId = createSession(store, user.id);
  await writeStore(store);
  setCookie(res, COOKIE_NAME, sessionId);
  json(res, 200, await bootstrapPayload(store, user));
}

async function handleGoogleAuth(req, res) {
  const store = await readStore();
  const body = await readBody(req);
  const selectedRole = String(body.role || "member").trim().toLowerCase();

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
  if (selectedRole === "owner" && !isOwnerEmail) {
    return sendJsonError(res, 403, "Only caditi28@aischennai.org can sign in as owner.");
  }

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
      role: isOwnerEmail ? "owner" : "member",
      authProvider: "google",
      googleSub: profile.googleSub,
      createdAt: new Date().toISOString(),
    };
    store.users.push(user);
  } else {
    user.name = profile.name || user.name;
    user.username = user.username || profile.email.split("@")[0];
    user.avatar = profile.picture || user.avatar || "";
    user.role = isOwnerEmail ? "owner" : user.role || "member";
    user.authProvider = "google";
    user.googleSub = profile.googleSub;
  }

  if (isOwnerEmail) {
    user.role = "owner";
  }

  const sessionId = createSession(store, user.id);
  await writeStore(store);
  setCookie(res, COOKIE_NAME, sessionId);
  json(res, 200, await bootstrapPayload(store, user));
}

async function handleResetPassword(req, res) {
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
    return json(res, 200, { decks: store.decks || [] });
  }

  if (req.method === "POST") {
    if (!user) return sendJsonError(res, 401, "Not signed in.");

    const body = await readBody(req);
    const title = String(body.title || "").trim();
    const fileName = String(body.fileName || "").trim();
    const dataUrl = String(body.dataUrl || "").trim();
    const decoded = decodeDataUrl(dataUrl);

    if (!title) return sendJsonError(res, 400, "Deck name is required.");
    if (!decoded) return sendJsonError(res, 400, "A PDF file is required.");
    if (decoded.mimeType !== "application/pdf") return sendJsonError(res, 400, "Only PDF decks are supported.");

    const text = await extractPdfText(decoded.buffer).catch(() => "");
    const deck = {
      id: crypto.randomUUID(),
      title,
      fileName: fileName || `${title}.pdf`,
      mimeType: decoded.mimeType,
      text,
      uploadedByUserId: user.id,
      uploadedByName: user.name,
      createdAt: new Date().toISOString(),
    };

    store.decks = [deck, ...(store.decks || [])];
    await writeStore(store);
    return json(res, 201, { deck, decks: store.decks });
  }

  return sendJsonError(res, 405, "Method not allowed.");
}

async function handleDeckById(req, res, deckId) {
  const store = await readStore();
  const user = currentUserFromRequest(req, store);
  if (!user) return sendJsonError(res, 401, "Not signed in.");

  const index = (store.decks || []).findIndex((deck) => deck.id === deckId);
  if (index < 0) return sendJsonError(res, 404, "Deck not found.");

  if (req.method === "GET") {
    return json(res, 200, { deck: store.decks[index] });
  }

  if (req.method === "DELETE") {
    const [removed] = store.decks.splice(index, 1);
    await writeStore(store);
    return json(res, 200, { deck: removed, decks: store.decks });
  }

  return sendJsonError(res, 405, "Method not allowed.");
}

async function handlePlatformAdminVerify(req, res) {
  const body = await readBody(req);
  if (isAdminCodeValid(body.code)) {
    return json(res, 200, { ok: true });
  }
  return sendJsonError(res, 401, "Invalid owner admin code.");
}

async function handlePlatformGames(req, res) {
  const data = await readPlatformData();
  json(res, 200, { games: getPublicGames(data) });
}

async function handlePlatformAdminGames(req, res) {
  const body = req.method === "PATCH" ? await readBody(req) : {};
  if (!requireAdminCode(req, body)) return sendJsonError(res, 401, "Invalid owner admin code.");
  const data = await readPlatformData();
  json(res, 200, { games: getAllGamesForAdmin(data) });
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
  const body = req.method === "POST" || req.method === "PATCH" ? await readBody(req) : {};
  if (!requireAdminCode(req, body)) return sendJsonError(res, 401, "Invalid owner admin code.");

  const data = await readPlatformData();

  if (req.method === "GET") {
    return json(res, 200, { users: data.users });
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
  const body = await readBody(req);
  if (!requireAdminCode(req, body)) return sendJsonError(res, 401, "Invalid owner admin code.");

  const data = await readPlatformData();
  const user = data.users.find((entry) => entry.id === userId);
  if (!user) return sendJsonError(res, 404, "User not found.");

  if (req.method === "PATCH") {
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
    if (user.role === "owner" || user.id === "aditi") {
      return sendJsonError(res, 400, "You cannot delete the owner user.");
    }
    const removed = await deleteUser(userId);
    return json(res, 200, { user: removed });
  }

  return sendJsonError(res, 405, "Method not allowed.");
}

async function handlePlatformAdminGameById(req, res, gameId) {
  const body = await readBody(req);
  if (!requireAdminCode(req, body)) return sendJsonError(res, 401, "Invalid owner admin code.");

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
  const body = await readBody(req);
  if (!requireAdminCode(req, body)) return sendJsonError(res, 401, "Invalid owner admin code.");
  if (!Array.isArray(body.hostUserIds)) return sendJsonError(res, 400, "hostUserIds must be an array.");
  const game = await updateHostAssignments(gameId, body.hostUserIds);
  if (!game) return sendJsonError(res, 404, "Game not found.");
  return json(res, 200, { game });
}

export function createHubApiServer() {
  return http.createServer(async (req, res) => {
  setCorsHeaders(req, res);
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const routePath = url.pathname.startsWith("/api/") ? url.pathname.slice(4) : url.pathname;

  try {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, x-owner-admin-code",
      });
      res.end();
      return;
    }

    if (req.method === "GET" && routePath === "/bootstrap") return await handleBootstrap(req, res);
    if (req.method === "POST" && routePath === "/signup") return await handleSignup(req, res);
    if (req.method === "POST" && routePath === "/login") return await handleLogin(req, res);
    if (req.method === "POST" && routePath === "/auth/google") return await handleGoogleAuth(req, res);
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
    if (req.method === "POST" && routePath === "/platform/admin/verify") return await handlePlatformAdminVerify(req, res);
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

    return json(res, 404, { error: "Not found" });
  } catch (error) {
    console.error(error);
    return sendJsonError(res, 500, error?.message || "Server error");
  }
  });
}

export async function startHubApiServer({ port = PORT } = {}) {
  await syncPlatformDefaults().catch(() => null);
  const server = createHubApiServer();
  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
  console.log(`Hub API listening on http://127.0.0.1:${port}`);
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  await startHubApiServer();
}

// Hub persistence and HTTP routes remain JavaScript while their public contracts are exercised by integration tests.
// @ts-expect-error JavaScript module has no declaration file yet.
import { startHubApiServer } from "../../hub/server.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { platformServerPort } from "./config.js";
import { Server, type Socket } from "socket.io";
// @ts-expect-error JavaScript repository is exercised directly by Node integration tests.
import { RealtimeRoomStore, createRealtimePool } from "./realtime-room-store.js";
// @ts-expect-error JavaScript module has no declaration file yet.
import { realtimeUserFromCookie } from "../../hub/server.js";
import { registerQuizShooterRealtime } from "../../quiz-shooter/server/src/index.js";
import { registerBuildABeastRealtime } from "../../build-a-beast/server/src/index.js";

const port = platformServerPort();
const staticRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../hub/dist");

const httpServer = await startHubApiServer({ port, staticRoot });
const realtime = new Server(httpServer, { cors: { origin: true, credentials: true } });
const realtimeRooms = process.env.DATABASE_URL ? new RealtimeRoomStore(createRealtimePool(process.env.DATABASE_URL)) : null;
await realtimeRooms?.migrate();
const cleanupTimer = realtimeRooms ? setInterval(() => { void realtimeRooms.cleanup(); }, 60_000) : null;
cleanupTimer?.unref();

async function authenticateRealtimeSocket(socket: Socket, next: (error?: Error) => void) {
  try {
    const user = await realtimeUserFromCookie(socket.handshake.headers.cookie);
    if (!user) return next(new Error("Authentication is required."));
    socket.data.user = user;
    return next();
  } catch (error) {
    return next(error instanceof Error ? error : new Error("Unable to validate the session."));
  }
}

const quizShooter = realtime.of("/quiz-shooter");
const buildABeast = realtime.of("/build-a-beast");
quizShooter.use(authenticateRealtimeSocket);
buildABeast.use(authenticateRealtimeSocket);
registerQuizShooterRealtime(quizShooter, { roomStore: realtimeRooms });
registerBuildABeastRealtime(buildABeast, { roomStore: realtimeRooms });

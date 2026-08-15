import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { resolve } from "node:path";
import test, { after } from "node:test";
import { io } from "socket.io-client";

const port = 4101;
const serverUrl = `http://127.0.0.1:${port}`;
const tsx = resolve(import.meta.dirname, "../../server/node_modules/.bin/tsx");
const server = spawn(tsx, ["src/index.ts"], {
  cwd: resolve(import.meta.dirname, "../../server"),
  env: { ...process.env, PORT: String(port) },
  stdio: "ignore",
});

async function waitForHealth() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${serverUrl}/health`);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  throw new Error("Build-a-Beast server did not become healthy.");
}

function connect() {
  const socket = io(serverUrl, { transports: ["websocket"] });
  return once(socket, "connect").then(() => socket);
}

function emit(socket, event, payload) {
  return new Promise((resolveAck, rejectAck) => {
    const timer = setTimeout(() => rejectAck(new Error(`${event} acknowledgement timed out.`)), 3_000);
    socket.emit(event, payload, (response) => {
      clearTimeout(timer);
      resolveAck(response);
    });
  });
}

after(() => server.kill());

test("Build-a-Beast rejects an empty username and accepts a fresh lobby join after disconnect", async () => {
  await waitForHealth();
  const host = await connect();
  const invalidPlayer = await connect();
  const player = await connect();
  const reconnectingPlayer = await connect();

  try {
    const created = await emit(host, "create-room", { hostName: "Host", challengeId: "physics-bridge" });
    assert.equal(created.ok, true);
    assert.equal(created.challenge.id, "physics-bridge");

    const invalid = await emit(invalidPlayer, "join-room", { roomId: created.room.id, name: "" });
    assert.equal(invalid.ok, false);

    const joined = await emit(player, "join-room", { roomId: created.room.id, name: "Player one" });
    assert.equal(joined.ok, true);
    player.disconnect();
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 50));

    const rejoined = await emit(reconnectingPlayer, "join-room", { roomId: created.room.id, name: "Player one" });
    assert.equal(rejoined.ok, true);
  } finally {
    host.disconnect();
    invalidPlayer.disconnect();
    player.disconnect();
    reconnectingPlayer.disconnect();
  }
});

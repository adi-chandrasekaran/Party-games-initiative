import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { resolve } from "node:path";
import test, { after } from "node:test";
import { io } from "socket.io-client";

const port = 4001;
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
  throw new Error("Quiz Shooter server did not become healthy.");
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

test("Quiz Shooter rejects an empty username and keeps a lobby joinable after disconnect", async () => {
  await waitForHealth();
  const host = await connect();
  const invalidPlayer = await connect();
  const player = await connect();
  const reconnectingPlayer = await connect();

  try {
    const created = await emit(host, "create-room", { hostName: "Host" });
    assert.equal(created.ok, true);

    const invalid = await emit(invalidPlayer, "join-room", {
      roomId: created.room.id,
      name: "",
      mapId: "village",
    });
    assert.equal(invalid.ok, false);

    const joined = await emit(player, "join-room", {
      roomId: created.room.id,
      name: "Player one",
      mapId: "village",
    });
    assert.equal(joined.ok, true);
    player.disconnect();
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 50));

    const rejoined = await emit(reconnectingPlayer, "join-room", {
      roomId: created.room.id,
      name: "Player one",
      mapId: "laser",
    });
    assert.equal(rejoined.ok, true);
  } finally {
    host.disconnect();
    invalidPlayer.disconnect();
    player.disconnect();
    reconnectingPlayer.disconnect();
  }
});

test("Quiz Shooter host can hand a selected question deck to the room", async () => {
  await waitForHealth();
  const host = await connect();

  try {
    const created = await emit(host, "create-room", { hostName: "Host" });
    const deck = [{
      id: "deck-question",
      prompt: "What is the test answer?",
      choices: [{ id: "a", text: "Correct" }, { id: "b", text: "Incorrect" }],
      correctChoiceId: "a",
    }];
    const updated = await emit(host, "update-deck", { roomId: created.room.id, deck });

    assert.equal(updated.ok, true);
    assert.deepEqual(updated.deck, deck);
  } finally {
    host.disconnect();
  }
});

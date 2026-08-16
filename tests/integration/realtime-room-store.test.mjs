import test from "node:test";
import assert from "node:assert/strict";
const databaseUrl = "postgresql://forge:forge-local-password@127.0.0.1:5432/forge";
const { RealtimeRoomStore, createRealtimePool } = await import("../../apps/platform-server/src/realtime-room-store.js");

test("realtime rooms are shared, expire, and can be cleaned up", async () => {
  const firstPool = createRealtimePool(databaseUrl);
  const secondPool = createRealtimePool(databaseUrl);
  const first = new RealtimeRoomStore(firstPool);
  const second = new RealtimeRoomStore(secondPool);
  const roomId = `room-${Date.now()}`;
  try {
    await first.migrate();
    await first.save({ gameId: "quiz-shooter", roomId, payload: { hostUserId: "host", participants: ["host"] }, expiresAt: new Date(Date.now() + 60_000) });
    assert.deepEqual((await second.load("quiz-shooter", roomId))?.payload, { hostUserId: "host", participants: ["host"] });
    await first.save({ gameId: "quiz-shooter", roomId: `${roomId}-expired`, payload: {}, expiresAt: new Date(Date.now() - 1_000) });
    assert.ok(await second.cleanup() >= 1, "removes this test's expired room even when another suite left an expired room behind");
  } finally {
    await firstPool.end();
    await secondPool.end();
  }
});

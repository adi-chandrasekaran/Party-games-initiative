import test from "node:test";
import assert from "node:assert/strict";

process.env.DATABASE_URL = "postgresql://forge:forge-local-password@127.0.0.1:5432/forge";

const { closePostgresStore, migratePostgresStore, readPostgresStore, writePostgresStore } = await import("../../apps/hub/postgres-store.js");
const defaultStore = { users: [], sessions: {}, games: { counts: {}, history: [], userPlays: {}, ratings: [] }, decks: [], chats: { threads: [] }, privateApps: { all: [], invites: {}, memberships: {}, requests: {} } };

test("PostgreSQL migration persists and restores platform state", async () => {
  const storeId = `postgres-store-test-${process.pid}-${Date.now()}`;
  await migratePostgresStore(defaultStore, storeId);
  const original = await readPostgresStore(defaultStore, storeId);
  const next = { ...original, users: [{ id: `postgres-${Date.now()}` }] };
  await writePostgresStore(next, storeId);
  assert.deepEqual((await readPostgresStore(defaultStore, storeId)).users, next.users);
  await closePostgresStore();
});

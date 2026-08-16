import { Pool } from "pg";

const STORE_ID = "platform";
let pool;

function databaseUrl() {
  return process.env.DATABASE_URL || "";
}

function databasePool() {
  if (!pool) pool = new Pool({ connectionString: databaseUrl() });
  return pool;
}

export function usesPostgres() {
  return Boolean(databaseUrl());
}

export async function migratePostgresStore(defaultStore) {
  const client = await databasePool().connect();
  try {
    await client.query("BEGIN");
    await client.query(`CREATE TABLE IF NOT EXISTS platform_store (id TEXT PRIMARY KEY, payload JSONB NOT NULL, version BIGINT NOT NULL DEFAULT 0, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
    await client.query("INSERT INTO platform_store (id, payload) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO NOTHING", [STORE_ID, JSON.stringify(defaultStore)]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function readPostgresStore(defaultStore) {
  await migratePostgresStore(defaultStore);
  const { rows } = await databasePool().query("SELECT payload FROM platform_store WHERE id = $1", [STORE_ID]);
  return rows[0].payload;
}

export async function writePostgresStore(store) {
  const { rowCount } = await databasePool().query("UPDATE platform_store SET payload = $1::jsonb, version = version + 1, updated_at = now() WHERE id = $2", [JSON.stringify(store), STORE_ID]);
  if (rowCount !== 1) throw new Error("Platform persistence row is missing.");
}

export async function closePostgresStore() {
  if (pool) await pool.end();
  pool = undefined;
}

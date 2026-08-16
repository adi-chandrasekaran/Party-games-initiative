import { Pool } from "pg";

export function createRealtimePool(connectionString) {
  return new Pool({ connectionString });
}

export class RealtimeRoomStore {
  constructor(pool) {
    if (!(pool instanceof Pool)) throw new Error("RealtimeRoomStore requires a PostgreSQL pool.");
    this.pool = pool;
  }

  async migrate() {
    await this.pool.query(`CREATE TABLE IF NOT EXISTS realtime_rooms (
      game_id TEXT NOT NULL,
      room_id TEXT NOT NULL,
      payload JSONB NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (game_id, room_id)
    )`);
  }

  async save(room) {
    await this.pool.query(
      `INSERT INTO realtime_rooms (game_id, room_id, payload, expires_at) VALUES ($1, $2, $3::jsonb, $4)
       ON CONFLICT (game_id, room_id) DO UPDATE SET payload = EXCLUDED.payload, expires_at = EXCLUDED.expires_at, updated_at = now()`,
      [room.gameId, room.roomId, JSON.stringify(room.payload), room.expiresAt],
    );
  }

  async load(gameId, roomId) {
    const { rows } = await this.pool.query(`SELECT payload, expires_at FROM realtime_rooms WHERE game_id = $1 AND room_id = $2 AND expires_at > now()`, [gameId, roomId]);
    return rows[0] ? { payload: rows[0].payload, expiresAt: rows[0].expires_at } : null;
  }

  async cleanup() {
    const { rowCount } = await this.pool.query(`DELETE FROM realtime_rooms WHERE expires_at <= now()`);
    return rowCount || 0;
  }

  async delete(gameId, roomId) {
    await this.pool.query(`DELETE FROM realtime_rooms WHERE game_id = $1 AND room_id = $2`, [gameId, roomId]);
  }
}

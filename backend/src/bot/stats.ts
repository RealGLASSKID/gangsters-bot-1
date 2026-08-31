import { db } from "../db/connection";

export interface PlayerStats {
  phone: string;
  gamesPlayed: number;
  gamesWon: number;
  lastGameId: string | null;
  updatedAt: number;
}

const selectStats = db.prepare<[string], PlayerStats>(
  `SELECT * FROM stats WHERE phone = ?`
);
const upsertStats = db.prepare(`
  INSERT INTO stats (phone, gamesPlayed, gamesWon, lastGameId, updatedAt)
  VALUES (@phone, @gamesPlayed, @gamesWon, @lastGameId, @updatedAt)
  ON CONFLICT(phone) DO UPDATE SET
    gamesPlayed = excluded.gamesPlayed,
    gamesWon = excluded.gamesWon,
    lastGameId = excluded.lastGameId,
    updatedAt = excluded.updatedAt
`);

export function getStats(phone: string): PlayerStats {
  return (
    selectStats.get(phone) ?? {
      phone,
      gamesPlayed: 0,
      gamesWon: 0,
      lastGameId: null,
      updatedAt: 0,
    }
  );
}

export function recordGameResult(phone: string, gameId: string, won: boolean): PlayerStats {
  const current = getStats(phone);
  const next: PlayerStats = {
    phone,
    gamesPlayed: current.gamesPlayed + 1,
    gamesWon: current.gamesWon + (won ? 1 : 0),
    lastGameId: gameId,
    updatedAt: Date.now(),
  };
  upsertStats.run(next);
  return next;
}

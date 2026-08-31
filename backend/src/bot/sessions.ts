import { randomUUID } from "node:crypto";
import { db } from "../db/connection";
import type { GameSession, SessionStatus } from "../types";

type SessionRow = Omit<GameSession, "state"> & { state: string };

function deserialize(row: SessionRow): GameSession {
  return { ...row, state: JSON.parse(row.state) };
}

const selectActive = db.prepare<[string], SessionRow>(
  `SELECT * FROM sessions WHERE phone = ? AND status = 'active' LIMIT 1`
);
const insertSession = db.prepare(`
  INSERT INTO sessions (id, gameId, phone, status, state, createdAt, updatedAt)
  VALUES (@id, @gameId, @phone, @status, @state, @createdAt, @updatedAt)
`);
const updateStateStmt = db.prepare(`UPDATE sessions SET state = ?, updatedAt = ? WHERE id = ?`);
const updateStatusStmt = db.prepare(`UPDATE sessions SET status = ?, updatedAt = ? WHERE id = ?`);
const listRecentStmt = db.prepare<[number], SessionRow>(
  `SELECT * FROM sessions ORDER BY updatedAt DESC LIMIT ?`
);

/** A player can only have one active session at a time — keeps turn
 * routing in the message handler simple (no "which game did you mean"). */
export function getActiveSession(phone: string): GameSession | null {
  const row = selectActive.get(phone);
  return row ? deserialize(row) : null;
}

export function createSession(
  phone: string,
  gameId: string,
  initialState: Record<string, unknown>
): GameSession {
  const now = Date.now();
  const session: GameSession = {
    id: randomUUID(),
    gameId,
    phone,
    status: "active",
    state: initialState,
    createdAt: now,
    updatedAt: now,
  };
  insertSession.run({ ...session, state: JSON.stringify(initialState) });
  return session;
}

export function updateSessionState(sessionId: string, state: Record<string, unknown>): void {
  updateStateStmt.run(JSON.stringify(state), Date.now(), sessionId);
}

export function setSessionStatus(sessionId: string, status: SessionStatus): void {
  updateStatusStmt.run(status, Date.now(), sessionId);
}

export function listRecentSessions(limit = 100): GameSession[] {
  return listRecentStmt.all(limit).map(deserialize);
}

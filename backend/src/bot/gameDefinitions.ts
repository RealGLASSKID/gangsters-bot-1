import { db } from "../db/connection";
import type { GameDefinition } from "../types";

const selectGame = db.prepare<[string], GameDefinition>(`SELECT * FROM games WHERE id = ?`);
const listGamesStmt = db.prepare<[], GameDefinition>(`SELECT * FROM games ORDER BY createdAt ASC`);
const insertGame = db.prepare(`
  INSERT INTO games (id, name, description, enabled, createdAt)
  VALUES (@id, @name, @description, @enabled, @createdAt)
`);
const updateGameMeta = db.prepare(`UPDATE games SET name = ?, description = ? WHERE id = ?`);
const setEnabledStmt = db.prepare(`UPDATE games SET enabled = ? WHERE id = ?`);

export function listGameDefinitions(): GameDefinition[] {
  return listGamesStmt.all();
}

export function getGameDefinition(id: string): GameDefinition | null {
  return selectGame.get(id) ?? null;
}

/** Insert if new, otherwise refresh name/description (code is the source
 * of truth for those — only `enabled` is dashboard-owned). */
export function upsertGameDefinition(def: {
  id: string;
  name: string;
  description: string;
  enabled?: boolean;
}): void {
  const existing = selectGame.get(def.id);
  if (existing) {
    updateGameMeta.run(def.name, def.description, def.id);
    return;
  }
  insertGame.run({
    id: def.id,
    name: def.name,
    description: def.description,
    enabled: def.enabled === false ? 0 : 1,
    createdAt: Date.now(),
  });
}

export function setGameEnabled(id: string, enabled: boolean): void {
  const result = setEnabledStmt.run(enabled ? 1 : 0, id);
  if (result.changes === 0) throw new Error(`No such game: ${id}`);
}

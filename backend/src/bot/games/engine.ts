import type { BotUser, GameSession } from "../../types";

export interface GameTurnResult {
  reply: string;
  finished?: boolean;
  /** When finished, whether the player beat the house. Defaults to false. */
  won?: boolean;
  newState?: Record<string, unknown>;
}

/**
 * A Game is stateless itself — all state lives in the GameSession row.
 * Drop a file in this folder that exports one (via `defineGame` or a
 * `Game` object). The loader picks it up on boot. No index.ts edit needed.
 */
export interface Game {
  id: string;
  name: string;
  description: string;
  /** Extra names `play <alias>` will accept. */
  aliases?: string[];

  start(user: BotUser): Promise<{ state: Record<string, unknown>; reply: string }>;
  turn(session: GameSession, user: BotUser, input: string): Promise<GameTurnResult>;
}

const registry = new Map<string, Game>();

export function registerGame(game: Game): void {
  const id = game.id.trim().toLowerCase();
  if (registry.has(id)) {
    console.warn(`[games] duplicate id "${id}" — later file wins`);
  }
  registry.set(id, { ...game, id });
}

export function getGame(idOrAlias: string): Game | undefined {
  const key = idOrAlias.trim().toLowerCase();
  const direct = registry.get(key);
  if (direct) return direct;
  for (const game of registry.values()) {
    if (game.aliases?.some((alias) => alias.toLowerCase() === key)) return game;
  }
  return undefined;
}

export function listRegisteredGames(): Game[] {
  return Array.from(registry.values()).sort((a, b) => a.id.localeCompare(b.id));
}

export function isGame(value: unknown): value is Game {
  if (!value || typeof value !== "object") return false;
  const g = value as Game;
  return (
    typeof g.id === "string" &&
    g.id.trim().length > 0 &&
    typeof g.name === "string" &&
    typeof g.description === "string" &&
    typeof g.start === "function" &&
    typeof g.turn === "function"
  );
}

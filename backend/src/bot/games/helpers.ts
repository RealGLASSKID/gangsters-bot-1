import type { BotUser, GameSession } from "../../types";
import type { Game, GameTurnResult } from "./engine";

/** Display name fallback used in almost every prompt. */
export function who(user: BotUser, fallback = "boss"): string {
  return user.displayName || fallback;
}

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

export function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ");
}

export function again(gameId: string): string {
  return `\n\nSend *play ${gameId}* to go again.`;
}

export function win(reply: string, gameId: string): GameTurnResult {
  return { reply: reply + again(gameId), finished: true, won: true };
}

export function lose(reply: string, gameId: string): GameTurnResult {
  return { reply: reply + again(gameId), finished: true, won: false };
}

export function next<S extends Record<string, unknown>>(reply: string, state: S): GameTurnResult {
  return { reply, newState: state };
}

export function triesLeft(left: number, singular = "try", plural = "tries"): string {
  return `${left} ${left === 1 ? singular : plural} left`;
}

/**
 * If `input` is not one of `choices`, return a hint reply.
 * Otherwise return the matched choice (lowercased).
 */
export function matchChoice(
  input: string,
  choices: readonly string[],
  hint: string
): { ok: true; value: string } | { ok: false; reply: GameTurnResult } {
  const value = input.trim().toLowerCase();
  if (choices.includes(value)) return { ok: true, value };
  return { ok: false, reply: { reply: hint } };
}

/**
 * Typed wrapper around `Game`. Use this in every game file so state stays
 * a real type instead of `Record<string, unknown>` casts.
 *
 * Export the result as `game` (or any name). The folder loader registers
 * every exported value that looks like a Game.
 */
export function defineGame<S extends Record<string, unknown>>(spec: {
  id: string;
  name: string;
  description: string;
  aliases?: string[];
  start: (user: BotUser) => { state: S; reply: string } | Promise<{ state: S; reply: string }>;
  turn: (ctx: {
    state: S;
    user: BotUser;
    /** trimmed + lowercased */
    input: string;
    /** original trimmed text */
    raw: string;
    session: GameSession;
  }) => GameTurnResult | Promise<GameTurnResult>;
}): Game {
  return {
    id: spec.id,
    name: spec.name,
    description: spec.description,
    aliases: spec.aliases,
    async start(user) {
      const out = await spec.start(user);
      return { state: out.state, reply: out.reply };
    },
    async turn(session, user, rawInput) {
      const raw = rawInput.trim();
      return spec.turn({
        state: session.state as S,
        user,
        input: raw.toLowerCase(),
        raw,
        session,
      });
    },
  };
}

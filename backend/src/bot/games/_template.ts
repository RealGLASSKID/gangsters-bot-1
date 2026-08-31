/**
 * Copy this file to `yourgame.ts` (drop the underscore) and fill it in.
 * The loader ignores files that start with `_`.
 *
 * Restart gangster-bot-brain. `games` and `play yourid` pick it up.
 * Dashboard Games page can enable/disable it. No other file edits.
 */
import { defineGame, who, win, lose } from "./helpers";

interface State {
  // your session fields
  note: string;
}

export const game = defineGame<State>({
  id: "example",
  name: "Example Job",
  description: "Replace this with a one-line pitch.",
  aliases: ["sample"],

  start(user) {
    return {
      state: { note: "fresh" },
      reply: `${who(user)}, this is a stub. Reply *done* to finish a win, anything else to lose.`,
    };
  },

  turn({ input }) {
    if (input === "done") return win("Stub complete.", "example");
    return lose("Stub folded.", "example");
  },
});

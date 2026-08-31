import { defineGame, who, pick, matchChoice, win, lose } from "./helpers";

const MOVES = ["rock", "paper", "scissors"] as const;

function beats(a: string, b: string): boolean {
  return (
    (a === "rock" && b === "scissors") ||
    (a === "paper" && b === "rock") ||
    (a === "scissors" && b === "paper")
  );
}

export const game = defineGame<Record<string, never>>({
  id: "showdown",
  name: "Showdown",
  description: "Rock, paper, scissors. Call your move.",
  aliases: ["rps", "roshambo"],

  start(user) {
    return {
      state: {},
      reply: `Showdown, ${who(user)}.\nReply *rock*, *paper*, or *scissors*.`,
    };
  },

  turn({ input }) {
    const choice = matchChoice(input, MOVES, "Call *rock*, *paper*, or *scissors*.");
    if (!choice.ok) return choice.reply;

    const house = pick(MOVES);
    const line = `You threw *${choice.value}*. House threw *${house}*.`;
    if (choice.value === house) return lose(`${line} Tie — walk it off.`, "showdown");
    return beats(choice.value, house)
      ? win(`${line} You take the round.`, "showdown")
      : lose(`${line} House takes it.`, "showdown");
  },
});

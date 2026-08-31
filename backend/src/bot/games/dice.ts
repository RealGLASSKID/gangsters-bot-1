import { defineGame, who, randInt, matchChoice, win, lose } from "./helpers";

export const game = defineGame<Record<string, never>>({
  id: "dice",
  name: "High Roller",
  description: "Call high or low, then roll two dice. 7 is a push.",
  aliases: ["roll", "highroller"],

  start(user) {
    return {
      state: {},
      reply: [
        `High Roller time, ${who(user)}.`,
        "Call it: *high* (8–12) or *low* (2–6).",
        "A 7 is a push — nobody wins.",
      ].join("\n"),
    };
  },

  turn({ input }) {
    const choice = matchChoice(input, ["high", "low"], "Say *high* or *low*. That's the whole move.");
    if (!choice.ok) return choice.reply;

    const a = randInt(1, 6);
    const b = randInt(1, 6);
    const total = a + b;
    const dice = `${a} + ${b} = *${total}*`;

    if (total === 7) {
      return lose(`Dice say ${dice}. Seven — push. Walk even.`, "dice");
    }

    const high = total >= 8;
    const won = choice.value === "high" ? high : !high;
    const line = `Dice say ${dice}. You called *${choice.value}* — ${won ? "that's a hit" : "table takes it"}.`;
    return won ? win(line, "dice") : lose(line, "dice");
  },
});

import { defineGame, who, pick, matchChoice, win, lose } from "./helpers";

const LANES = ["1", "2", "3"] as const;

export const game = defineGame<Record<string, never>>({
  id: "race",
  name: "Night Race",
  description: "Pick a lane (1, 2, or 3). One hits the line first.",
  aliases: ["lanes"],

  start(user) {
    return {
      state: {},
      reply: `Engines up, ${who(user, "driver")}.\nThree lanes. Reply *1*, *2*, or *3*.`,
    };
  },

  turn({ input }) {
    const choice = matchChoice(input, LANES, "Pick a lane: *1*, *2*, or *3*.");
    if (!choice.ok) return choice.reply;

    const winner = pick(LANES);
    const board = LANES.map((lane) =>
      lane === winner ? `Lane ${lane}: FINISH` : `Lane ${lane}: still coming`
    ).join("\n");

    return choice.value === winner
      ? win(`${board}\n\nLane *${choice.value}* hits first. You take the night.`, "race")
      : lose(`${board}\n\nLane *${winner}* takes it. You were in *${choice.value}*.`, "race");
  },
});

import { defineGame, who, randInt, matchChoice, next, win, lose } from "./helpers";

type Stage = "scouting" | "cracking" | "getaway";

interface State {
  stage: Stage;
  heat: number;
  take: number;
}

const PROMPT: Record<Stage, string> = {
  scouting: "Casing the spot. Reply *quiet* to take it slow, or *fast* to rush it.",
  cracking: "You're at the safe. Reply *crack* for the combo, or *blast* to force it (loud).",
  getaway: "Cash in hand. Reply *drive* to run, or *hide* and wait it out.",
};

export const game = defineGame<State>({
  id: "heist",
  name: "The Heist",
  description: "Three-step caper: scout, crack, get away clean.",
  aliases: ["caper", "job"],

  start(user) {
    return {
      state: { stage: "scouting", heat: 0, take: 0 },
      reply: `Alright ${who(user, "crew")}, you're in.\n\n${PROMPT.scouting}`,
    };
  },

  turn({ state, input, raw }) {
    if (state.stage === "scouting") {
      const choice = matchChoice(input, ["quiet", "fast"], `Say *quiet* or *fast*, not "${raw}".`);
      if (!choice.ok) return choice.reply;
      const heat = state.heat + (choice.value === "fast" ? randInt(10, 50) : randInt(0, 15));
      const flavor =
        choice.value === "fast"
          ? "You rush it. Sloppy, but you're in position."
          : "You take your time. Clean work — nobody clocked you.";
      return next(`${flavor}\n\n${PROMPT.cracking}`, { ...state, stage: "cracking", heat });
    }

    if (state.stage === "cracking") {
      const choice = matchChoice(input, ["crack", "blast"], `Say *crack* or *blast*, not "${raw}".`);
      if (!choice.ok) return choice.reply;
      const loud = choice.value === "blast";
      const heat = state.heat + (loud ? randInt(20, 70) : randInt(0, 20));
      const take = loud ? randInt(8000, 12000) : randInt(4000, 7000);
      const flavor = loud
        ? `Boom. Safe's open, but that noise woke the block. You grab $${take}.`
        : `Tumblers click. Quiet as a church. You grab $${take}.`;
      return next(`${flavor}\n\n${PROMPT.getaway}`, { ...state, stage: "getaway", heat, take });
    }

    const choice = matchChoice(input, ["drive", "hide"], `Say *drive* or *hide*, not "${raw}".`);
    if (!choice.ok) return choice.reply;
    const caught = Math.random() * 100 < state.heat;
    if (caught) {
      const how = choice.value === "drive" ? "don't make the corner" : "get found in the hiding spot";
      return lose(`Close call goes the wrong way. You ${how}. Walk away with nothing.`, "heist");
    }
    return win(`You get clear. Job's done — *$${state.take}* and nobody the wiser.`, "heist");
  },
});

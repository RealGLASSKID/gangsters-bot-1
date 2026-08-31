import { defineGame, who, randInt, next, win, lose, triesLeft } from "./helpers";

interface State {
  code: number;
  tries: number;
  maxTries: number;
}

export const game = defineGame<State>({
  id: "vault",
  name: "Vault Code",
  description: "Guess the combination (1–100) in 7 tries.",
  aliases: ["safe", "code"],

  start(user) {
    return {
      state: { code: randInt(1, 100), tries: 0, maxTries: 7 },
      reply: [
        `${who(user, "Crew")} — the vault is locked.`,
        "Combination is *1* to *100*. You get *7* tries.",
        "Reply with a number. *quit* walks away.",
      ].join("\n"),
    };
  },

  turn({ state, raw }) {
    const guess = Number.parseInt(raw, 10);
    if (!Number.isInteger(guess) || guess < 1 || guess > 100) {
      return { reply: "Send a whole number from *1* to *100*." };
    }

    const tries = state.tries + 1;
    if (guess === state.code) {
      return win(`Click. Opens on try ${tries}. Combination was *${state.code}*.`, "vault");
    }
    if (tries >= state.maxTries) {
      return lose(`Lockout. The combination was *${state.code}*.`, "vault");
    }
    const hint = guess < state.code ? "too low" : "too high";
    return next(`${guess} is ${hint}. ${triesLeft(state.maxTries - tries)}.`, { ...state, tries });
  },
});
